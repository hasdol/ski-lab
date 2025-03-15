'use client'
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { registerWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import Spinner from '@/components/common/Spinner/Spinner';

const SignUp = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await registerWithEmailAndPassword(email, password, username);
      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <Head>
        <title>Ski-Lab: Sign up</title>
        <meta name="description" content="Sign-up for Ski-Lab" />
      </Head>
      <div className="m-auto mt-32 w-2/3 md:w-1/2 animate-fade-down animate-duration-300">
        <h1 className="text-dominant text-5xl mb-10 font-semibold">{t('signUp')}</h1>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded">{error}</p>}
        <form onSubmit={handleSignUp} className="space-y-2 text-black">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-4 py-2 border border-gray-300 rounded"
            required
          />
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
          <button
            type="submit"
            className="bg-btn hover:opacity-90 text-btntxt w-full px-4 py-2 bg-button rounded"
          >
            {t('signUp')}
          </button>
        </form>
        <p className="mt-4">
          Already have an account?{' '}
          <button onClick={() => router.push('/signin')} className="text-dominant underline">
            Sign in
          </button>
        </p>
      </div>
    </>
  );
};

export default SignUp;
