'use client';
import React, { useState } from 'react';
import Button from '../ui/Button';

export default function DeleteTestModal({ isOpen, onClose, onConfirm }) {
  const [scope, setScope] = useState('current'); // 'all' or 'current'
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded p-6 mx-2 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Delete Test Result</h2>
        <p className="mb-3">
          Are you sure you want to delete this test result?
        </p>
        <div className="flex flex-col space-y-2 mb-4">

          <label>
            <input
              type="radio"
              name="deleteScope"
              value="current"
              checked={scope === 'current'}
              onChange={(e) => setScope(e.target.value)}
              className="mr-1"
            />
            Delete from current location only
          </label>

          <label className="mr-2">
            <input
              type="radio"
              name="deleteScope"
              value="all"
              checked={scope === 'all'}
              onChange={(e) => setScope(e.target.value)}
              className="mr-1"
            />
            Delete from all locations
          </label>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onConfirm(scope)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
