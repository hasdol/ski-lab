'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RiAlertLine } from 'react-icons/ri';

import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <PageHeader
        icon={<RiAlertLine className="text-red-500 text-2xl" />}
        title="Page not found"
        subtitle="We couldn't find that page."
        actions={null}
      />

      <Card className="mt-6" padded={false}>
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">This page doesn't exist</h3>
          <p className="text-sm text-gray-600 mb-6">If you followed a broken link or typed the address incorrectly, try one of the options below.</p>

          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push('/')} variant="secondary">Home</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
