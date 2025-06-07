'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';

import Spinner from '@/components/common/Spinner/Spinner';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import { useAuth } from '@/context/AuthContext';
import { useEventTestResults } from '@/hooks/useEventTestResults';
import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import Button from '@/components/ui/Button';

export default function EventTests({ teamId, eventId }) {
  const { user } = useAuth();
  const router = useRouter();
  const { testResults, loading, error } = useEventTestResults(teamId, eventId);

  // State for delete modal and related info
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);

  // Open the delete modal
  const handleDelete = (testId) => {
    if (!user?.uid) return;
    setCurrentTestId(testId);
    setModalOpen(true);
  };

  // Confirm deletion using our unified deletion function
  const handleModalConfirm = async (scope) => {
    if (!currentTestId) return;
    try {
      const options = scope === 'all'
        ? { deletePrivate: true, deleteShared: true, deleteCurrentEvent: true }
        : { deletePrivate: false, deleteShared: false, deleteCurrentEvent: true };

      const response = await deleteTestResultEverywhere({
        userId: user.uid,
        testId: currentTestId,
        currentTeamId: teamId,
        currentEventId: eventId,
        options
      });
      alert(response.message);
      // Optionally update UI state to remove the deleted test result.
    } catch (err) {
      console.error('Error deleting test result:', err);
      alert('Error deleting test result');
    }
    setModalOpen(false);
    setCurrentTestId(null);
  };

  if (loading) {
    return <div className="flex justify-center mt-4"><Spinner /></div>;
  }
  if (error) {
    return <div>Error loading results: {error.message}</div>;
  }
  if (testResults.length === 0) {
    return <div className="my-4 italic">No shared test results available</div>;
  }

  return (
    <div className="my-4 space-y-6">
      {testResults.map((result) => (
        <div
          key={result.id}
          className="bg-white border border-gray-200 rounded-md p-6 mb-4 animate-fade-down animate-duration-300"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {result.style.charAt(0).toUpperCase() + result.style.slice(1)} / {result.temperature}°C
              </h3>
              <p className="text-sm text-gray-500">{result.location}</p>
            </div>
            {user?.uid === result.userId && (
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/results/${result.id}/edit`)}
                >
                  <RiEditLine />
                </Button>
                <Button
                  variant="danger"
                  title="delete"
                  onClick={() => handleDelete(result.id)}
                >
                  <RiDeleteBinLine />
                </Button>
              </div>
            )}
          </div>

          <ul className="divide-y divide-gray-200 text-sm my-4">
            {result.rankings?.map((ranking, index) => (
              <li key={index} className="py-1 flex justify-between">
                <span className="w-1/3">
                  {ranking.serialNumber || 'Deleted'}
                </span>
                <span className="w-1/3 text-center">
                  {ranking.grind}
                </span>
                <span className="w-1/3 text-right">
                  {ranking.score} <span className="text-xs">cm</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
            <div>
              <span className="text-gray-700">Snow type:</span>{' '}
              <strong>{result.snowCondition?.grainType || '--'}</strong>
            </div>
            <div>
              <span className="text-gray-700">Snow source:</span>{' '}
              <strong>{result.snowCondition?.source || '--'}</strong>
            </div>
            <div>
              <span className="text-gray-700">Snow temp:</span>{' '}
              <strong>{result.snowTemperature != null ? `${result.snowTemperature}°C` : '--'}</strong>
            </div>
            <div>
              <span className="text-gray-700">Humidity:</span>{' '}
              <strong>{result.humidity != null ? `${result.humidity}%` : '--'}</strong>
            </div>
            <div className="col-span-2">
              <span className="text-gray-700">Comment:</span>{' '}
              <strong>{result.comment || '--'}</strong>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
            <span>
              {result.timestamp && typeof result.timestamp === 'object' && result.timestamp.seconds 
                ? new Date(result.timestamp.seconds * 1000).toLocaleDateString()
                : ''}
            </span>
            <span className="italic">
              {result.displayName ? `By ${result.displayName}` : ''}
            </span>
          </div>
        </div>
      ))}

      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
