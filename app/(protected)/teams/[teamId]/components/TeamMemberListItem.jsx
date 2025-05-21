'use client';
import React from 'react';
import useUser from '@/hooks/useUser';

export default function TeamMemberListItem({ userId }) {
  const user = useUser(userId);
  if (!user) return <div className="text-sm italic opacity-50">Loading…</div>;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm">{user.displayName}</span>
    </div>
  );
}
