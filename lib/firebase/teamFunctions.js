// src/lib/firebase/teamFunctions.js
import { auth, db } from './firebaseConfig';
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
  serverTimestamp,
  increment, // <-- added
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { deleteEventImage, deleteTeamImage } from './storageFunctions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { buildTeamKeywords } from '@/helpers/buildTeamKeywords';

// Utility: Generate a short random join code
function generateTeamCode() {
  return uuidv4().split('-')[0];
}

/**
 * Create a new Team (only for coach/company) without an image.
 */
export async function createTeam(userId, teamName, isPublic = false, description = '') {
  const functions = getFunctions();
  const create = httpsCallable(functions, 'createTeam');
  const res = await create({
    name: teamName,
    isPublic: !!isPublic,
    description: typeof description === 'string' ? description : '',
  });
  return res.data.teamId;
}

// NEW: mod management
export async function addTeamMod(teamId, userId) {
  const fn = httpsCallable(getFunctions(), 'addTeamMod');
  return (await fn({ teamId, userId })).data;
}
export async function removeTeamMod(teamId, userId) {
  const fn = httpsCallable(getFunctions(), 'removeTeamMod');
  return (await fn({ teamId, userId })).data;
}

/**
 * Update a team document with a new imageURL.
 */
export async function updateTeamImage(teamId, imageURL) {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, { imageURL });
}

/**
 * Join a team via joinCode.
 */
// SAFE wrapper to join a team by code via Cloud Function (replaces broken direct Firestore version)
export async function joinTeam(code) {
  const fn = httpsCallable(getFunctions(), 'joinTeamByCode');
  return (await fn({ code })).data;   // { pending: boolean, ... }
}

/**
 * Leave a team.
 */
export async function leaveTeam(userId, teamId) {
  if (!teamId) throw new Error('Missing teamId');
  const functions = getFunctions();
  const leave = httpsCallable(functions, 'leaveTeam');
  const res = await leave({ teamId });
  return res.data;
}

/**
 * Create an event under a team (coach/company only).
 */
export async function createEvent(
  teamId,
  eventName,
  description,
  startDate,
  endDate,
  imageURL = '',
  createdBy,
  latitude,
  longitude,
  locationAddress,
  resultsVisibility = 'team' // NEW: event-level visibility (default: team members)
) {
  const eventsColRef = collection(db, 'teams', teamId, 'events');
  const eventData = {
    name: eventName,
    description,
    startDate,
    endDate,
    imageURL,
    createdBy,
    createdAt: new Date(),
    location: {
      lat: latitude,
      lon: longitude,
      address: locationAddress
    },
    resultsVisibility, // NEW
  };
  const docRef = await addDoc(eventsColRef, eventData);
  return docRef;
}

/**
 * Share a newly created test result into an event.
 */
export async function shareTestResult(teamId, eventId, userId, testId, testData) {
  const eventTestRef = doc(db, 'teams', teamId, 'events', eventId, 'testResults', testId);
  // If displayName is not provided in testData, fetch it from Firestore user document.
  let displayName = testData.displayName;
  if (!displayName) {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      displayName = userData.displayName || 'Unknown';
    } else {
      displayName = 'Unknown';
    }
  }
  const eventTestData = {
    ...testData,
    userId,
    displayName,
    originalTestDocPath: `users/${userId}/testResults/${testId}`,
    timestamp: serverTimestamp(),
  };
  await Promise.all([
    setDoc(eventTestRef, eventTestData),
    updateDoc(doc(db, 'users', userId, 'testResults', testId), {
      sharedIn: arrayUnion({ teamId, eventId }),
    }),
  ]);
}

/**
 * Share a cross-user test result into an event.
 * Writes a single event copy, and updates `sharedIn` for every owner copy.
 */
