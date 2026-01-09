// pages/PasswordReset.js
 'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { sendPasswordReset } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

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
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-12 md:px-10 md:pt-20">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<Image src="/ski-lab-icon.png" alt="Ski‑Lab" width={72} height={72} className="rounded-3xl ring-1 ring-black/5 shadow-sm" />}
          iconBg="bg-transparent"
          title="Reset Password"
          subtitle="Reset your password"
          actions={null}
        />

        <Card className="w-full">
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
            <Button type="submit" loading={isResetting} variant="danger">
              Reset Password
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/login')}>
              Back
            </Button>
          </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;
