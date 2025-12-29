import {
  collection,
  addDoc,
  getDoc,
  doc,
  where,
  query,
  deleteDoc,
  getDocs,
  updateDoc,
  orderBy,
  documentId,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  setDoc,
  arrayRemove,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { buildKeywords } from '@/helpers/buildKeywords';

// Update user's profile details
export const updateProfileDetails = async (userId, updateData) => {
  try {
    await updateDoc(doc(db, 'users', userId), updateData);
  } catch (error) {
    console.error('Profile Update Error:', error.message);
    throw error;
  }
};

/**
 * Add a new ski for the user.
 */
export const addUserSkis = async (userId, skiData) => {
  try {
    const enriched = {
      ...skiData,
      archived: skiData.archived ?? false, // ensure default
      keywords_en: buildKeywords(skiData),
      dateAdded: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, `users/${userId}/skis`), enriched);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};

/**
 * Get a single ski document.
 */
export const getUserSki = async (userId, skiId) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  const skiSnap = await getDoc(skiDocRef);
  if (skiSnap.exists()) {
    return { id: skiSnap.id, ...skiSnap.data() };
  } else {
    console.log('Ski not found');
    return null;
  }
};

/**
 * Fetch multiple ski tests using batched 'in' queries.
 */
export const getSkiTests = async (userId, testIds) => {
  if (!testIds || testIds.length === 0) return [];
  const testCollectionRef = collection(db, `users/${userId}/testResults`);
  const batchSize = 10;
  const allTestResults = [];
  for (let i = 0; i < testIds.length; i += batchSize) {
    const batch = testIds.slice(i, i + batchSize);
    const q = query(testCollectionRef, where(documentId(), 'in', batch));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => {
      allTestResults.push({ id: docSnap.id, ...docSnap.data() });
    });
  }
  return allTestResults;
};

/**
 * Update a specific ski.
 */
export const updateUserSki = async (userId, skiId, skiData) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  await updateDoc(skiDocRef, {
    ...skiData,
    keywords_en: buildKeywords(skiData),
  });
};

/**
 * Add a test ID to a ski’s testIds array.
 */
export const updateTestArray = async (userId, skiId, testId) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  await updateDoc(skiDocRef, { testIds: arrayUnion(testId) });
};

/**
 * Delete a tournament and update associated skis.
 */
export const deleteTournamentAndRelatedRankings = async (userId, tournamentId) => {
  try {
    const skis = await fetchSkisForTournament(userId, tournamentId);
    for (const ski of skis) {
      const updatedTestIds = ski.testIds.filter(testId => testId !== tournamentId);
      const skiDocRef = doc(db, `users/${userId}/skis`, ski.id);
      await updateDoc(skiDocRef, { testIds: updatedTestIds });
    }
    await deleteTournamentResult(userId, tournamentId);
  } catch (error) {
    console.error('Error deleting tournament and related rankings:', error);
    throw error;
  }
};

/**
 * Fetch skis associated with a tournament.
 */
export const fetchSkisForTournament = async (userId, tournamentId) => {
  const skiCollectionRef = collection(db, `users/${userId}/skis`);
  const queryCondition = query(skiCollectionRef, where('testIds', 'array-contains', tournamentId));
  const skiDocsSnapshot = await getDocs(queryCondition);
  return skiDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Delete a tournament result.
 */
export const deleteTournamentResult = async (userId, resultId) => {
  const resultDocRef = doc(db, `users/${userId}/testResults`, resultId);
  await deleteDoc(resultDocRef);
};

/**
 * Delete a ski.
 */
export const deleteUserSki = async (userId, skiId) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  await deleteDoc(skiDocRef);
};

/**
 * Add a tournament (test) result.
 */
