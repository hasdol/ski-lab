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
import ResultCard from '@/app/(public)/results/components/ResultCard';

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
        <ResultCard
          key={result.id}
          result={result}
          debouncedSearch=""
          handleEdit={(id) => router.push(`/results/${id}/edit`)}
          handleDelete={() => handleDelete(result.id)}
          canEdit={user?.uid === result.userId}
        />
      ))}

      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
