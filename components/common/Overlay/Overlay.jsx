// Overlay.js
import React from 'react';

const Overlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background md:bg-black md:opacity-30 z-20 backdrop-blur-[2px]"></div>
  );
};

export default Overlay;
