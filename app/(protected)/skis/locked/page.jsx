// components/ManageLockedSkisPage.jsx
'use client'
import React from 'react';
import Spinner from '@/components/common/Spinner/Spinner';
import { useLockedSkis } from '@/hooks/useLockedSkis';
import LockedSkiItem from './components/LockedSkiItem';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { TiFlowParallel } from 'react-icons/ti';
import { RiLock2Line } from 'react-icons/ri';

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
      <div className="p-4 max-w-4xl w-full self-center">
        <div className='flex justify-between items-center mb-4'>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative bg-blue-100 p-2 rounded-lg">
              <TiFlowParallel className="text-blue-600 text-2xl" />
              <RiLock2Line className="text-black absolute -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locked Skis</h1>
              <p className="text-gray-600">Upgrade your plan or remove your locked skis</p>
            </div>
          </div>
          <Button variant='secondary' onClick={() => router.back()}>Back</Button>
        </div>

        {lockedSkis.length === 0 ? (
          <div className="text-center">
            No locked skis
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {lockedSkis.map((ski) => (
                <LockedSkiItem
                  key={ski.id}
                  ski={ski}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
            <div className="mt-4 text-center space-y-2">
              <h3>Unlock your locked skis</h3>
              <Button variant="primary" onClick={() => router.push('/plans')}>
                Upgrade Plan
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ManageLockedSkis;
