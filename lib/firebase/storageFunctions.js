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

