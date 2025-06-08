'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RiEditLine, RiDeleteBinLine, RiBarChart2Line } from 'react-icons/ri';

import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import { getTournamentResult, deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import {
  formatSnowTypeLabel,
  formatSourceLabel,
  formatDate,
} from '@/helpers/helpers';

const ResultDetailsPage = () => {
  const router = useRouter();
  const { id } = useParams() ?? {};
  const { user } = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch result document
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

  // Delete handler
  const confirmDelete = async () => {
    try {
      await deleteTestResultEverywhere({ userId: user.uid, testId: id });
      router.push('/results');
    } catch (err) {
      console.error(err);
      alert('Error deleting result');
    }
  };

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
    <div className="p-4 max-w-4xl w-full mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <RiBarChart2Line className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Result</h1>
            <p className="text-gray-600">Review this specific test result</p>
          </div>
        </div>
        <div>
          <Button
            onClick={() => router.back()}
            variant="secondary"
            className="flex items-center gap-1"
          >
            Back
          </Button>
        </div>
      </div>

      {/* Result Card styled similar to ResultCard.jsx */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              {result.style.charAt(0).toUpperCase() + result.style.slice(1)} / {result.temperature}°C
            </h3>
            <p className="text-sm text-gray-500">
              {result.location}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => router.push(`/results/${id}/edit`)}
              variant="secondary"
            >
              <RiEditLine size={18} />
            </Button>
            <Button
              onClick={() => setModalOpen(true)}
              variant="danger"
            >
              <RiDeleteBinLine size={18} />
            </Button>
          </div>
        </div>

        {/* Ranking table */}
        <ul className="divide-y divide-gray-200 text-sm my-6">
          {result.rankings
            .sort((a, b) => a.score - b.score)
            .map((ranking, idx) => (
              <li key={idx} className="flex justify-between py-1">
                <span className="w-1/3 truncate">
                  {ranking.skiId ? ranking.serialNumber : 'Deleted'}
                  {ranking.score === 0 && (
                    <span className="ml-2 text-highlight text-xs">- New</span>
                  )}
                </span>
                <span className="w-1/3 text-center">{ranking.grind}</span>
                <span className="w-1/3 text-end">
                  {ranking.score} <span className="text-xs">cm</span>
                </span>
              </li>
            ))}
        </ul>

        {/* Extra meta data */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-700">Humidity:</span>
            <span className="font-semibold">
              {result.humidity !== '' ? `${result.humidity}%` : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-700">Snow temp:</span>
            <span className="font-semibold">
              {result.snowTemperature !== ''
                ? `${result.snowTemperature}°C`
                : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-700">Snow source:</span>
            <span className="font-semibold">
              {result.snowCondition?.source
                ? formatSourceLabel(result.snowCondition.source)
                : '--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-700">Snow type:</span>
            <span className="font-semibold">
              {result.snowCondition?.grainType
                ? formatSnowTypeLabel(result.snowCondition.grainType)
                : '--'}
            </span>
          </div>
          <div className="col-span-2 flex flex-col">
            <span className="text-gray-700">Comment:</span>
            <span className="font-semibold">
              {result.comment || '--'}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-right text-xs text-gray-500 mt-2">
          {formatDate(new Date(result.timestamp.seconds * 1000), true)}
        </div>
      </div>

      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ResultDetailsPage;
