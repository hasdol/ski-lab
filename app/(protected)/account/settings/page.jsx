'use client';
import React, { useState, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { GiWinterGloves } from 'react-icons/gi';
import { FaHandsClapping } from 'react-icons/fa6';
import { RiEditLine, RiUserLine } from 'react-icons/ri';
import { useRouter } from 'next/navigation';

import Spinner from '@/components/common/Spinner/Spinner';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const { resetPassword, updateDisplayName } = useProfileActions(user);
  const { gloveMode, setGloveMode } = useContext(UserPreferencesContext);

  /* local UI state … unchanged … */
  const [newDisplayName, setNewDisplayName] = useState(userData?.displayName || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDisplayNameUpdate = async () => {
    setIsLoading(true);
    setError('');
    try {
      await updateDisplayName(newDisplayName);
      setSuccess(t('success'));
      setIsEditingUsername(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    let confirmDeleteSubscription = false;
    // first confirm: handle subscription vs. simple
    if (userData?.stripeSubscriptionId) {
      if (!window.confirm(t('confirm_delete_with_subscription'))) return;
      confirmDeleteSubscription = true;
    } else {
      if (!window.confirm(t('confirm_delete_account'))) return;
    }

    // second, final “are you really sure?”
    if (
      !window.confirm(
        t('confirm_delete_account_final') ||
        'Are you absolutely sure you want to delete your account? This cannot be undone.'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const callable = httpsCallable(functions, 'deleteUserAccount');
      const result = await callable({ confirmDeleteSubscription });
      setSuccess(result.data.message);

      await firebaseSignOut(getAuth());
      // wait 2 seconds so the user can read the success message…
      setTimeout(() => {
        router.push('/');        // navigate to home
      }, 2000);
    } catch (err) {
      setError(t('error_delete_account') + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className='p-3 md:w-2/3 mx-auto'>

        {/* Back Button */}
        <div className="flex justify-between my-4">
          <h1 className="text-3xl font-bold text-gray-900 md:mb-0">
            Settings
          </h1>
          <div>
            <Button variant="secondary" className='text-sm' onClick={() => router.back()}>
              Back
            </Button>
          </div>

        </div>
        <div className="space-y-8">
          {/* Username Section */}
          <div>
            {isEditingUsername ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  label='Username'
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder='Username'
                />
                <div className="flex space-x-3">
                  <Button variant="primary" onClick={handleDisplayNameUpdate} disabled={isLoading}>
                    Save
                  </Button>
                  <Button variant="secondary" onClick={() => setIsEditingUsername(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className=""
                onClick={() => setIsEditingUsername(true)}
              >
                <label htmlFor="username" className=''>Username</label>
                <div className='flex items-center justify-between bg-white border border-gray-200 rounded-md px-4 py-3 mt-1 cursor-pointer hover:bg-gray-50 transition'>
                  <RiUserLine className="text-gray-600 text-xl" />
                  <span className="flex-1 mx-4 text-gray-800">
                    {userData?.displayName || t('--') && <span className='bg-orange-100 text-orange-800 p-2 rounded-md'>No username</span>}
                  </span>
                  <RiEditLine className="text-gray-600 text-xl" />
                </div>

              </div>
            )}
            {error && <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md mt-2">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md mt-2">{success}</div>}
          </div>

          {/* Preferences – only gloveMode remains */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex flex-col items-center space-y-3">
              <h3 className="font-semibold text-lg">Glove mode</h3>
              <label className="inline-flex relative items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="toggle-glove"
                  className="sr-only peer"
                  checked={gloveMode}
                  onChange={() => setGloveMode()}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-300 transition duration-300 ease-in-out peer-checked:bg-blue-500 after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
              </label>
              {gloveMode ? <GiWinterGloves size={20} /> : <FaHandsClapping size={20} />}
            </div>
          </div>

          {/* Actions Section */}
          {!gloveMode && (
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
              <Button variant="danger" onClick={resetPassword} className="flex-1">
                Reset Password
              </Button>
              <Button variant="danger" onClick={handleDeleteAccount} className="flex-1">
                Delete Account
              </Button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
