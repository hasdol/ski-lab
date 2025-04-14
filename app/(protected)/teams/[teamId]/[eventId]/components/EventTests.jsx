'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';

import Spinner from '@/components/common/Spinner/Spinner';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import { useAuth } from '@/context/AuthContext';
import { useEventTestResults } from '@/hooks/useEventTestResults';
import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import Button from '@/components/common/Button';

export default function EventTests({ teamId, eventId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  // Subscribe to event test results using our custom hook
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
  const handleModalConfirm = async () => {
    if (!currentTestId) return;
    try {
      const response = await deleteTestResultEverywhere({
        userId: user.uid,
        testId: currentTestId,
        currentTeamId: teamId,
        currentEventId: eventId
      });
      alert(response.message);
      // Optionally, update UI state to remove the deleted test result.
    } catch (err) {
      console.error('Error deleting test result:', err);
      alert(t('error_deleting_result'));
    }
    setModalOpen(false);
    setCurrentTestId(null);
  };

  if (loading) {
    return <div className="flex justify-center mt-4"><Spinner /></div>;
  }
  if (error) {
    return <div>{t('error_loading_results')}: {error.message}</div>;
  }
  if (testResults.length === 0) {
    return <div className="my-4 italic">{t('no_test_results_available')}</div>;
  }

  return (
    <div className="my-4">
      {testResults.map((result) => (
        <div
          key={result.id}
          className="bg-container shadow rounded mb-5 animate-fade-down animate-duration-300"
        >
          <div className="flex justify-between p-4">

            <div>
              <h3 className="flex font-semibold text-xl items-center">
                {t(result.style)} / {result.temperature}°C - <p className="text-sm  ml-2 text-highlight">
                  {result.displayName}
                </p>
              </h3>
              <i className="text-sm">{result.location}</i>

            </div>

            {user?.uid === result.userId && (
              <div className="flex items-center space-x-3">
                <div className="flex space-x-3">
                  <Button
                    variant="primary"
                    onClick={() => router.push(`/editResult/${result.id}`)}
                  >
                    <RiEditLine />
                  </Button>
                  <Button
                    variant="danger"
                    title={t('delete')}
                    onClick={() => handleDelete(result.id)}
                  >
                    <RiDeleteBinLine />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Rankings list */}
          <ul className="my-2 px-4 space-y-2">
            {result.rankings?.map((ranking, index) => (
              <li key={index} className="flex py-1">
                <span className="flex items-center w-1/3">
                  {ranking.serialNumber || t('deleted')}
                </span>
                <span className="w-1/3 text-center">
                  {ranking.grind}
                </span>
                <span className="w-1/3 text-end">
                  {ranking.score}
                </span>
              </li>
            ))}
          </ul>

          {/* Additional details */}
          <div className="my-5 px-4">
            <p className="border-t border-sbtn mb-4"></p>
            <ul className="text-sm grid grid-cols-2 gap-2">
              <li className="flex flex-col">
                {t('snow_type')}
                <div className="font-semibold text-base">
                  {t(result.snowCondition?.grainType) || '--'}
                </div>
              </li>
              <li className="flex flex-col">
                {t('snow_source')}
                <div className="font-semibold text-base">
                  {t(result.snowCondition?.source) || '--'}
                </div>
              </li>
              <li className="flex flex-col">
                {t('snow_temperature')}
                <div className="font-semibold text-base">
                  {result.snowTemperature ?? '--'}
                </div>
              </li>
              <li className="flex flex-col">
                {t('humidity')}
                <div className="font-semibold text-base">
                  {result.humidity ?? '--'}
                </div>
              </li>
              <li className="flex flex-col col-span-2">
                {t('comment')}
                <div className="font-semibold text-base">
                  {result.comment || '--'}
                </div>
              </li>
            </ul>
          </div>

          {/* Timestamp display */}
          {result.timestamp &&
            typeof result.timestamp === 'object' &&
            result.timestamp.seconds && (
              <div className="flex justify-end mt-2 p-4">
                <div className="flex items-center">
                  <span className="px-2 border-r">
                    {new Date(result.timestamp.seconds * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="px-2">
                    {new Date(result.timestamp.seconds * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
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
