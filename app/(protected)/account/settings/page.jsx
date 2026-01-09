'use client';
import React, { useState, useContext } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import { GiWinterGloves } from 'react-icons/gi';
import { FaHandsClapping } from 'react-icons/fa6';
import { RiSettings3Line } from 'react-icons/ri';
import { MdOutlineSecurity } from "react-icons/md";
import KeywordReindexTools from './components/KeywordReindexTools';

import Spinner from '@/components/common/Spinner/Spinner';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/layout/PageHeader'; // Add this import
import Card from '@/components/ui/Card'
import Toggle from '@/components/ui/Toggle';

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const { resetPassword, updateDisplayName } = useProfileActions(user);
  const { gloveMode, setGloveMode } = useContext(UserPreferencesContext);

  const SettingRow = ({ title, description, children, rightClassName = '' }) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="sm:pr-6 sm:max-w-xl">
        <div className="font-medium text-zinc-900">{title}</div>
        {description ? <div className="text-xs text-zinc-500 mt-1">{description}</div> : null}
      </div>
      <div className={[
        'flex items-center justify-between sm:justify-end gap-3 sm:gap-4',
        rightClassName,
      ].join(' ')}>
        {children}
      </div>
    </div>
  );

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
      <PageHeader
        icon={<RiSettings3Line className="text-blue-600 text-2xl" />}
        title="Settings"
        subtitle="Manage your account and preferences"
        actions={null}
      />

      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* Username Section - spans both columns */}
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-5">Account</div>

          <div className="space-y-6">
            <SettingRow
              title="Username"
              description="Shown to others"
              rightClassName={isEditingUsername ? 'w-full sm:w-auto' : ''}
            >
              {isEditingUsername ? (
                <div className="w-full sm:w-80 space-y-3">
                  <Input
                    type="text"
                    label=""
                    placeholder=""
                    aria-label="Username"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-3 justify-end">
                    <Button variant="secondary" onClick={() => setIsEditingUsername(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleDisplayNameUpdate}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={userData?.displayName ? 'text-sm text-zinc-900' : 'text-sm text-zinc-500'}>
                    {userData?.displayName || 'Not set'}
                  </span>
                  <Button variant="secondary" onClick={() => setIsEditingUsername(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </SettingRow>

            {error && <div className="p-3 rounded-2xl bg-red-50 text-red-700">{error}</div>}
            {success && <div className="p-3 rounded-2xl bg-green-50 text-green-700">{success}</div>}
          </div>
        </Card>

        {/* Preferences Section (clean, unified) */}
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-5">Preferences</div>

          <div className="space-y-6">
            {/* Glove mode row (concise) */}
            <SettingRow
              title="Glove Mode"
              description="Larger input fields and buttons are enabled for easier interactions during tests."
            >
              <div className="text-zinc-700">
                {gloveMode ? <GiWinterGloves size={20} /> : <FaHandsClapping size={20} />}
              </div>
              <Toggle
                enabled={!!gloveMode}
                setEnabled={() => setGloveMode()}
                label="Glove Mode"
              />
            </SettingRow>
          </div>
        </Card>

        <KeywordReindexTools />

        {/* Management Section */}
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-5">Security</div>

          <div className="space-y-6">
            <SettingRow
              title="Reset password"
              description="Email reset link"
              rightClassName="justify-start sm:justify-end"
            >
              <Button variant="danger" onClick={resetPassword}>
                Reset Password
              </Button>
            </SettingRow>

            <div className="border-t border-gray-100" />

            <SettingRow
              title="Delete account"
              description="Permanent"
              rightClassName="justify-start sm:justify-end"
            >
              <Button variant="danger" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </SettingRow>
          </div>
        </Card>
      </div>
    </div>
  );
}
