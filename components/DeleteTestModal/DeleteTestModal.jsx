'use client';
import React from 'react';

export default function DeleteTestModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur bg-opacity-40 flex items-center justify-center">
      <div className="bg-container rounded p-6 mx-2 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Delete Test Result</h2>
        <p className="mb-3">Are you sure you want to delete this test result from all locations?</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
