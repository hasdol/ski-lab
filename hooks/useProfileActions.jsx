// src/hooks/useProfileActions.js
import { useState } from 'react';
import { uploadProfilePicture } from '@/lib/firebase/storageFunctions';
import { updateProfileDetails, sendPasswordReset, signOutUser } from '@/lib/firebase/authFunctions';

export const useProfileActions = (user) => {
  const [isChangingImg, setIsChangingImg] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateProfileImage = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      setIsChangingImg(true);
      try {
        const newPhotoURL = await uploadProfilePicture(user.uid, file);
        const updateData = { photoURL: newPhotoURL };
        await updateProfileDetails(user, updateData);
      } catch (error) {
        setErrorMessage('Error updating profile picture: ' + error.message);
      } finally {
        setIsChangingImg(false);
      }
    }
  };

  const updateDisplayName = async (newDisplayName) => {
    try {
      const updateData = { displayName: newDisplayName, photoURL: null };
      await updateProfileDetails(user, updateData);
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

  return {
    isChangingImg,
    errorMessage,
    updateProfileImage,
    updateDisplayName,
    resetPassword,
    signOut
  };
};
