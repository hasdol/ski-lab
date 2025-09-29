'use client'
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSingleSki } from '@/hooks/useSingleSki';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';
import PageHeader from '@/components/layout/PageHeader'; // Add this import
import { TiFlowParallel } from 'react-icons/ti';

const EditSkiPage = () => {
  const { updateSki, loading: updating, error: updateError } = useSkis();
  const { id } = useParams();
  const router = useRouter();
  const { ski, loading, error } = useSingleSki(id);

  const handleUpdateSki = async (formData) => {
    await updateSki(id, formData);
    router.push('/skis');
  };

  return (
    <div className="p-4 max-w-4xl w-full mx-auto">
      <PageHeader
        icon={<TiFlowParallel className="text-blue-600 text-2xl" />}
        title="Edit Ski"
        subtitle="View and edit your ski"
        actions={null}
      />

      {loading ? (
        <div className='flex justify-center'><Spinner /></div>
      ) : error ? (
        <div className="bg-red-100 text-red-800 p-2 rounded-lg">
          Error: {error.message}
        </div>
      ) : !ski ? (
        <div className="m-2">Ski not found</div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg">
            <SkiForm
              initialData={ski}
              onSubmit={handleUpdateSki}
              isEdit={true}
            />
            {updateError && (
              <div className="bg-red-100 text-red-800 p-2 rounded-lg mt-4">
                Error: {updateError.message}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EditSkiPage;