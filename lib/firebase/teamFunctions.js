// src/lib/firebase/teamFunctions.js
import { auth, db } from './config'; // your firebase config
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
import { v4 as uuidv4 } from 'uuid'; // or nanoid

// -- Utility: Generate a short random code (part of UUID) --
function generateTeamCode() {
  return uuidv4().split('-')[0]; // e.g. "f12e2c19"
}

/**
 * Create a new Team (only for coach/company).
 */
export async function createTeam(userId, teamName, imageURL = '') {
  // Generate a doc ID
  const teamId = uuidv4();

  // Sample team doc
  const newTeam = {
    name: teamName,
    imageURL,
    joinCode: generateTeamCode(),
    createdBy: userId,
    members: [userId],
  };

  await setDoc(doc(db, 'teams', teamId), newTeam);
  return teamId;
}

/**
 * Join a team via joinCode. (For any plan user)
 */
export async function joinTeam(userId, code) {
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('joinCode', '==', code));
  const snap = await getDocs(q);

  if (snap.empty) throw new Error('No team found with the given code.');

  const teamDoc = snap.docs[0]; // first match
  await updateDoc(doc(db, 'teams', teamDoc.id), {
    members: arrayUnion(userId),
  });

  return teamDoc.id;
}

/*Leave team */
export async function leaveTeam(userId, teamId) {
  const teamRef = doc(db, 'teams', teamId);
  const teamSnap = await getDoc(teamRef);

  if (!teamSnap.exists()) {
    throw new Error('Team does not exist.');
  }

  const teamData = teamSnap.data();

  // Check if the user is the creator
  if (teamData.createdBy === userId) {
    throw new Error("You can't leave the team because you're the creator.");
  }

  // Remove user from members array
  await updateDoc(teamRef, {
    members: arrayRemove(userId),
  });

  return true;
}

/**
 * Create an event under a given team (coach/company only).
 */
export async function createEvent(teamId, eventName, description, startDate, endDate, imageURL = '', createdBy) {
  const eventsColRef = collection(db, 'teams', teamId, 'events');

  const eventData = {
    name: eventName,
    description,
    startDate,     // these can be Timestamps or JS Date (convert if needed)
    endDate,
    imageURL,
    createdBy,
    createdAt: new Date(),
  };

  const docRef = await addDoc(eventsColRef, eventData);
  return docRef.id;
}

/**
 * Share a newly created test result into the event. 
 * We copy (duplicate) the test data into `teams/{teamId}/events/{eventId}/testResults/{testId}`
 * so event participants can see it with minimal reads.
 */
export async function shareTestResult(teamId, eventId, userId, testId, testData) {
  const eventTestRef = doc(db, 'teams', teamId, 'events', eventId, 'testResults', testId);

  const user = auth.currentUser; // get displayName from the signed-in user
  const displayName = user?.displayName || 'Unknown';

  const eventTestData = {
    ...testData,
    userId,
    displayName, // ✅ store it here!
    originalTestDocPath: `users/${userId}/testResults/${testId}`,
    timestamp: serverTimestamp(),
  };

  await Promise.all([
    setDoc(eventTestRef, eventTestData),
    updateDoc(doc(db, 'users', userId, 'testResults', testId), {
      sharedIn: arrayUnion({ teamId, eventId })
    })
  ]);
}


/**
 * Update test in *both* the user’s private location and the event location.
 * This ensures changes are reflected in both docs.
 */
export async function updateTestResultBothPlaces(userId, testId, updatedData, sharedEvents = []) {
  // 1) Update the user's private document.
  const userDocRef = doc(db, `users/${userId}/testResults/${testId}`);
  await updateDoc(userDocRef, updatedData);

  // 2) Update each event document where the test was shared.
  await Promise.all(
    sharedEvents.map(({ teamId, eventId }) => {
      const eventDocRef = doc(db, `teams/${teamId}/events/${eventId}/testResults/${testId}`);
      // Using setDoc with merge:true to update if exists or create if missing.
      return setDoc(eventDocRef, updatedData, { merge: true });
    })
  );
}

/**
 * Update an event under a given team.
 */
export async function updateEvent(teamId, eventId, updatedData) {
  const eventDocRef = doc(db, 'teams', teamId, 'events', eventId);
  await updateDoc(eventDocRef, updatedData);
}

/**
 * Delete an event under a given team.
 */
export async function deleteEvent(teamId, eventId) {
  // Reference to the testResults subcollection under the event.
  const testResultsRef = collection(db, 'teams', teamId, 'events', eventId, 'testResults');
  // Retrieve all testResults in the event.
  const testResultsSnapshot = await getDocs(testResultsRef);
  // Delete each testResult.
  const deleteTestResultsPromises = testResultsSnapshot.docs.map((docSnap) => 
    deleteDoc(docSnap.ref)
  );
  await Promise.all(deleteTestResultsPromises);
  
  // Delete the event document itself.
  const eventDocRef = doc(db, 'teams', teamId, 'events', eventId);
  await deleteDoc(eventDocRef);
}

/**
 * Update a team document.
 */
export async function updateTeam(teamId, updatedData) {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, updatedData);
}

/**
 * Delete a team document.
 */
export async function deleteTeam(teamId) {
  // Reference to the events subcollection under the team.
  const eventsRef = collection(db, 'teams', teamId, 'events');
  // Retrieve all events in the team.
  const eventsSnapshot = await getDocs(eventsRef);
  
  // For each event, call deleteEvent to remove the event and its testResults.
  const deleteEventsPromises = eventsSnapshot.docs.map((docSnap) =>
    deleteEvent(teamId, docSnap.id)
  );
  await Promise.all(deleteEventsPromises);
  
  // Finally, delete the team document itself.
  const teamDocRef = doc(db, 'teams', teamId);
  await deleteDoc(teamDocRef);
}