'use client'
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { sendPasswordReset } from '@/lib/firebase/authFunctions';
import LoadingButton from '@/components/common/LoadingButton/LoadingButton';

const PasswordReset = () => {
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    setIsResetting(true);
    setResetError('');
    try {
      await sendPasswordReset(resetEmail);
      console.log('Password reset email sent. Check your inbox.');
      // Optionally, show a success message or redirect.
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setResetError('Invalid email');
          break;
        default:
          setResetError('Error sending password reset email. Please try again.');
          break;
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="m-auto mt-32 w-2/3 md:w-1/2 animate-fade-down animate-duration-300">
      <Head>
        <title>Ski-Lab: Reset password</title>
        <meta name="description" content="Reset your password in Ski-Lab" />
      </Head>
      <h1 className="text-dominant text-4xl mb-10 font-semibold">Reset password</h1>
      <div className="flex flex-col space-y-2 text-black">
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-2 border border-gray-300 rounded"
          required
        />
        <LoadingButton
          type="button"
          onClick={handleResetPassword}
          isLoading={isResetting}
          className="bg-btn hover:opacity-90 text-btntxt my-2 px-4 py-2 rounded"
        >
          Reset Password
        </LoadingButton>
        <button
          className="px-4 py-2 bg-sbtn text-text rounded"
          onClick={() => router.push('/signin')}
        >
          Back
        </button>
        {resetError && (
          <div className="text-red-500 font-thin">{resetError}</div>
        )}
      </div>
    </div>
  );
};

export default PasswordReset;
