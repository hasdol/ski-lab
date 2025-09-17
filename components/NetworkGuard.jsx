'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NetworkGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const goOffline = () => {
      if (pathname !== '/offline') router.push('/offline');
    };
    const goOnline = () => {
      if (pathname === '/offline') router.push('/');
      else router.refresh();
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) goOffline();

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [router, pathname]);

  return null;
}