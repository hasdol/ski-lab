'use client';

import React from 'react';
import EmptyStateCard from '@/components/common/EmptyStateCard';

export default function SignInRequiredCard({ icon, resourceLabel = 'this page', onSignIn }) {
  return (
    <EmptyStateCard
      icon={icon}
      title="Sign In Required"
      description={`Please sign in to view and manage your ${resourceLabel}.`}
      primaryAction={{ label: 'Sign In', onClick: onSignIn, variant: 'primary' }}
    />
  );
}