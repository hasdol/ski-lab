'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';
import { TiFlowParallel } from 'react-icons/ti';

const CreateSkisPage = () => {
  const { addSki, loading, error } = useSkis();
  const router = useRouter();

  const handleAddSki = async (formData) => {
    await addSki(formData);
    router.push('/skis');
  };

  return (
    <div>
      <div className="p-4 max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <TiFlowParallel className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Ski</h1>
            <p className="text-gray-600">Create a new ski</p>
          </div>
        </div>
        {loading && <div className='flex justify-center'><Spinner /></div>}

        <SkiForm onSubmit={handleAddSki} />

        {error && <div className="bg-red-100 text-red-800 p-2 rounded-lg">Error: {error.message}</div>}
      </div>

    </div>
  );
};

export default CreateSkisPage;
