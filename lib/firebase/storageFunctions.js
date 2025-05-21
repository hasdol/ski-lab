// src/lib/firebase/storageFunctions.js
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Upload a profile picture and return its download URL.
 */
export const uploadProfilePicture = async (userId, file) => {
  const imageRef = ref(storage, `profilePictures/${userId}/profile.jpg`); // Add filename
  const metadata = {
    customMetadata: {
      createdBy: userId // Track owner
    }
  };
  const snapshot = await uploadBytes(imageRef, file, metadata);
  return getDownloadURL(snapshot.ref);
};

export const deleteProfilePicture = async (userId) => {
  const imageRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
  try {
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') return true;
    throw error;
  }
};

/**
 * Upload a team image to a predictable path using teamId.
 * The image is stored as "teams/{teamId}/profile.jpg" to mimic a profile picture.
 */
export const uploadTeamImage = async (teamId, file, createdBy) => {
  const imageRef = ref(storage, `teams/${teamId}/team.jpg`);
  const metadata = {
    customMetadata: {
      createdBy: createdBy, // Add creator UID to metadata
    },
  };
  const snapshot = await uploadBytes(imageRef, file, metadata);
  return getDownloadURL(snapshot.ref);
};


/**
 * Delete a team image using the predictable path.
 */
export const deleteTeamImage = async (teamId) => {
  const imageRef = ref(storage, `teams/${teamId}/team.jpg`);
  try {
    await deleteObject(imageRef);
    console.log('Team image deleted from storage.');
    return true; // Indicate success
  } catch (error) {
    console.warn('Failed to delete team image:', error.message);
    throw error; // Propagate error for handling in UI
  }
};


export const uploadEventImage = async (teamId, eventId, file, createdBy) => {
  const imageRef = ref(storage, `teams/${teamId}/events/${eventId}/event.jpg`);
  const metadata = {
    customMetadata: {
      createdBy: createdBy,
    },
  };
  const snapshot = await uploadBytes(imageRef, file, metadata);
  return getDownloadURL(snapshot.ref);
};

/**
 * Delete a team image using the predictable path.
 */
export const deleteEventImage = async (teamId, eventId) => {
  const imageRef = ref(storage, `teams/${teamId}/events/${eventId}/event.jpg`);
  try {
    await deleteObject(imageRef);
    console.log('Event image deleted from storage.');
    return true;
  } catch (error) {
    console.warn('Failed to delete event image:', error.message);
    throw error;
  }
};
