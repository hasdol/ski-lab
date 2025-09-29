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
import PageHeader from '@/components/layout/PageHeader';
import { MdArrowBack } from "react-icons/md";


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
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        iconBg="bg-gray-200"
        icon={
          <span className="relative">
            <TiFlowParallel className="text-gray-700 text-2xl" />
            <RiLock2Line className="text-gray-800 absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gray-100 rounded-full" />
          </span>
        }
        title="Locked Skis"
        subtitle="Upgrade your plan or remove your locked skis"
        actions={
          <div className="flex gap-2">
            <Button variant='secondary' className='flex items-center' onClick={() => router.back()}>
              <MdArrowBack className='mr-1'/>
              Back
            </Button>
            <Button variant="primary" onClick={() => router.push('/pricing')}>
              Upgrade Plan
            </Button>
          </div>
        }
      />

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
  );
};

export default ManageLockedSkis;
