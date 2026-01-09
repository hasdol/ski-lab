// pages/SignUp.js
 'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { registerWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { updateProfile, deleteUser } from 'firebase/auth';
import { db } from '@/lib/firebase/firebaseConfig';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';

const SignUp = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (!displayName.trim()) {
        throw new Error('Please enter a username.');
      }
      const userCredential = await registerWithEmailAndPassword(email, password);

      try {
        // 1) Update Auth profile
        await updateProfile(userCredential.user, { displayName });

        // 2) Upsert Firestore user doc (merge to avoid races with onUserCreate)
        await setDoc(
          doc(db, 'users', userCredential.user.uid),
          { displayName },
          { merge: true }
        );

        router.push('/skis');
      } catch (innerErr) {
        // Best‑effort rollback: delete user doc and Auth user
        try {
          await deleteDoc(doc(db, 'users', userCredential.user.uid));
        } catch (_) {}
        try {
          await deleteUser(userCredential.user);
        } catch (_) {}
        throw innerErr;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-12 md:px-10 md:pt-20">
      <div className="w-full max-w-md">
        <PageHeader
          icon={<Image src="/ski-lab-icon.png" alt="Ski‑Lab" width={72} height={72} className="rounded-3xl ring-1 ring-black/5 shadow-sm" />}
          iconBg="bg-transparent"
          title="Sign Up"
          subtitle="Create a new user"
          actions={null}
        />

        <Card className="w-full">
          <form onSubmit={handleSignUp} className="space-y-4">
          {/* New Username field */}
          <Input
            id="username"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Username"
            autoFocus
            className="w-full"
            required
          />
          {/* Existing fields */}
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
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
        </Card>
      </div>
    </div>
  );
};

export default SignUp;