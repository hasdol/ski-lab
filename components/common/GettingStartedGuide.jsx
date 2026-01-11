'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { RiCheckboxCircleLine, RiRadioButtonLine, RiAddLine, RiPlayLine } from 'react-icons/ri';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useSkis } from '@/hooks/useSkis';
import { useAuth } from '@/context/AuthContext';

export default function GettingStartedGuide() {
  const router = useRouter();
  const { userData } = useAuth();
  const { skis, loading } = useSkis();

  const activeSkisCount = useMemo(() => {
    return (skis || []).filter(s => s?.archived !== true).length;
  }, [skis]);

  const hasTwoSkis = activeSkisCount >= 2;
  const displayName = userData?.displayName || userData?.name || '';

  return (
    <Card className="w-full" padded={false}>
      <div className="p-5 sm:p-6">
        <div className="text-sm text-gray-600">Welcome{displayName ? `, ${displayName}` : ''}.</div>
        <div className="text-2xl font-semibold text-gray-900">Let’s get you set up</div>

        {loading ? (
          <div className="mt-5 flex items-center gap-2 text-gray-600">
            <Spinner />
            <span className="text-sm">Checking your skis…</span>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    {hasTwoSkis ? <RiCheckboxCircleLine className="text-emerald-600" /> : <RiRadioButtonLine className="text-gray-400" />}
                    <span>Add at least two skis</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    You have <span className="font-semibold text-gray-800">{activeSkisCount}</span> / 2 skis.
                    Add one or two skis so you can run a head‑to‑head test.
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    onClick={() => router.push(`/skis/create?returnTo=${encodeURIComponent('/welcome?addedSki=1')}`)}
                    variant="primary"
                    className="flex items-center gap-2"
                  >
                    <RiAddLine />
                    Add ski
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-gray-800">
                    {hasTwoSkis ? <RiRadioButtonLine className="text-blue-500" /> : <RiRadioButtonLine className="text-gray-300" />}
                    <span>Start your first test</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Go to your skis, select at least two, then press <span className="font-semibold text-gray-800">New Test</span>.
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    onClick={() => router.push('/skis')}
                    variant="primary"
                    disabled={!hasTwoSkis}
                    className="flex items-center gap-2"
                    title={!hasTwoSkis ? 'Add at least two skis first' : 'Go select skis and start a test'}
                  >
                    <RiPlayLine />
                    {hasTwoSkis ? 'Select skis' : 'Add 2 skis first'}
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </Card>
  );
}
