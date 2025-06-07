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
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { deleteEventImage, deleteTeamImage } from './storageFunctions';

// Utility: Generate a short random join code
function generateTeamCode() {
  return uuidv4().split('-')[0];
}

/**
 * Create a new Team (only for coach/company) without an image.
 */
export async function createTeam(userId, teamName, isPublic = false) {
  const teamId = uuidv4();
  const newTeam = {
    name: teamName,
    imageURL: '',
    joinCode: generateTeamCode(),
    createdBy: userId,
    members: [userId],
    isPublic, // Add public/private status
    createdAt: new Date(),
    memberCount: 1,
  };

  await setDoc(doc(db, 'teams', teamId), newTeam);
  return teamId;
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
export async function joinTeam(userId, code) {
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('joinCode', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('No team found with the given code.');
  const teamDoc = snap.docs[0];
  await updateDoc(teamRef, {
    members: arrayUnion(userId),
    memberCount: increment(1) // Firestore increment
  });
  return teamDoc.id;
}

/**
 * Leave a team.
 */
export async function leaveTeam(userId, teamId) {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);
  if (!teamSnap.exists()) throw new Error('Team does not exist.');
  const teamData = teamSnap.data();
  if (teamData.createdBy === userId) throw new Error("You can't leave the team because you're the creator.");
  await updateDoc(teamRef, {
    members: arrayRemove(userId),
    memberCount: increment(-1)
  });
  return true;
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
  locationAddress
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
    }
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
  await updateDoc(eventDocRef, updatedData);
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
  await updateDoc(teamRef, updatedData);
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
      await deleteTeamImage(teamId);
    }
  }
  // Delete all events (and their subcollections)
  const eventsRef = collection(db, 'teams', teamId, 'events');
  const eventsSnapshot = await getDocs(eventsRef);
  const deleteEventsPromises = eventsSnapshot.docs.map((docSnap) =>
    deleteEvent(teamId, docSnap.id)
  );
  await Promise.all(deleteEventsPromises);

  // Delete all joinRequests
  const joinRequestsRef = collection(db, 'teams', teamId, 'joinRequests');
  const joinRequestsSnapshot = await getDocs(joinRequestsRef);
  const deleteJoinRequestsPromises = joinRequestsSnapshot.docs.map((docSnap) =>
    deleteDoc(docSnap.ref)
  );
  await Promise.all(deleteJoinRequestsPromises);

  // Finally, delete the team document itself
  await deleteDoc(teamDocRef);
}

/**
 * Remove a member from a team (coach/company only).
 */
export async function removeTeamMember(teamId, memberId) {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, { members: arrayRemove(memberId) });
}