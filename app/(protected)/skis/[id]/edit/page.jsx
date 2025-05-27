'use client'
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSingleSki } from '@/hooks/useSingleSki';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';

const EditSkisPage = () => {
  const { updateSki, loading: updating, error: updateError } = useSkis();
  const { id } = useParams();
  const router = useRouter();
  const { ski, loading, error } = useSingleSki(id);

  const handleUpdateSki = async (formData) => {
    await updateSki(id, formData);
    router.push('/skis');
  };


  if (!ski) return <div className="m-2">Ski not found</div>;

  return (
    <div>
      <div className='p-3 md:w-2/3 mx-auto'>
        <h1 className="text-3xl font-bold text-gray-900 my-4">
          Edit Skis
        </h1>
        {loading && <div className='flex justify-center'><Spinner /></div>}
        <SkiForm initialData={ski} onSubmit={handleUpdateSki} isEdit={true} />
        {error || updateError && <div className="bg-red-100 text-red-800 p-2 rounded-md">Error: {error?.message || updateError?.message}</div>}
      </div>

    </div>
  );
};

export default EditSkisPage;
