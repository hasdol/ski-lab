// components/common/LoadingButton/LoadingButton.js
'use client';
import React from 'react';
import Spinner from '@/components/common/Spinner/Spinner';

const LoadingButton = ({ isLoading, children, disabled, ...props }) => {
  return (
    <button
      disabled={isLoading || disabled}
      {...props}
      className={`flex items-center justify-center ${props.className}`}
    >
      {children}
      {isLoading && <span className="ml-2"><Spinner /></span>}
    </button>
  );
};

export default LoadingButton;
