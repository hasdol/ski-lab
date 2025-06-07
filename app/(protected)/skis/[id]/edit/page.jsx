'use client'
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSingleSki } from '@/hooks/useSingleSki';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';
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
    <div>
      <div className="p-4 max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <TiFlowParallel className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Ski</h1>
            <p className="text-gray-600">View and edit your ski</p>
          </div>
        </div>

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
          </>
        )}
      </div>
    </div>
  );
};

export default EditSkiPage;