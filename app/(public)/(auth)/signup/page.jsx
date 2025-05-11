// pages/SignUp.js
'use client';
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { registerWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import Button from '@/components/common/Button';

const SignUp = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await registerWithEmailAndPassword(email, password);
      router.push('/account/settings');
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Ski-Lab: Sign up</title>
        <meta name="description" content="Sign-up for Ski-Lab" />
      </Head>
      <div className="mt-20 md:w-1/2 md:mx-auto animate-fade-down animate-duration-300">
        <h1 className="text-5xl mb-10 font-semibold">{t('signUp')}</h1>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}
        <form onSubmit={handleSignUp} className="space-y-3 text-black">
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
          <Button
            type="submit"
            loading={isLoading}
            variant="primary"
          >
            {t('signUp')}
          </Button>
        </form>
        <div className="mt-6 text-sm">
          <p>
            Already have an account?{' '}
            <button onClick={() => router.push('/signin')} className="underline">
              {t('signIn')}
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;