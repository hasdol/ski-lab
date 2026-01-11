'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RiSparkling2Line } from 'react-icons/ri';

import PageHeader from '@/components/layout/PageHeader';
import GettingStartedGuide from '@/components/common/GettingStartedGuide';
import Card from '@/components/ui/Card';

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showAddedBanner, setShowAddedBanner] = useState(false);

  useEffect(() => {
    const added = searchParams?.get('addedSki');
    if (added === '1') {
      setShowAddedBanner(true);
      // Clean up URL so refresh/back feels nice.
      router.replace('/welcome');
      const t = setTimeout(() => setShowAddedBanner(false), 4500);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <PageHeader
        icon={<RiSparkling2Line className="text-blue-600 text-2xl" />}
        title="Welcome"
        subtitle="Add skis, then run your first test"
        actions={null}
      />

      {showAddedBanner && (
        <Card className="mb-4 w-full" padded={false}>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
            <div className="font-semibold">Ski saved</div>
            <div className="text-sm">Nice — add one more ski to start a test.</div>
          </div>
        </Card>
      )}

      <GettingStartedGuide />
    </div>
  );
}
