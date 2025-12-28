'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';
import PageHeader from '@/components/layout/PageHeader';
import { TiFlowParallel } from 'react-icons/ti';

const CreateSkisPage = () => {
  const { addSki, loading, error } = useSkis();
  const router = useRouter();

  const handleAddSki = async (formData) => {
    await addSki(formData);
    router.push('/skis');
  };

  return (
    <div className="p-4 max-w-4xl w-full mx-auto">
      <PageHeader
        icon={<TiFlowParallel className="text-blue-600 text-2xl" />}
        title="Create Ski"
        subtitle="Create a new ski"
        actions={null}
      />

      {loading && <div className='flex justify-center'><Spinner /></div>}

      <div >
        <SkiForm onSubmit={handleAddSki} />
        {error && <div className="bg-red-100 text-red-800 p-2 rounded-2xl mt-4">Error: {error.message}</div>}
      </div>
    </div>
  );
};

export default CreateSkisPage;
