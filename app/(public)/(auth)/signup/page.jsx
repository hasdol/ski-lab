// pages/SignUp.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiUserAddLine } from 'react-icons/ri';

const SignUp = () => {
  const router = useRouter();
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-xl w-full self-center mt-10 bg-white shadow rounded-xl p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiUserAddLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sign Up</h1>
          <p className="text-gray-600">Create a new user</p>
        </div>
      </div>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoFocus
          autoComplete="email"
          className="w-full"
          required
        />
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full"
          required
        />
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}
        <Button type="submit" loading={isLoading} variant="primary">
          Sign Up
        </Button>
      </form>
      <div className="mt-6 text-sm">
        <p>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="underline" aria-label="Login">
            Login
          </button>
        </p>
      </div>
    </main>
  );
};

export default SignUp;