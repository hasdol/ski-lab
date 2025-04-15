// src/hooks/useProfileActions.js
import { useState } from 'react';
import { deleteProfilePicture, uploadProfilePicture } from '@/lib/firebase/storageFunctions';
import { sendPasswordReset, signOutUser } from '@/lib/firebase/authFunctions';
import { updateProfileDetails } from '@/lib/firebase/firestoreFunctions';

export const useProfileActions = (user) => {
  const [isChangingImg, setIsChangingImg] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const updateProfileImage = async (e) => {
    const file = e.target.files[0];
    if (file && user) {
      setIsChangingImg(true);
      try {
        const newPhotoURL = await uploadProfilePicture(user.uid, file);
        await updateProfileDetails(user.uid, { photoURL: newPhotoURL });
      } catch (error) {
        setErrorMessage('Error updating profile picture: ' + error.message);
      } finally {
        setIsChangingImg(false);
      }
    }
  };

  const deleteProfileImage = async () => {
    if (!user) return;
    setIsChangingImg(true);
    try {
      await updateProfileDetails(user.uid, { photoURL: null });
    } catch (error) {
      setErrorMessage('Error deleting profile image: ' + error.message);
    } finally {
      setIsChangingImg(false);
    }
  };

  const updateDisplayName = async (newDisplayName) => {
    try {
      await updateProfileDetails(user.uid, { displayName: newDisplayName });
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
    deleteProfileImage,
    updateDisplayName,
    resetPassword,
    signOut
  };
};
