// src/components/common/UploadableImage.js
import React from 'react';
import { RiImageAddLine  } from 'react-icons/ri';
import Spinner from './Spinner/Spinner'; // or wherever your Spinner is
import Input from '@/components/common/Input'; // Your unified Input

const UploadableImage = ({
  photoURL,
  isChangingImg,
  handleImageChange,
  variant = 'profile',
  alt = 'Image',
  className = '',
  clickable = true, // <--- if you want a toggle
}) => {
  const defaultClasses = {
    profile: 'w-44 h-44 rounded-full mx-auto mb-4 border-4 border-sbtn object-cover',
    team: 'w-fit h-32 max-w-3/4 mx-auto object-scale-down',
    event: 'w-fit h-32 max-w-3/4 my-4 mx-auto object-scale-down',
  };

  const imageClasses = className || defaultClasses[variant] || defaultClasses.profile;

  if (isChangingImg) {
    return <Spinner />;
  }

  // When clickable, hide the <input type="file"/> behind the label
  // so clicking the image triggers file selection:
  if (clickable) {
    return (
      <label htmlFor="upload-image" className="relative cursor-pointer block">
        {photoURL ? (
          <img src={photoURL} alt={alt} className={imageClasses} />
        ) : (
          <RiImageAddLine size={60} className="mx-auto my-5 shadow p-5 rounded-full bg-container hover:bg-sbtn" />
        )}
        <Input
          id="upload-image"
          type="file"
          onChange={handleImageChange}
          className="hidden"
          label="" // Hide the default label
        />
      </label>
    );
  }

  // Non-clickable scenario (shows the image + a visible file input or no input at all)
  return (
    <div>
      {photoURL ? (
        <img src={photoURL} alt={alt} className={imageClasses} />
      ) : (
        <RiImageAddLine size={60} className="mx-auto mb-4" />
      )}
    </div>
  );
};

export default UploadableImage;
