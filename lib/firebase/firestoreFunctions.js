import { collection, addDoc, getDoc, doc, where, query, deleteDoc, getDocs, updateDoc, orderBy, writeBatch, documentId, serverTimestamp  } from 'firebase/firestore';
import { db, storage } from './config';
import { ref, deleteObject } from 'firebase/storage';

/**
 * Fetch multiple ski details in a single query.
 * @param {string} userId - The user's UID.
 * @param {Array<string>} skiIds - An array of ski IDs to fetch.
 * @returns {Object} - An object mapping skiId to ski data.
 */


//For adding new skis
export const addUserSkis = async (userId, skiData) => {
  try {
    const docRef = await addDoc(collection(db, `users/${userId}/skis`), skiData);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error(error);
  }
};

export const getUserSkis = async (userId) => {
  const skiCollectionRef = collection(db, `users/${userId}/skis`);
  // Adding orderBy to sort by serialNumber
  const q = query(skiCollectionRef, orderBy("serialNumber"));
  const skiDocsSnapshot = await getDocs(q);
  
  return skiDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

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

export const updateUserSki = async (userId, skiId, skiData) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  await updateDoc(skiDocRef, skiData); 
};

export const updateTestArray = async (userId, skiId, testId) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  const skiDoc = await getDoc(skiDocRef);
  const skiData = skiDoc.data();

  let testIds = skiData.testIds || [];

  // Add testId to testIds array if it's not already present
  if (!testIds.includes(testId)) {
    testIds.push(testId);
  }

  await updateDoc(skiDocRef, { testIds });
};

export const fetchSkisForTournament = async (userId, tournamentId) => {
  const skiCollectionRef = collection(db, `users/${userId}/skis`);
  const queryCondition = query(skiCollectionRef, where("testIds", "array-contains", tournamentId));
  const skiDocsSnapshot = await getDocs(queryCondition);
  return skiDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};



export const deleteTournamentAndRelatedRankings = async (userId, tournamentId) => {
  try {
    // Fetch skis associated with the tournament
    const skis = await fetchSkisForTournament(userId, tournamentId);

    // Update each ski to remove the tournamentId from testIds array
    for (const ski of skis) {
      const updatedTestIds = ski.testIds.filter(testId => testId !== tournamentId);

      // Update the ski document in Firestore
      const skiDocRef = doc(db, `users/${userId}/skis`, ski.id);
      await updateDoc(skiDocRef, { testIds: updatedTestIds });
    }

    // Delete the tournament result
    await deleteTournamentResult(userId, tournamentId);
  } catch (error) {
    console.error("Error in deleting tournament and related rankings:", error);
    throw error; // Or handle it as needed
  }
};

export const deleteTournamentResult = async (userId, resultId) => {
  const resultDocRef = doc(db, `users/${userId}/testResults`, resultId);
  await deleteDoc(resultDocRef);
};



export const deleteUserSki = async (userId, skiId) => {
  const skiDocRef = doc(db, `users/${userId}/skis`, skiId);
  await deleteDoc(skiDocRef);
};

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
      throw new Error(error);
  }
};

export const updateTournamentResult = async (userId, resultId, updatedData) => {
  const resultDocRef = doc(db, `users/${userId}/testResults`, resultId);
  await updateDoc(resultDocRef, updatedData);
};

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


export const addContactFormSubmission = async (subject, message, userUid) => {
  
  try {
    const docRef = await addDoc(collection(db, 'contact'), {
      subject,
      message,
      timestamp: new Date(), // Optionally add a timestamp or other metadata
      userUid
    });

    console.log("Document written with ID: ", docRef.id);
    return docRef.id; // Return the document ID in case it's needed
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error(error); // Rethrow the error to handle it in the component
  }
};

// Delete profile picture from Firebase Storage
const deleteProfilePicture = async (userId) => {
  const imageRef = ref(storage, `profilePictures/${userId}`);
  try {
    await deleteObject(imageRef);
    console.log('Profile picture deleted successfully.');
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      console.log('No profile picture to delete.');
    } else {
      console.error('Error deleting profile picture:', error.message);
      throw error;
    }
  }
};

// Delete all documents in a collection
const deleteCollection = async (userId, collectionPath) => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, `users/${userId}/${collectionPath}`);
  const snapshot = await getDocs(collectionRef);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
};

// Consolidated function to delete user data and authentication record
export const deleteAccount = async (userId, authDeleteFunction) => {
  try {
    await deleteProfilePicture(userId);
    await deleteCollection(userId, 'skis');
    await deleteCollection(userId, 'testResults');
    
    // Additionally, delete the user's main document in Firestore
    const userDocRef = doc(db, `users/${userId}`);
    await deleteDoc(userDocRef);
    console.log('User document deleted successfully.');

    await authDeleteFunction();  // Delete authentication record
    console.log('User account and associated data deleted successfully.');
  } catch (error) {
    console.error('Error deleting account:', error.message);
    throw error;
  }
};
