'use client'
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';

function ProtectedRoute({ children, redirectTo = '/signin' }) {
  const { user, checkingStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!checkingStatus && !user) {
      router.push(redirectTo);
    }
  }, [user, checkingStatus, router, redirectTo]);

  if (checkingStatus || !user) return <div className='flex justify-center'><Spinner /></div> ;
  return children;
}

export default function ProtectedLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
