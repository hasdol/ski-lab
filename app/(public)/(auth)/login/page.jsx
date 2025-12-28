// pages/Login.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiLoginBoxLine } from 'react-icons/ri';
import PageHeader from '@/components/layout/PageHeader'; // Add this import
import Card from '@/components/ui/Card'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await loginWithEmailAndPassword(email, password);
      router.push('/');
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-login-credentials':
          setError('Wrong email or password');
          break;
        case 'auth/invalid-credential':
          setError('Wrong email or password');
          break;
        case 'auth/too-many-requests':
          setError(
            'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later'
          );
          break;
        default:
          console.log('Login error:', error);

          setError('An error occurred. Please try again later.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl w-full self-center md:w-1/3 md:mx-auto">
      <PageHeader
        icon={<RiLoginBoxLine className="text-blue-600 text-2xl" />}
        title="Login"
        subtitle="Enter your credentials"
        actions={null}
      />

      <Card>
        <form onSubmit={handleSignIn} className="space-y-4">
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
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            variant="primary"
          >
            Login
          </Button>
        </form>
        <div className="mt-6 text-sm flex flex-col space-y-2">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="underline"
              aria-label="Sign up"
            >
              Sign up
            </button>
          </p>
          <p>
            Forgot your password?{' '}
            <button
              onClick={() => router.push('/resetPassword')}
              className="underline"
              aria-label="Reset Password"
            >
              Reset Password
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
