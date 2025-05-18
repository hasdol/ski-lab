'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  RiEditLine,
  RiDeleteBinLine,
} from 'react-icons/ri';

import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/common/Button';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import {
  getTournamentResult,
  deleteTestResultEverywhere,
} from '@/lib/firebase/firestoreFunctions';
import { formatSnowTypeLabel, formatSourceLabel } from '@/helpers/helpers';

const ResultDetailsPage = () => {
  const router = useRouter();
  const { id } = useParams() ?? {};
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  /* ───────────── fetch the document ───────────── */
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid || !id) return;
      try {
        const doc = await getTournamentResult(user.uid, id);
        setResult(doc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, id]);

  /* ───────────── delete handler ───────────── */
  const confirmDelete = async () => {
    try {
      await deleteTestResultEverywhere({ userId: user.uid, testId: id });
      router.push('/results');
    } catch (err) {
      console.error(err);
      alert(t('error_deleting_result'));
    }
  };

  /* ───────────── render ───────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center text-gray-500 mt-10">
        Results not found
      </div>
    );
  }

  return (
    <>
      <div className='p-3 md:w-2/3 mx-auto'>
        {/* Back button */}
        <Button
          variant="secondary"
          className="mb-4 flex items-center gap-1"
          onClick={() => router.back()}
        >
          Back
        </Button>

        {/* ONE full‑width “Results card” */}
        <div className="shadow rounded-md p-5 flex flex-col space-y-5">
          {/* header */}
          <div className="flex justify-between">
            <div>
              <h1 className="font-semibold text-2xl">
                {result.style.charAt(0).toUpperCase() + result.style.slice(1)} / {result.temperature}°C
              </h1>
              <i className="text-sm">{result.location}</i>
            </div>
            <div className="space-x-2 shrink-0">
              <Button
                onClick={() => router.push(`/results/${id}/edit`)}
                variant="secondary"
              >
                <RiEditLine />
              </Button>
              <Button
                onClick={() => setModalOpen(true)}
                variant="danger"
              >
                <RiDeleteBinLine />
              </Button>
            </div>
          </div>

          {/* ranking table */}
          <ul className="space-y-2">
            {result.rankings
              .sort((a, b) => a.score - b.score)
              .map((ranking, idx) => (
                <li key={idx} className="flex py-1 text-sm">
                  <span className="flex items-center w-1/3">
                    {ranking.skiId ? ranking.serialNumber : 'deleted'}
                    {ranking.score === 0 && (
                      <span className="mx-2 text-highlight text-xs">
                        - New
                      </span>
                    )}
                  </span>
                  <span className="w-1/3 text-center">{ranking.grind}</span>
                  <span className="w-1/3 text-end">{ranking.score}</span>
                </li>
              ))}
          </ul>

          <div className="border border-gray-300" />

          {/* extra meta */}
          <ul className="grid grid-cols-2 gap-4 text-sm">
            <li className="flex flex-col">
              <span className="text-gray-700">Humidity:</span>
              <span className="font-semibold">
                {result.humidity !== '' ? `${result.humidity}%` : '--'}
              </span>
            </li>
            <li className="flex flex-col">
              <span className="text-gray-700">Snow temperature:</span>
              <span className="font-semibold">
                {result.snowTemperature !== ''
                  ? `${result.snowTemperature}°C`
                  : '--'}
              </span>
            </li>
            <li className="flex flex-col">
              <span className="text-gray-700">Snow source</span>
              <span className="font-semibold">
                {result.snowCondition?.source
                  ? formatSourceLabel(result.snowCondition.source)
                  : '--'}
              </span>
            </li>
            <li className="flex flex-col">
              <span className="text-gray-700">Snow type:</span>
              <span className="font-semibold">
                {result.snowCondition?.grainType
                  ? formatSnowTypeLabel(result.snowCondition.grainType)
                  : '--'}
              </span>
            </li>
            <li className="col-span-2 flex flex-col">
              <span className="text-gray-700">Comment:</span>
              <span className="font-semibold">
                {result.comment || '--'}
              </span>
            </li>
          </ul>

          {/* timestamp */}
          <div className="flex justify-end mt-2 text-xs text-gray-600">
            <span>
              {new Date(
                result.timestamp.seconds * 1000
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="ml-2">
              {new Date(
                result.timestamp.seconds * 1000
              ).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* delete‑confirm modal */}
      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default ResultDetailsPage;
