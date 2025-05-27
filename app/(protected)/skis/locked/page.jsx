// components/ManageLockedSkisPage.jsx
'use client'
import React from 'react';
import Spinner from '@/components/common/Spinner/Spinner';
import { useLockedSkis } from '@/hooks/useLockedSkis';
import LockedSkiItem from './components/LockedSkiItem';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const ManageLockedSkis = () => {
  const { lockedSkis, loading, error, deleteLockedSki } = useLockedSkis();
  const router = useRouter();

  const handleDelete = async (skiId) => {
    try {
      await deleteLockedSki(skiId);
      alert('Ski deleted successfully');
    } catch (err) {
      console.error(err);
      alert('Error deleting ski');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="m-2 text-red-500">Error: {error.message}</div>;

  return (
    <>
      <div className='p-3 md:w-2/3 mx-auto'>
        <div className='my-2'>
          <Button variant='secondary' onClick={() => router.back()}>Back</Button>

        </div>

        {lockedSkis.length === 0 ? (
          <div className="text-center">
            No locked skis
          </div>
        ) : (
          <div className="space-y-2">
            {lockedSkis.map((ski) => (
              <LockedSkiItem
                key={ski.id}
                ski={ski}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>
    </>
  );
};

export default ManageLockedSkis;
