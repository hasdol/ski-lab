// src/lib/firebase/firestoreFunctions.js
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
  writeBatch,
  documentId,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, storage } from './config';
import { ref, deleteObject } from 'firebase/storage';

/**
 * Add a new ski for the user.
 */
export const addUserSkis = async (userId, skiData) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/skis`), skiData);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

/**
 * Get all skis for a user, ordered by serialNumber.
 */
export const getUserSkis = async (userId) => {
  const skiCollectionRef = collection(db, `users/${userId}/skis`);
  const q = query(skiCollectionRef, orderBy("serialNumber"));
  const skiDocsSnapshot = await getDocs(q);
  return skiDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    console.log("Ski not found");
    return null;
  }
};

/**
 * Fetch multiple ski tests using batched 'in' queries.
 */
export const getSkiTests = async (userId, testIds) => {
  if (!testIds || testIds.length === 0) return [];
  const testCollectionRef = collection(db, `users/${userId}/testResults`);
  const batchSize = 10; // Firestore allows 'in' queries with up to 10 elements
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
  await updateDoc(skiDocRef, skiData);
};

/**
 * Add a test ID to a ski’s testIds array.
 */
export const updateTestArray = async (userId, skiId, testId) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  const skiDoc = await getDoc(skiDocRef);
  const skiData = skiDoc.data();
  let testIds = skiData.testIds || [];
  if (!testIds.includes(testId)) {
    testIds.push(testId);
  }
  await updateDoc(skiDocRef, { testIds });
};

/**
 * Fetch skis associated with a tournament.
 */
export const fetchSkisForTournament = async (userId, tournamentId) => {
  const skiCollectionRef = collection(db, `users/${userId}/skis`);
  const queryCondition = query(skiCollectionRef, where("testIds", "array-contains", tournamentId));
  const skiDocsSnapshot = await getDocs(queryCondition);
  return skiDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    console.error("Error in deleting tournament and related rankings:", error);
    throw error;
  }
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
    const fullData = {
      ...tournamentData,
      ...additionalData,
      timestamp: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, `users/${userId}/testResults`), fullData);
    console.log("User-specific tournament results written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding user-specific tournament results: ", error);
    throw error;
  }
};

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
      console.log("No such tournament result!");
      return null;
    }
  } catch (error) {
    console.error("Error getting tournament result: ", error);
    throw error;
  }
};

/**
 * Add a contact form submission.
 */
export const addContactFormSubmission = async (subject, message, userUid) => {
  try {
    const docRef = await addDoc(collection(db, 'contact'), {
      subject,
      message,
      timestamp: new Date(),
      userUid
    });
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
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
    where("locked", "==", true),
    orderBy("dateAdded", "desc")
  );
  return onSnapshot(lockedSkisQuery, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onData(data);
  }, onError);
};

/**
 * Subscribe to a user’s skis based on their plan.
 * Free users see only unlocked skis.
 */
export const subscribeToUserSkis = (userId, onData, onError) => {
  const skisRef = collection(db, `users/${userId}/skis`);
  // Always filter for unlocked skis.
  const q = query(skisRef, where("locked", "==", false), orderBy("serialNumber"));
  return onSnapshot(q, (snapshot) => {
    const fetchedSkis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    onData(fetchedSkis);
  }, onError);
};

/**
 * Subscribe to tournament results for a user.
 */
export const subscribeToTournamentResults = (userId, onData, onError) => {
  const resultsCollectionRef = collection(db, `users/${userId}/testResults`);
  const q = query(resultsCollectionRef, orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.rankings && data.rankings.length) {
        data.rankings.sort((a, b) => a.score - b.score);
      }
      return { id: doc.id, ...data };
    });
    onData(results);
  }, onError);
};

// ----- Helper to get a user document -----

export const getUserDoc = async (userId) => {
  const userDocRef = doc(db, `users/${userId}`);
  return await getDoc(userDocRef);
};

// ----- Account deletion helper -----
// Note: This function deletes associated Firestore data and then calls the provided auth deletion function.
export const deleteAccount = async (userId, authDeleteFunction) => {
  try {
    // Delete profile picture (if any) is now handled in storageFunctions.
    // Delete all documents in a collection using batched writes.
    const deleteCollection = async (collectionPath) => {
      const batch = writeBatch(db);
      const collectionRef = collection(db, `users/${userId}/${collectionPath}`);
      const snapshot = await getDocs(collectionRef);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    };

    await deleteCollection('skis');
    await deleteCollection('testResults');

    // Additionally, delete the user's main document in Firestore.
    const userDocRef = doc(db, `users/${userId}`);
    await deleteDoc(userDocRef);
    console.log('User document deleted successfully.');

    await authDeleteFunction();  // Delete authentication record.
    console.log('User account and associated data deleted successfully.');
  } catch (error) {
    console.error('Error deleting account:', error.message);
    throw error;
  }
};
