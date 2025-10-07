'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

import Spinner from '@/components/common/Spinner/Spinner';
import DeleteTestModal from '@/components/DeleteTestModal/DeleteTestModal';
import { useAuth } from '@/context/AuthContext';
import { deleteTestResultEverywhere } from '@/lib/firebase/firestoreFunctions';
import Button from '@/components/ui/Button';
import ResultCard from '@/app/(public)/results/components/ResultCard';
import { db } from '@/lib/firebase/firebaseConfig';

export default function EventTests({ teamId, eventId }) {
  const { user } = useAuth();
  const router = useRouter();

  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for delete modal and related info
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTestId, setCurrentTestId] = useState(null);
  const [teamMeta, setTeamMeta] = useState(null);

  useEffect(() => {
    if (!teamId) return;
    const ref = doc(db, 'teams', teamId);
    const unsub = onSnapshot(ref, snap => {
      setTeamMeta(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [teamId]);

  // Subscribe after we know teamMeta (so we know if restricted)
  useEffect(() => {
    if (!teamId || !eventId || !user) return;
    if (!teamMeta) return; // wait until team metadata loaded

    const isCreator = teamMeta?.createdBy === user?.uid;
    const isMod = (teamMeta?.mods || []).includes(user?.uid);
    const staffOnly = (teamMeta?.resultsVisibility || 'staff') === 'staff';
    const restricted = staffOnly && !isCreator && !isMod;

    const baseRef = collection(db, 'teams', teamId, 'events', eventId, 'testResults');
    const qRef = restricted
      ? query(baseRef, where('userId', '==', user.uid))
      : baseRef;

    setLoading(true);
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a,b) => {
            const ta = a.timestamp?.seconds || 0;
            const tb = b.timestamp?.seconds || 0;
            return tb - ta;
          });
        setTestResults(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to event test results:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [teamId, eventId, user, teamMeta]);

  const isCreator = teamMeta?.createdBy === user?.uid;
  const isMod = (teamMeta?.mods || []).includes(user?.uid);
  const isRestricted = teamMeta && teamMeta.resultsVisibility === 'staff' && !isCreator && !isMod;

  const visibleResults = isRestricted
    ? testResults /* already filtered at source */
    : testResults;

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

  if (visibleResults.length === 0) {
    if (isRestricted) {
      return (
        <div className="my-6 bg-gray-50 border border-gray-200 p-4 rounded text-sm text-gray-600">
          Event test results are restricted to team staff. You have not shared any tests here yet.
        </div>
      );
    }
    return <div className="my-4 italic">No shared test results available</div>;
  }

  return (
    <div className="my-4 space-y-6">
      {visibleResults.map((result) => (
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
