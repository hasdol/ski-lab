// ProfileImage.js
import React from 'react';
import { FaCircleUser } from 'react-icons/fa6';
import Spinner from '../common/Spinner/Spinner';

const ProfileImage = ({ photoURL, isChangingImg, handleImageChange }) => {
  
  return (
    <>
      {isChangingImg ? (
        <Spinner />
      ) : (
        <label htmlFor="profile-image-upload" className="relative cursor-pointer block">
          {photoURL ? (
            <img
              src={photoURL}
              alt="Profile"
              className="w-44 h-44 rounded-full mx-auto mb-4 border-4 object-cover"
            />
          ) : (
            <FaCircleUser size={60} className="mx-auto mb-4" />
          )}
          <input
            id="profile-image-upload"
            type="file"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </>
  );
};

export default ProfileImage;
