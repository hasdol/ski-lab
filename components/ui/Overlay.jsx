// Overlay.js
import React from 'react';

const Overlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-20 backdrop-blur"></div>
  );
};

export default Overlay;
