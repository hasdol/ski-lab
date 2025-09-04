'use client';
import React, { useState, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { GiWinterGloves } from 'react-icons/gi';
import { FaHandsClapping } from 'react-icons/fa6';
import { RiEditLine, RiUserLine, RiSettings3Line } from 'react-icons/ri';
import { MdOutlineSecurity } from "react-icons/md";

import { useRouter } from 'next/navigation';

import Spinner from '@/components/common/Spinner/Spinner';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const { resetPassword, updateDisplayName } = useProfileActions(user);
  const { gloveMode, setGloveMode } = useContext(UserPreferencesContext);
  const router = useRouter();

  const [newDisplayName, setNewDisplayName] = useState(userData?.displayName || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDisplayNameUpdate = async () => {
    setIsLoading(true);
    setError('');
    try {
      await updateDisplayName(newDisplayName);
      setSuccess('Username updated successfully!');
      setIsEditingUsername(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const hasSubscription = !!userData?.stripeSubscriptionId;
    const firstPrompt = hasSubscription
      ? 'You have an active subscription. Deleting your account will automatically cancel the subscription. Proceed?'
      : 'Are you sure you want to delete your account?';

    if (!window.confirm(firstPrompt)) return;
    if (!window.confirm('Final warning. This action cannot be undone. Are you absolutely sure?')) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const callable = httpsCallable(functions, 'deleteUserAccount');
      const result = await callable({ confirmDeleteSubscription: hasSubscription });
      setSuccess(result.data.message);
      await firebaseSignOut(getAuth());
    } catch (err) {
      setError('Error deleting your account: ' + err.message);
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
    <div className="p-4 max-w-4xl w-full self-center">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiSettings3Line className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <div className="text-xs text-gray-600 mt-1 flex flex-col gap-2">
            <span>Manage your account and preferences</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* Username Section - spans both columns */}
        <div className=" bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium text-gray-800 mb-6">Your Username</h2>
          {isEditingUsername ? (
            <div className="space-y-4">
              <Input
                type="text"
                label="Username"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Enter your new username"
                className="w-full"
              />
              <div className="flex space-x-4">
                <Button variant="primary" onClick={handleDisplayNameUpdate}>
                  Save
                </Button>
                <Button variant="secondary" onClick={() => setIsEditingUsername(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="cursor-pointer"
              onClick={() => setIsEditingUsername(true)}
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                <RiUserLine className="text-gray-600 text-2xl" />
                <span className="flex-1 mx-4 text-gray-800">
                  {userData?.displayName ? userData.displayName : (
                    <span className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-2 py-1 rounded-lg">
                      No username
                    </span>
                  )}
                </span>
                <RiEditLine className="text-gray-600 text-2xl" />
              </div>
            </div>
          )}
          {error && <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}
          {success && <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700">{success}</div>}
        </div>

        {/* Preferences Section */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col space-y-4">
          <h2 className="text-xl font-medium text-gray-800 mb-6">Preferences</h2>
          <div className="flex items-center space-x-4">
            <label
              className="inline-flex relative items-center cursor-pointer"
              onClick={(e) => e.stopPropagation()} // Prevent click bubbling up
            >
              <input
                type="checkbox"
                className="sr-only peer"
                checked={gloveMode}
                onChange={(e) => {
                  e.stopPropagation();
                  setGloveMode();
                }}
              />
              <div className="w-12 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 transition duration-300 ease-in-out peer-checked:bg-blue-500 after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6" />
            </label>
            {gloveMode ? <GiWinterGloves size={24} /> : <FaHandsClapping size={24} />}
            <span className="text-lg text-gray-700">Glove Mode</span>
          </div>
          {!gloveMode && (
            <p className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-center">
              Larger input fields and buttons are enabled for easier interactions during tests.
            </p>
          )}
        </div>

        {/* Management Section */}
        <div className="bg-white shadow rounded-lg p-6 flex flex-col space-y-4">
          <h2 className="flex text-xl font-medium text-gray-800 items-center mb-6">
            Management <MdOutlineSecurity className="ml-2 text-2xl" />
          </h2>
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 w-full">
            <Button variant="danger" onClick={resetPassword} className="flex-1">
              Reset Password
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount} className="flex-1">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
