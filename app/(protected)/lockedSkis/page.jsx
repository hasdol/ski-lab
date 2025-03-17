// components/ManageLockedSkisPage.jsx
'use client'
import React from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import Spinner from '@/components/common/Spinner/Spinner';
import BackBtn from '@/components/common/BackBtn';
import { useLockedSkis } from '@/hooks/useLockedSkis';
import LockedSkiItem from './components/LockedSkiItem';

const ManageLockedSkis = () => {
  const { lockedSkis, loading, error, deleteLockedSki } = useLockedSkis();
  const { t } = useTranslation();

  const handleDelete = async (skiId) => {
    try {
      await deleteLockedSki(skiId);
      alert(t('ski_deleted_successfully'));
    } catch (err) {
      console.error(err);
      alert(t('error_deleting_ski'));
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="m-2 text-red-500">Error: {error.message}</div>;

  return (
    <>
      <Head>
        <title>Ski-Lab: Manage locked skis</title>
        <meta name="description" content="Displaying locked skis as a result of plan downgrade" />
      </Head>
      <div className="manage-locked-skis-page py-4 px-2 max-w-3xl mx-auto">
        {lockedSkis.length === 0 ? (
          <div className="text-center">
            {t('no_locked_skis')}
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

        <div className="mt-8 flex justify-center">
          <BackBtn />
        </div>
      </div>
    </>
  );
};

export default ManageLockedSkis;
