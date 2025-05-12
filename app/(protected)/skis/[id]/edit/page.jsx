'use client'
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useSingleSki } from '@/hooks/useSingleSki';
import { useSkis } from '@/hooks/useSkis';
import SkiForm from '@/components/SkiForm/SkiForm';
import Spinner from '@/components/common/Spinner/Spinner';
import Head from 'next/head';

const EditSkisPage = () => {
  const { updateSki, loading: updating, error: updateError } = useSkis();
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { ski, loading, error } = useSingleSki(id);

  const handleUpdateSki = async (formData) => {
    await updateSki(id, formData);
    router.push('/skis');
  };

  if (loading || updating) return <Spinner />;
  if (error || updateError)
    return <div className="m-2">Error: {error?.message || updateError?.message}</div>;
  if (!ski) return <div className="m-2">{t('ski_not_found')}</div>;

  return (
    <div className="mx-auto">
      <Head>
        <title>Ski-Lab: Edit skis</title>
        <meta name="description" content="Edit skis" />
      </Head>
      <h1 className="text-3xl font-bold text-gray-900 mb-5">
        {t('edit_skis')}
      </h1>
      <SkiForm initialData={ski} onSubmit={handleUpdateSki} isEdit={true} />
    </div>
  );
};

export default EditSkisPage;