export async function shareCrossUserTestResult(teamId, eventId, ownerUids, testId, testData, actorUid) {
  if (!Array.isArray(ownerUids) || ownerUids.length === 0) {
    throw new Error('shareCrossUserTestResult: ownerUids must be a non-empty array');
  }

  const uniqOwners = Array.from(new Set(ownerUids)).filter(Boolean);
  // Defensive: ensure all owners are members of the team.
  const teamSnap = await getDoc(doc(db, 'teams', teamId));
  const teamMembers = teamSnap.exists() && Array.isArray(teamSnap.data()?.members)
    ? teamSnap.data().members
    : [];
  const allMembers = uniqOwners.every((uid) => teamMembers.includes(uid));
  if (!allMembers) {
    throw new Error('Cannot share cross-user test: not all involved users are members of this team.');
  }

  const displayUid = uniqOwners.includes(actorUid) ? actorUid : uniqOwners[0];

  const eventTestRef = doc(db, 'teams', teamId, 'events', eventId, 'testResults', testId);

  // Prefer displayName from testData; otherwise fetch it for the display user.
  let displayName = testData?.displayName;
  if (!displayName && displayUid) {
    const userDocRef = doc(db, 'users', displayUid);
    const userSnap = await getDoc(userDocRef);
    displayName = userSnap.exists() ? (userSnap.data()?.displayName || 'Unknown') : 'Unknown';
  }

  const eventTestData = {
    ...testData,
    userId: displayUid,
    displayName,
    originalTestDocPath: `users/${displayUid}/testResults/${testId}`,
    timestamp: serverTimestamp(),
  };

  await setDoc(eventTestRef, eventTestData);

  // Update sharedIn for every owner copy (best-effort; skip missing docs)
  await Promise.all(
    uniqOwners.map(async (ownerUid) => {
      try {
        await updateDoc(doc(db, 'users', ownerUid, 'testResults', testId), {
          sharedIn: arrayUnion({ teamId, eventId }),
        });
      } catch (e) {
        console.warn('shareCrossUserTestResult: failed updating sharedIn for', ownerUid, e);
      }
    })
  );
}

/**
 * Unshare a cross-user test result from an event.
 * Deletes the event copy and removes `sharedIn` for every owner copy.
 */
export async function unshareCrossUserTestResult(teamId, eventId, ownerUids, testId) {
  const uniqOwners = Array.from(new Set(ownerUids || [])).filter(Boolean);

  const eventRef = doc(db, 'teams', teamId, 'events', eventId, 'testResults', testId);
  await deleteDoc(eventRef);

  await Promise.all(
    uniqOwners.map(async (ownerUid) => {
      try {
        await updateDoc(doc(db, 'users', ownerUid, 'testResults', testId), {
          sharedIn: arrayRemove({ teamId, eventId }),
        });
      } catch (e) {
        console.warn('unshareCrossUserTestResult: failed updating sharedIn for', ownerUid, e);
      }
    })
  );
}

export async function unshareTestResult(teamId, eventId, userId, testId) {
  // remove from event collection
  const eventRef = doc(db, 'teams', teamId, 'events', eventId, 'testResults', testId);
  await deleteDoc(eventRef);
  // remove from user's sharedIn
  const userRef = doc(db, 'users', userId, 'testResults', testId);
  await updateDoc(userRef, {
    sharedIn: arrayRemove({ teamId, eventId }),
  });
}



/**
 * Update an event under a team.
 */
export async function updateEvent(teamId, eventId, updatedData) {
  const eventDocRef = doc(db, 'teams', teamId, 'events', eventId);
  await updateDoc(eventDocRef, updatedData); // supports { resultsVisibility: 'team' | 'staff' }
}

/**
 * Delete an event under a team.
 */
export async function deleteEvent(teamId, eventId) {
  const eventDocRef = doc(db, 'teams', teamId, 'events', eventId);
  const eventSnap = await getDoc(eventDocRef);

  if (eventSnap.exists()) {
    const eventData = eventSnap.data();
    try {
      if (eventData.imageURL) {
        await deleteEventImage(teamId, eventId);
      }
    } catch (error) {
      console.warn('Event image deletion failed, proceeding anyway:', error);
    }

    const testResultsRef = collection(db, 'teams', teamId, 'events', eventId, 'testResults');
    const testResultsSnapshot = await getDocs(testResultsRef);
    const deleteTestResultsPromises = testResultsSnapshot.docs.map((docSnap) =>
      deleteDoc(docSnap.ref)
    );
    await Promise.all(deleteTestResultsPromises);
    await deleteDoc(eventDocRef);
  }
}

