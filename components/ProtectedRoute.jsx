'use client'
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from './common/Spinner/Spinner';

export default function ProtectedRoute({ children, redirectTo = '/signin' }) {
  const { user, checkingStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!checkingStatus && !user) {
      router.push(redirectTo);
    }
  }, [user, checkingStatus, router, redirectTo]);

  if (checkingStatus || !user) return <Spinner />;
  return children;
}
