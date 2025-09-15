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
import ResultCard from '../../../(public)/results/components/ResultCard';

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

  // wrapper for card actions
  const handleEditFromCard = (testId) => router.push(`/results/${testId}/edit`);
  const handleDeleteFromCard = () => setModalOpen(true);

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

      {/* Use shared ResultCard component instead of duplicating markup */}
      <ResultCard
        result={result}
        debouncedSearch={''}
        handleEdit={handleEditFromCard}
        handleDelete={handleDeleteFromCard}
      />

      <DeleteTestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default ResultDetailsPage;