/**
 * Update a team document.
 */
export async function updateTeam(teamId, updatedData) {
  const teamRef = doc(db, 'teams', teamId);
  const payload = { ...updatedData };

  // NEW: refresh keywords when name changes
  if (typeof updatedData.name === 'string') {
    payload.keywords_en = buildTeamKeywords(updatedData.name);
  }

  await updateDoc(teamRef, payload);
}

/**
 * Delete a team document and associated image.
 */
export async function deleteTeam(teamId) {
  const teamDocRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamDocRef);
  if (teamSnap.exists()) {
    const teamData = teamSnap.data();
    if (teamData.imageURL) {
      try { await deleteTeamImage(teamId); } catch(_) {}
    }
  }

  // Delete timeline entries (avoid post-delete listener permission errors)
  const timelineRef = collection(db, 'teams', teamId, 'timeline');
  const timelineSnap = await getDocs(timelineRef);
  await Promise.all(timelineSnap.docs.map(d => deleteDoc(d.ref)));

  // Delete all events (and nested testResults)
  const eventsRef = collection(db, 'teams', teamId, 'events');
  const eventsSnapshot = await getDocs(eventsRef);
  await Promise.all(eventsSnapshot.docs.map((d) => deleteEvent(teamId, d.id)));

  // Delete joinRequests
  const joinRequestsRef = collection(db, 'teams', teamId, 'joinRequests');
  const joinRequestsSnapshot = await getDocs(joinRequestsRef);
  await Promise.all(joinRequestsSnapshot.docs.map((d) => deleteDoc(d.ref)));

  // Finally delete team doc
  await deleteDoc(teamDocRef);
}

/**
 * Remove a member from a team (coach/company only).
 */
export async function removeTeamMember(teamId, memberId) {
  const fn = httpsCallable(getFunctions(), 'removeTeamMember');
  return (await fn({ teamId, memberId })).data;
}

/**
 * Add a timeline entry to a team.
 */
export async function addTeamInfoEntry(teamId, { title, content, createdBy }) {
  const colRef = collection(db, 'teams', teamId, 'timeline');
  const payload = {
    title: (title || '').trim(),
    content: (content || '').trim(),
    createdAt: serverTimestamp(),
    createdBy,
  };
  if (!payload.content && !payload.title) {
    throw new Error('Content or title is required.');
  }
  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

/**
 * Delete a timeline entry (owner only in UI).
 */
export async function deleteTeamInfoEntry(teamId, entryId) {
  const docRef = doc(db, 'teams', teamId, 'timeline', entryId);
  await deleteDoc(docRef);
}

/**
 * Update a team timeline entry.
 */
export async function updateTeamInfoEntry(teamId, entryId, { title, content }) {
  const docRef = doc(db, 'teams', teamId, 'timeline', entryId);
  const payload = {
    title: (title || '').trim(),
    content: (content || '').trim(),
  };
  if (!payload.content && !payload.title) {
    throw new Error('Content or title is required.');
  }
  await updateDoc(docRef, payload);
}

/**
 * Add a timeline entry to an event.
 */
export async function addEventInfoEntry(teamId, eventId, { title, content, createdBy }) {
  const colRef = collection(db, 'teams', teamId, 'events', eventId, 'timeline');
  const payload = {
    title: (title || '').trim(),
    content: (content || '').trim(),
    createdAt: serverTimestamp(),
    createdBy,
  };
  if (!payload.content && !payload.title) {
    throw new Error('Content or title is required.');
  }
  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

/**
 * Delete an event timeline entry.
 */
export async function deleteEventInfoEntry(teamId, eventId, entryId) {
  const docRef = doc(db, 'teams', teamId, 'events', eventId, 'timeline', entryId);
  await deleteDoc(docRef);
}

/**
 * Update an event timeline entry.
 */
export async function updateEventInfoEntry(teamId, eventId, entryId, { title, content }) {
  const docRef = doc(db, 'teams', teamId, 'events', eventId, 'timeline', entryId);
  const payload = {
    title: (title || '').trim(),
    content: (content || '').trim(),
  };
  if (!payload.content && !payload.title) {
    throw new Error('Content or title is required.');
  }
  await updateDoc(docRef, payload);
}