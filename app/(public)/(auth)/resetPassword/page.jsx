// pages/PasswordReset.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordReset } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiResetLeftFill } from 'react-icons/ri';
import PageHeader from '@/components/layout/PageHeader';

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
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiResetLeftFill className="text-blue-600 text-2xl" />}
        title="Reset Password"
        subtitle="Reset your password"
        actions={null}
      />

      <main className="max-w-xl md:w-full self-center mt-5 mx-3 bg-white shadow rounded-xl p-8">
        <form onSubmit={handleResetPassword} className="space-y-4">
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
          {resetError && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{resetError}</p>}
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
    </div>
  );
};

export default PasswordReset;
