// pages/SignIn.js
'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { loginWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import LoadingButton from '@/components/common/LoadingButton/LoadingButton';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginWithEmailAndPassword(email, password);
      router.push('/'); // Navigation initiated
      // No need to reset isLoading on success
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-login-credentials':
          setError('Wrong email or password');
          break;
        case 'auth/too-many-requests':
          setError('Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later');
          break;
        default:
          setError('An error occurred. Please try again later.');
          break;
      }
      setIsLoading(false); // Reset loading state only on error.
    }
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Sign in</title>
        <meta name="description" content="Sign in to Ski-Lab" />
      </Head>
      <div className="m-auto mt-32 w-2/3 md:w-1/2 animate-fade-down animate-duration-300">
        <h1 className="text-5xl mb-10 font-semibold">{t('signIn')}</h1>
        <form onSubmit={handleSignIn} className="space-y-2 text-black">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
          <LoadingButton
            type="submit"
            isLoading={isLoading}
            className="bg-btn hover:opacity-90 text-btntxt w-full px-4 py-2 rounded"
          >
            {t('signIn')}
          </LoadingButton>
          {error && <div className="text-red-500">{error}</div>}
        </form>
        <div className="mt-6 text-sm flex flex-col space-y-2">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-dominant underline"
            >
              Sign up
            </button>
          </p>
          <p>
            Forgot your password?{' '}
            <button
              onClick={() => router.push('/resetPassword')}
              className="text-dominant underline"
            >
              Reset Password
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignIn;
