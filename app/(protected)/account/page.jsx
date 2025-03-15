'use client'
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Spinner from '@/components/common/Spinner/Spinner';
import GetPro from '@/components/getPro/GetPro';
import ProfileImage from '@/components/profileImage/ProfileImage';

const Account = () => {
  const { user, userData, checkingStatus } = useAuth();
  console.log(user);
  
  const { isChangingImg, errorMessage, updateProfileImage } = useProfileActions(user);
  const { t } = useTranslation();

  if (checkingStatus) {
    return <Spinner />;
  }

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
              {userData.isPro ? (
                <p className="flex text-btn justify-center">
                  {t('proUser')} <RiVerifiedBadgeFill />
                </p>
              ) : (
                <p className="flex justify-center items-center">
                  {t('freeUser')}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col space-y-4 my-4 w-2/3 m-auto md:w-full">
            <div className="flex space-x-1 justify-center text-btn">
              <GetPro />
            </div>
            <Link
              href="/settings"
              className="flex self-center py-3 px-5 bg-btn w-full rounded text-btntxt items-center justify-center hover:opacity-90"
            >
              {t('settings')}
            </Link>
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
