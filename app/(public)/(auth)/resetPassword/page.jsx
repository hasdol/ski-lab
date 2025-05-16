// pages/PasswordReset.js
'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { sendPasswordReset } from '@/lib/firebase/authFunctions';
import Button from '@/components/common/Button';
import { useTranslation } from 'react-i18next';

const PasswordReset = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setResetError('');
    try {
      await sendPasswordReset(resetEmail);
      // Optionally, navigate or show a success toast
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setResetError(t('invalidEmail'));
          break;
        default:
          setResetError(t('errorResettingPassword'));
          break;
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Reset password</title>
        <meta name="description" content="Reset your password in Ski-Lab" />
      </Head>
      <div className="p-3 mt-20 md:w-1/2 md:mx-auto animate-fade-down animate-duration-300">
        <h1 className="text-5xl mb-10 font-semibold">{t('reset_password')}</h1>
        {resetError && <p className="bg-red-100 text-red-700 p-3 rounded">{resetError}</p>}
        <form onSubmit={handleResetPassword} className="space-y-3 text-black">
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
          <div className='flex gap-2'>
            <Button
              type="submit"
              loading={isResetting}
              variant="primary"
            >
              {t('reset_password')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/signin')}
            >
              {t('back')}
            </Button>
          </div>

        </form>
      </div>
    </>
  );
};

export default PasswordReset;
