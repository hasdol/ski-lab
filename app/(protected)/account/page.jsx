'use client';
import React from 'react';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { RiVerifiedBadgeFill, RiDeleteBinLine } from "react-icons/ri";
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import ProfileImage from '@/app/(protected)/account/components/ProfileImage';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import ManageSubscription from '@/app/(protected)/account/components/ManageSubscription';
import Spinner from '@/components/common/Spinner/Spinner';

const Account = () => {
  const { user, userData } = useAuth();
  const { isChangingImg, errorMessage, updateProfileImage, deleteProfileImage } = useProfileActions(user);
  const { t } = useTranslation();
  const router = useRouter();


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('nb-NO', options);
  };

  const handleRemoveImage = async () => {
    if (window.confirm(t('confirmRemoveImage'))) {
      await deleteProfileImage();
    }
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: {t('account')}</title>
      </Head>
      <div className="max-w-4xl mx-auto animate-fade-up animate-duration-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-5">
          {t('account')}
        </h1>
        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
            <div className="relative text-center">
              <ProfileImage
                photoURL={userData?.photoURL}
                isChangingImg={isChangingImg}
                handleImageChange={updateProfileImage}
              />
              {userData?.photoURL && (
                <Button
                  onClick={handleRemoveImage}
                  variant='danger'
                  disabled={isChangingImg}  // Add disabled state
                  className="mt-2"  // Add some margin-top
                >
                  {isChangingImg ? (
                    <Spinner />  // Show spinner only in button when loading
                  ) : (
                    <span className='flex items-center text-xs'>
                      <RiDeleteBinLine className="mr-1" />
                      {t('remove')}
                    </span>
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-4 text-center md:text-left">
              <div className="mb-6">
                <p className="text-gray-500 text-lg mb-1">{t('hello')}</p>
                <h1 className="font-bold text-3xl text-gray-800 mb-3">
                  {userData?.displayName || t('guest')}
                </h1>

                {userData && (
                  <div className="mb-6">
                    {userData.plan === 'free' ? (
                      <p className="text-gray-600 font-medium">
                        {t('freeUser')}
                      </p>
                    ) : (
                      <p className="inline-flex items-center justify-center gap-1.5
                                  bg-gradient-to-br from-blue-500 to-indigo-500 text-white
                                   px-4 py-1.5 rounded-full text-sm">
                        {t(`${userData.plan} plan`)}
                        <RiVerifiedBadgeFill className="w-4 h-4" />
                      </p>
                    )}
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
                <ManageSubscription />
                <Button
                  onClick={() => router.push('/account/settings')}
                  variant="secondary"
                  className="w-full md:w-auto"
                >
                  {t('settings')}
                </Button>
              </div>

              <div className="mt-6 border-t pt-4">
                <p className="text-sm text-gray-500">
                  {t('joined')}: {' '}
                  <span className="font-medium">
                    {user?.metadata.creationTime ? formatDate(user.metadata.creationTime) : ''}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;