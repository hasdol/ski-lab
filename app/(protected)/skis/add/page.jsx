'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';

const AddSkisPage = () => {
  const { addSki, loading, error } = useSkis();
  const router = useRouter();

  const handleAddSki = async (formData) => {
    await addSki(formData);
    router.push('/skis');
  };

  if (loading) return <Spinner />;
  if (error) return <div className="m-2">Error: {error.message}</div>;

  return (
    <div>
      <div className='p-3 md:w-2/3 mx-auto'>
        <h1 className="text-3xl font-bold text-gray-900 my-4">
          Add Skis
        </h1>
        <SkiForm onSubmit={handleAddSki} />
      </div>

    </div>
  );
};

export default AddSkisPage;
