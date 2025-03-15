// src/hooks/useProfileActions.js
import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { deleteAccount as deleteFirestoreData } from '@/lib/firebase/firestoreFunctions';
import { updateProfileDetails, sendPasswordReset, signOutUser } from '@/lib/firebase/authFunctions';

export const useProfileActions = (user) => {
  const [isChangingImg, setIsChangingImg] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateProfileImage = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      setIsChangingImg(true);
      const imageRef = ref(storage, `profilePictures/${user.uid}`);
      try {
        const snapshot = await uploadBytes(imageRef, file);
        const newPhotoURL = await getDownloadURL(snapshot.ref);
        
        // Forbered updateData i hooken
        const updateData = { photoURL: newPhotoURL };
        await updateProfileDetails(user, updateData);

        setIsChangingImg(false);
      } catch (error) {
        setErrorMessage('Error updating profile picture: ' + error.message);
      } finally {
        setIsChangingImg(false);
      }
    }
  };

  const updateDisplayName = async (newDisplayName) => {
    try {
      // Forbered updateData i hooken
      const updateData = { displayName: newDisplayName };
      await updateProfileDetails(user, updateData);
      // alert('Display name updated successfully!');
    } catch (error) {
      alert('Error updating display name: ' + error.message);
    }
  };

  const resetPassword = async () => {
    if (user && window.confirm("Are you sure you want to reset your password?")) {
      try {
        await sendPasswordReset(user.email);
        alert('Password reset email sent!');
      } catch (error) {
        alert('Error sending password reset email: ' + error.message);
      }
    } else {
      console.log('Password reset canceled');
    }
  };

  const signOut = async (navigate) => {
    try {
      await signOutUser();
      navigate('/signin');
    } catch (error) {
      console.error('Sign Out Failed:', error.message);
    }
  };

  const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account?")) {
      try {
        await deleteFirestoreData(user.uid, () => user.delete());
        console.log('Account deletion successful.');
        // Redirect to sign-in page eller vise suksessmelding
      } catch (error) {
        console.error('Error deleting account:', error.message);
        // Vise feilmelding til bruker
      }
    }
  };

  return {
    isChangingImg,
    errorMessage,
    updateProfileImage,
    updateDisplayName,
    resetPassword,
    signOut,
    deleteAccount,
  };
};
