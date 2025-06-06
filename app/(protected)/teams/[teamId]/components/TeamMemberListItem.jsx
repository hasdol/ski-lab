'use client';
import React from 'react';
import useUser from '@/hooks/useUser';

export default function TeamMemberListItem({ userId }) {
  const user = useUser(userId);
  if (!user) return <div className="text-sm italic opacity-50">Loading…</div>;

  return (
    <div className="flex items-center  p-2">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName}
          className="w-8 h-8 rounded-full mr-3"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
          <span className="text-gray-600 font-medium">
            {user.displayName.charAt(0)}
          </span>
        </div>
      )}
      <div>
        <span className="text-sm font-medium text-gray-900">
          {user.displayName}
        </span>
        {user.email && (
          <div className="text-xs text-gray-500">{user.email}</div>
        )}
      </div>
    </div>
  );
}
