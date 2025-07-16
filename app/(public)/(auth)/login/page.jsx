// pages/Login.js
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmailAndPassword } from '@/lib/firebase/authFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { RiLoginBoxLine } from 'react-icons/ri';

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
    <main className="max-w-xl w-full self-center mt-10 bg-white shadow rounded-xl p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiLoginBoxLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Login</h1>
          <p className="text-gray-600">Enter your credentials</p>
        </div>
      </div>
      

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
    </main>
  );
};

export default Login;
