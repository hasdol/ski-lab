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
  setDoc
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
    const base = { ...tournamentData, ...additionalData };
    const fullData = {
      ...base,
      keywords_en: buildKeywords(base),
      timestamp: serverTimestamp(),
    };
    const docRef = await addDoc(
      collection(db, `users/${userId}/testResults`),
      fullData,
    );
    return docRef.id;
  } catch (error) {
    console.error('Error adding user-specific tournament results:', error);
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
export const addContactFormSubmission = async ({ email, subject, message, userId }) => {
  try {
    const docRef = await addDoc(collection(db, 'contact'), {
      email,
      subject,
      message,
      userId: userId || null,  // Store null for anonymous users
      timestamp: serverTimestamp(),
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
 * Unified deletion: deletes the test result from every location (private copy and all event copies).
 * For event pages, pass in currentTeamId/currentEventId so that if the private copy is missing,
 * the current event copy is removed.
 * For tournament results, simply call without currentTeamId/currentEventId.
 */
export async function deleteTestResultEverywhere({ userId, testId, currentTeamId, currentEventId }) {
  try {
    const { hasPrivate, sharedEvents } = await getPrivateTestSharedInfo(userId, testId);
    const ops = [];

    if (hasPrivate) {
      // Delete the private copy.
      ops.push(deleteDoc(doc(db, `users/${userId}/testResults/${testId}`)));
      // Delete any event copies saved in the sharedIn field.
      sharedEvents.forEach(({ teamId, eventId }) => {
        ops.push(deleteDoc(doc(db, `teams/${teamId}/events/${eventId}/testResults/${testId}`)));
      });
      // If there are no shared events but we are on an event page, delete the current event copy.
      if (sharedEvents.length === 0 && currentTeamId && currentEventId) {
        ops.push(deleteDoc(doc(db, `teams/${currentTeamId}/events/${currentEventId}/testResults/${testId}`)));
      }
    } else {
      // If no private copy exists, assume the result is only in an event location.
      if (currentTeamId && currentEventId) {
        ops.push(deleteDoc(doc(db, `teams/${currentTeamId}/events/${currentEventId}/testResults/${testId}`)));
      } else {
        // For tournament results where no current event is provided,
        // attempt to delete from the private collection.
        ops.push(deleteDoc(doc(db, `users/${userId}/testResults/${testId}`)));
      }
    }

    await Promise.all(ops);
    return { success: true, message: "Test result successfully deleted from all locations." };
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
  const teamsRef = collection(db, 'teams');
  const teamsQ = query(teamsRef, where('members', 'array-contains', userId));
  const teamsSnap = await getDocs(teamsQ);

  const now = new Date();
  const teams = [];
  const teamEvents = {};

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
        return {
          id: d.id,
          name: data.name || 'Unnamed Event',
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
        };
      });

      teamEvents[teamId] = includePast
        ? rawEvents
        : rawEvents.filter(evt => evt.endDate >= now);
    })
  );

  return { teams, teamEvents };
}