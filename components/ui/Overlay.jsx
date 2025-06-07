// Overlay.js
import React from 'react';

const Overlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full z-20 backdrop-blur"></div>
  );
};

export default Overlay;
