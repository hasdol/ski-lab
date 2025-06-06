// src/components/ui/Toggle.jsx
'use client';
import React from 'react';

export default function Toggle({ enabled, setEnabled, label }) {
  return (
    <div className="flex items-center">
      <button
        type="button"
        className={`${enabled ? 'bg-blue-500' : 'bg-gray-200'} 
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer 
          rounded-full border-2 border-transparent transition-colors 
          duration-200 ease-in-out focus:outline-none focus:ring-2 
          focus:ring-gray-300 focus:ring-offset-1`}
        onClick={() => setEnabled(!enabled)}
        aria-pressed={enabled}
        aria-label={label}
      >
        <span
          aria-hidden="true"
          className={`${enabled ? 'translate-x-5' : 'translate-x-0'} 
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
}