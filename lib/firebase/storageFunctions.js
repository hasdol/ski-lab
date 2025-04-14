// src/lib/firebase/storageFunctions.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a profile picture and return its download URL.
 */
export const uploadProfilePicture = async (userId, file) => {
  const imageRef = ref(storage, `profilePictures/${userId}`);
  const snapshot = await uploadBytes(imageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const uploadTeamImage = async (teamId, file) => {
  const imageRef = ref(storage, `teamImages/${teamId}`);
  const snapshot = await uploadBytes(imageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const uploadEventImage = async (teamId, eventId, file) => {
  const imageRef = ref(storage, `eventImages/${teamId}/${eventId}`);
  const snapshot = await uploadBytes(imageRef, file);
  return getDownloadURL(snapshot.ref);
};
