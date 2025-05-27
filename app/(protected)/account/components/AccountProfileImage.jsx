// ProfileImage.js
import React from 'react';
import { FaCircleUser } from 'react-icons/fa6';

const AccountProfileImage = ({ photoURL, isChangingImg, handleImageChange }) => {
  return (
    <div className="relative">
      <label htmlFor="profile-image-upload" className="relative cursor-pointer block">
        {/* Always show the image/icon container */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          {photoURL ? (
            <img
              src={photoURL}
              alt="Profile"
              className="w-full h-full rounded-full border-4 border-border-gray-300 object-cover"
            />
          ) : (
            <FaCircleUser size={100} className="w-full h-full text-gray-300" />
          )}
          
          {isChangingImg && (
            <div className="absolute inset-0 bg-white bg-opacity-80 rounded-full" />
          )}
        </div>
      </label>

      <input
        id="profile-image-upload"
        type="file"
        onChange={handleImageChange}
        style={{ display: 'none' }}
        disabled={isChangingImg}
      />
    </div>
  );
};

export default AccountProfileImage;