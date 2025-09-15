// filepath: /home/haakon/Documents/GitHub/ski-lab/app/offline/page.jsx
'use client';
import React from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();
  return (
    <div className="p-4 max-w-4xl w-full self-center text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You’re offline</h1>
      <p className="text-gray-600 mb-6">Some features may be unavailable without an internet connection.</p>
      <div className="flex justify-center gap-3">
        <Button variant="secondary" onClick={() => router.refresh()}>Retry</Button>
        <Button variant="primary" onClick={() => router.push('/')}>Go Home</Button>
      </div>
    </div>
  );
}