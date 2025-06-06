// pages/PasswordReset.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordReset } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiResetLeftFill } from 'react-icons/ri';

const PasswordReset = () => {
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
      // Optionally, show a success message or navigate.
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setResetError('Invalid email address.');
          break;
        default:
          setResetError('Error resetting password. Please try again.');
          break;
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="p-4 max-w-xl w-full self-center mt-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiResetLeftFill className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600">Reset your password</p>
        </div>
      </div>
      {resetError && <p className="bg-red-100 text-red-700 p-3 rounded-md">{resetError}</p>}
      <form onSubmit={handleResetPassword} className="bg-white border border-gray-200 rounded-md p-6 space-y-4">
        <Input
          id="resetEmail"
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full"
          required
        />
        <div className="flex gap-2">
          <Button type="submit" loading={isResetting} variant="primary">
            Reset Password
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push('/login')}>
            Back
          </Button>
        </div>
      </form>
    </main>
  );
};

export default PasswordReset;
