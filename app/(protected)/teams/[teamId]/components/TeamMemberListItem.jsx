'use client';
import React from 'react';
import useUser from '@/hooks/useUser';

export default function TeamMemberListItem({ userId }) {
  const user = useUser(userId);
  if (!user) return <div className="text-sm italic opacity-50">Loading…</div>;

  // Destructure only the required fields
  const { displayName, photoURL } = user;
  const safeDisplayName = displayName || 'Unknown';

  return (
    <div className="flex items-center">
      {photoURL ? (
        <img
          src={photoURL}
          alt={safeDisplayName}
          className="w-8 h-8 rounded-full mr-3"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
          <span className="text-gray-600 font-medium">
            {safeDisplayName.charAt(0)}
          </span>
        </div>
      )}
      <div>
        <span className="font-medium">
          {safeDisplayName}
        </span>
      </div>
    </div>
  );
}
