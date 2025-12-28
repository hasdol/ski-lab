import React from 'react';
import { RiImageAddLine } from 'react-icons/ri';
import { FaCircleUser } from 'react-icons/fa6';
import Input from '../ui/Input';

const UploadableImage = ({
  photoURL,
  handleImageChange,
  variant = 'profile',
  alt = 'Image',
  className = '',
  clickable = true,
}) => {
  const defaultClasses = {
    profile: 'w-40 h-40 rounded-full border-4 border-gray-300 object-cover',
    event: 'w-fit h-32 max-w-3/4 object-scale-down',
    team: 'w-fit h-32 max-w-3/4 object-scale-down',
  };

  const containerClass = variant === 'profile' ? 'rounded-full' : 'rounded-2xl';
  const imageClasses = className || defaultClasses[variant] || defaultClasses.profile;

  const content = (
    <div className={`relative mx-auto mb-4 ${containerClass}`}>
      {photoURL ? (
        <img src={photoURL} alt={alt} className={imageClasses} />
      ) : variant === 'profile' ? (
        <FaCircleUser size={100} className="text-gray-300 w-full h-full" />
      ) : (
        <RiImageAddLine size={60} className="mx-auto p-5 border border-gray-300 rounded-full hover:bg-gray-100" />
      )}
    </div>
  );

  if (!clickable) {
    return content;
  }

  return (
    <label htmlFor="upload-image" className="relative block text-center cursor-pointer">
      {content}
      <Input
        id="upload-image"
        type="file"
        onChange={handleImageChange}
        className="hidden"
        label=""
        disabled={!clickable}
      />
    </label>
  );
};

export default UploadableImage;