export const addTestResult = async (userId, tournamentData, additionalData) => {
  try {
    const testCollectionRef = collection(db, `users/${userId}/testResults`);

    // derive skiIds from rankings
    const skiIds = (tournamentData?.rankings || [])
      .map(r => r.skiId)
      .filter(Boolean);

    const payload = {
      ...tournamentData,
      ...additionalData,
      skiIds,                 // <-- ensure tests are queryable by ski
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(testCollectionRef, payload);

    // back-reference: add testId to each ski involved
    if (skiIds.length) {
      const batch = writeBatch(db);
      for (const skiId of skiIds) {
        const skiRef = doc(db, `users/${userId}/skis`, skiId);
        batch.set(skiRef, { testIds: arrayUnion(docRef.id) }, { merge: true });
      }
      await batch.commit();
    }

    return docRef.id;
  } catch (error) {
    console.error('Error adding test result: ', error);
    throw error;
  }
};

/**
 * Update test results in both the user's and event's locations.
 */
export async function updateTestResultBothPlaces(userId, testId, updatedData, sharedEvents = []) {
  const enriched = {
    ...updatedData,
    keywords_en: buildKeywords(updatedData),
  };
  const userDocRef = doc(db, `users/${userId}/testResults/${testId}`);
  await updateDoc(userDocRef, enriched);
  await Promise.all(
    sharedEvents.map(({ teamId, eventId }) => {
      const eventDocRef = doc(db, `teams/${teamId}/events/${eventId}/testResults/${testId}`);
      return setDoc(eventDocRef, enriched, { merge: true });
    }),
  );
}

/**
 * Update a tournament result.
 */
export const updateTournamentResult = async (userId, resultId, updatedData) => {
  const resultDocRef = doc(db, `users/${userId}/testResults`, resultId);
  await updateDoc(resultDocRef, updatedData);
};

/**
 * Get a tournament result by ID.
 */
export const getTournamentResult = async (userId, resultId) => {
  try {
    const resultDocRef = doc(db, `users/${userId}/testResults`, resultId);
    const resultDocSnapshot = await getDoc(resultDocRef);
    if (resultDocSnapshot.exists()) {
      return { id: resultDocSnapshot.id, ...resultDocSnapshot.data() };
    } else {
      console.log('No such tournament result!');
      return null;
    }
  } catch (error) {
    console.error('Error getting tournament result: ', error);
    throw error;
  }
};

/**
 * Add a contact form submission.
 */
// src/lib/firebase/firestoreFunctions.js
export const addContactFormSubmission = async ({ email, subject, message, userId, category = 'support' }) => {
  try {
    const docRef = await addDoc(collection(db, 'contact'), {
      email,
      subject,
      message,
      userId: userId || null,
      category,              // NEW
      status: 'open',        // NEW
      createdAt: serverTimestamp(), // renamed from timestamp -> createdAt
    });
    return docRef.id;
  } catch (error) {
    console.error('Contact submission error:', error);
    throw new Error('Failed to submit contact form');
  }
};

// ----- Realtime subscription helpers -----

/**
 * Subscribe to locked skis for a user.
 */
export const subscribeToLockedSkis = (userId, onData, onError) => {
  const skisRef = collection(db, `users/${userId}/skis`);
  const lockedSkisQuery = query(
    skisRef,
    where('locked', '==', true),
    orderBy('dateAdded', 'desc')
  );
  return onSnapshot(lockedSkisQuery, snapshot => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onData(data);
  }, onError);
};

/**
 * Subscribe to a user’s skis based on their plan.
 */
export const subscribeToUserSkis = (userId, onData, onError) => {
  const skisRef = collection(db, `users/${userId}/skis`);
  const q = query(skisRef, where('locked', '==', false), orderBy('serialNumber'));
  return onSnapshot(q, snapshot => {
    const fetchedSkis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onData(fetchedSkis);
  }, onError);
};

/**
 * Subscribe to tournament results for a user.
 */
export const subscribeToTournamentResults = (userId, onData, onError) => {
  const resultsCollectionRef = collection(db, `users/${userId}/testResults`);
  const q = query(resultsCollectionRef, orderBy('timestamp', 'desc'));
  return onSnapshot(q, snapshot => {
    const results = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      if (data.rankings && data.rankings.length) data.rankings.sort((a, b) => a.score - b.score);
      return { id: docSnap.id, ...data };
    });
    onData(results);
  }, onError);
};

// ----- NEW UTILITY FUNCTIONS (for use outside the team-specific functions) -----

