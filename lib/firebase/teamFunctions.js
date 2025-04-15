// src/lib/firebase/teamFunctions.js
import { auth, db } from './config';
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
export async function createTeam(userId, teamName) {
  // Generate a document ID for the team
  const teamId = uuidv4();
  const newTeam = {
    name: teamName,
    imageURL: '', // no image on creation
    joinCode: generateTeamCode(),
    createdBy: userId,
    members: [userId],
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
  await updateDoc(doc(db, 'teams', teamDoc.id), {
    members: arrayUnion(userId),
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
  await updateDoc(teamRef, { members: arrayRemove(userId) });
  return true;
}

/**
 * Create an event under a team (coach/company only).
 */
export async function createEvent(teamId, eventName, description, startDate, endDate, imageURL = '', createdBy) {
  const eventsColRef = collection(db, 'teams', teamId, 'events');
  const eventData = {
    name: eventName,
    description,
    startDate,
    endDate,
    imageURL,
    createdBy,
    createdAt: new Date(),
  };
  const docRef = await addDoc(eventsColRef, eventData);
  return docRef; // Return the full reference instead of just ID
}

/**
 * Share a newly created test result into an event.
 */
export async function shareTestResult(teamId, eventId, userId, testId, testData) {
  const eventTestRef = doc(db, 'teams', teamId, 'events', eventId, 'testResults', testId);
  const user = auth.currentUser;
  const displayName = user?.displayName || 'Unknown';
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
 * Update test results in both the user's and event's locations.
 */
export async function updateTestResultBothPlaces(userId, testId, updatedData, sharedEvents = []) {
  const userDocRef = doc(db, `users/${userId}/testResults/${testId}`);
  await updateDoc(userDocRef, updatedData);
  await Promise.all(
    sharedEvents.map(({ teamId, eventId }) => {
      const eventDocRef = doc(db, `teams/${teamId}/events/${eventId}/testResults/${testId}`);
      return setDoc(eventDocRef, updatedData, { merge: true });
    })
  );
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
  const eventsRef = collection(db, 'teams', teamId, 'events');
  const eventsSnapshot = await getDocs(eventsRef);
  const deleteEventsPromises = eventsSnapshot.docs.map((docSnap) =>
    deleteEvent(teamId, docSnap.id)
  );
  await Promise.all(deleteEventsPromises);
  await deleteDoc(teamDocRef);
}
