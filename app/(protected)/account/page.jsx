'use client';
import React from 'react';

import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import ManageSubscription from '@/components/ManageSubscription/ManageSubscription';
import ProfileImage from '@/app/(protected)/account/components/ProfileImage';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';

const Account = () => {
  const { user, userData } = useAuth();
  const { isChangingImg, errorMessage, updateProfileImage } = useProfileActions(user);
  const { t } = useTranslation();
  const router = useRouter();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('nb-NO', options);
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Account</title>
      </Head>
      <div className="grid grid-cols-1 md:grid-cols-2 mx-auto mt-4 md:mt-32 px-4 animate-fade-down animate-duration-300 md:space-x-10">
        <ProfileImage
          isChangingImg={isChangingImg}
          photoURL={user?.photoURL}
          handleImageChange={updateProfileImage}
        />
        <div className="flex flex-col text-center">
          <p>{t('hello')}</p>
          <h1 className="font-bold text-3xl mb-2">{user?.displayName || 'there'}</h1>
          {errorMessage && <div className="error-message text-red-500">{errorMessage}</div>}
          {userData && (
            <div className="text-sm font-semibold mb-4">
              {userData.plan === 'free' ? (
                <p className="flex justify-center items-center">
                  {t('freeUser')}
                </p>
              ) : userData.plan === 'athlete' ? (
                <p className="flex text-btn justify-center">
                  {t('athleteUser')} <RiVerifiedBadgeFill className='ml-1' />
                </p>
              ) : userData.plan === 'coach' ? (
                <p className="flex text-btn justify-center">
                  {t('coachUser')} <RiVerifiedBadgeFill className='ml-1' />
                </p>
              ) : userData.plan === 'company' ? (
                <p className="flex text-btn justify-center">
                  {t('companyUser')} <RiVerifiedBadgeFill className='ml-1' />
                </p>
              ) : null}
            </div>
          )}
          <div className="flex flex-col space-y-4 my-4 w-2/3 m-auto">
            <div className="flex space-x-1 justify-center text-btn">
              <ManageSubscription />
            </div>
            <Button
              onClick={() => router.push('/settings')}
              variant="primary"
            >
              {t('settings')}
            </Button>
          </div>
          <div>
            <p className="text-sm">
              {t('joined')}: {user?.metadata.creationTime ? formatDate(user.metadata.creationTime) : ''}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