/**
 * Unified deletion: deletes the test result from specified locations.
 * Options:
 *   - deletePrivate (boolean): whether to delete the private copy.
 *   - deleteShared (boolean): whether to delete all shared event copies.
 *   - deleteCurrentEvent (boolean): whether to delete the current event copy.
 */
export async function deleteTestResultEverywhere({
  userId,
  testId,
  currentTeamId,
  currentEventId,
  options = {}
}) {
  const { deletePrivate = true, deleteShared = true, deleteCurrentEvent = true } = options;
  try {
    const { hasPrivate, sharedEvents } = await getPrivateTestSharedInfo(userId, testId);
    const ops = [];
    
    if (hasPrivate) {
      if (deletePrivate) {
        // Delete the private copy.
        ops.push(deleteDoc(doc(db, `users/${userId}/testResults/${testId}`)));
      }
      if (deleteShared) {
        // Delete all shared copies except the current event copy (avoid duplicate deletion).
        sharedEvents.forEach(({ teamId, eventId }) => {
          if (!(currentTeamId && currentEventId && teamId === currentTeamId && eventId === currentEventId)) {
            ops.push(deleteDoc(doc(db, `teams/${teamId}/events/${eventId}/testResults/${testId}`)));
          }
        });
      }
      if (deleteCurrentEvent && currentTeamId && currentEventId) {
        // Delete the current event copy.
        ops.push(deleteDoc(doc(db, `teams/${currentTeamId}/events/${currentEventId}/testResults/${testId}`)));
        // If not deleting the private copy, update its "sharedIn" field.
        if (!deletePrivate) {
          ops.push(
            updateDoc(doc(db, `users/${userId}/testResults/${testId}`), {
              sharedIn: arrayRemove({ teamId: currentTeamId, eventId: currentEventId })
            })
          );
        }
      }
    } else {
      // No private copy exists; assume result exists only in an event location.
      if (deleteCurrentEvent && currentTeamId && currentEventId) {
        ops.push(deleteDoc(doc(db, `teams/${currentTeamId}/events/${currentEventId}/testResults/${testId}`)));
      } else if (deletePrivate) {
        ops.push(deleteDoc(doc(db, `users/${userId}/testResults/${testId}`)));
      }
    }

    await Promise.all(ops);
    return { success: true, message: "Test result successfully deleted from specified locations." };
  } catch (error) {
    console.error("Error deleting test result everywhere:", error);
    throw new Error("There was a problem deleting the test result.");
  }
}

export const getPrivateTestSharedInfo = async (userId, testId) => {
  const testDocRef = doc(db, `users/${userId}/testResults`, testId);
  const testSnap = await getDoc(testDocRef);
  let hasPrivate = false;
  let sharedEvents = [];
  if (testSnap.exists()) {
    hasPrivate = true;
    const data = testSnap.data();
    // Assuming your test result documents include a "sharedIn" field
    sharedEvents = data.sharedIn || [];
  }
  return { hasPrivate, sharedEvents };
};

export const getTestsForSki = async (userId, skiId) => {
  const testCollectionRef = collection(db, `users/${userId}/testResults`);
  const q = query(testCollectionRef, where("skiIds", "array-contains", skiId));
  const snapshot = await getDocs(q);
  const tests = [];
  snapshot.forEach(docSnap => {
    tests.push({ id: docSnap.id, ...docSnap.data() });
  });
  return tests;
};


/**
 * Get all teams for a user and their live events.
 */
export const getUserTeamsWithLiveEvents = async (userId) => {
  const teamsRef = collection(db, 'teams');
  const qTeams = query(teamsRef, where('members', 'array-contains', userId));
  const teamsSnap = await getDocs(qTeams);

  const fetchedTeams = [];
  const teamEventsMap = {};
  const now = new Date();

  for (const docSnap of teamsSnap.docs) {
    const data = docSnap.data();
    const teamId = docSnap.id;
    fetchedTeams.push({ id: teamId, ...data });

    const eventsRef = collection(db, `teams/${teamId}/events`);
    const eventsSnap = await getDocs(eventsRef);

    const liveEvents = [];
    eventsSnap.forEach((evtDoc) => {
      const evtData = evtDoc.data();
      const start = evtData.startDate?.toDate?.() || new Date(0);
      const end = evtData.endDate?.toDate?.() || new Date(0);
      if (now >= start && now <= end) {
        liveEvents.push({
          id: evtDoc.id,
          name: evtData.name || 'Unnamed Event',
          startDate: start,
          endDate: end,
        });
      }
    });

    teamEventsMap[teamId] = liveEvents;
  }

  return { teams: fetchedTeams, teamEvents: teamEventsMap };
};

export async function getUserTeamsWithEvents(userId, includePast = false) {
  // Fetch teams where user is a member
  // For each team, fetch events and map Firestore Timestamps to JS Dates,
  // and include resultsVisibility.
  const teams = [];
  const teamEvents = {};
  const teamsRef = collection(db, 'teams');
  const teamsQ = query(teamsRef, where('members', 'array-contains', userId));
  const teamsSnap = await getDocs(teamsQ);

  const now = new Date();

  await Promise.all(
    teamsSnap.docs.map(async (teamDoc) => {
      const teamId = teamDoc.id;
      teams.push({ id: teamId, ...teamDoc.data() });

      const eventsRef = collection(db, `teams/${teamId}/events`);
      // Only one inequality filter below:
      const eventsQ = query(
        eventsRef,
        where('startDate', '<=', now),    // events that have started
        orderBy('startDate', 'desc')
      );
      const eventsSnap = await getDocs(eventsQ);

      // Map and then client-filter out ended events if needed
      const rawEvents = eventsSnap.docs.map(d => {
        const data = d.data();
        
        const evt = {
          id: d.id,
          ...data,
          startDate: data.startDate?.toDate ? data.startDate.toDate() : data.startDate,
          endDate: data.endDate?.toDate ? data.endDate.toDate() : data.endDate,
          resultsVisibility: data.resultsVisibility || 'team',
        };
        return evt;
      });

      teamEvents[teamId] = includePast
        ? rawEvents
        : rawEvents.filter(evt => evt.endDate >= now);
    })
  );

  return { teams, teamEvents };
}

/**
 * Create the same test result document under multiple owners, and back-reference
 * the testId into each involved ski doc (per owner).
 *
 * Each copy is tagged as a cross-test.
 */
export const addCrossUserTestResult = async ({
  writerUid,
  ownerUids,
  rankings,
  additionalData,
}) => {
  if (!writerUid) throw new Error('addCrossUserTestResult: writerUid is required');
  if (!Array.isArray(ownerUids) || ownerUids.length < 1) {
    throw new Error('addCrossUserTestResult: ownerUids must be a non-empty array');
  }

  const uniqOwners = Array.from(new Set(ownerUids)).filter(Boolean);
  const firstOwner = uniqOwners[0];

  // Generate a stable id we can reuse across multiple owner subcollections
  const crossTestId = doc(collection(db, `users/${firstOwner}/testResults`)).id;

  const skiIds = (rankings || []).map(r => r.skiId).filter(Boolean);

  const payloadBase = {
    ...additionalData,
    rankings: rankings || [],
    skiIds,
    timestamp: serverTimestamp(),
    isCrossTest: true,
    crossTestId,
    ownersInvolved: uniqOwners,
    createdBy: writerUid,
  };

  const batch = writeBatch(db);

  // 1) Write a full copy into each owner's /testResults/{crossTestId}
  for (const ownerUid of uniqOwners) {
    const testRef = doc(db, 'users', ownerUid, 'testResults', crossTestId);
    batch.set(testRef, { ...payloadBase, userId: ownerUid }, { merge: false });
  }

  // 2) Back-reference into each involved ski doc (per ski ownerUid in ranking)
  //    Shared writers are allowed to update only `testIds` for unlocked skis (see rules).
  for (const r of rankings || []) {
    if (!r?.skiId || !r?.ownerUid) continue;
    const skiRef = doc(db, 'users', r.ownerUid, 'skis', r.skiId);
    batch.set(skiRef, { testIds: arrayUnion(crossTestId) }, { merge: true });
  }

  await batch.commit();
  return crossTestId;
};