'use client'
import React, { useState, useContext } from 'react';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Flag from 'react-flagkit';
import { GiWinterGloves } from "react-icons/gi";
import { FaHandsClapping } from "react-icons/fa6";
import { RiEditLine } from "react-icons/ri";
import { useRouter } from 'next/navigation';

import BackBtn from '@/components/common/BackBtn';
import Spinner from '@/components/common/Spinner/Spinner';
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import ManageSubscription from '@/components/manageSubscription/ManageSubscription';

const Settings = () => {
  const { user, userData } = useAuth(); // assume userData holds Firestore doc data
  const { resetPassword, updateDisplayName } = useProfileActions(user);
  const { t } = useTranslation();
  const { english, setEnglish, gloveMode, setGloveMode } = useContext(UserPreferencesContext);
  const [newDisplayName, setNewDisplayName] = useState(user.displayName || '');
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

  const deleteUserAccount = async () => {
    let confirmDeleteSubscription = false;
    if (userData?.stripeSubscriptionId) {
      // When an active subscription exists, inform the user that their subscription
      // will be cancelled immediately.
      const confirmMsg = `
You have an active subscription.
Deleting your account will cancel your subscription immediately.
Do you wish to proceed?`;
      if (!window.confirm(confirmMsg)) return;
      confirmDeleteSubscription = true;
    } else {
      const confirmMsg = `
Are you really sure you want to delete your account?
      
This action cannot be undone.`;
      if (!window.confirm(confirmMsg)) return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const deleteUserAccountCallable = httpsCallable(functions, 'deleteUserAccount');
      const result = await deleteUserAccountCallable({ confirmDeleteSubscription });
      setSuccess(result.data.message);
    } catch (err) {
      setError('Error deleting account: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className='flex justify-center'><Spinner /></div> ;

  return (
    <>
      <Head>
        <title>Ski-Lab: Settings</title>
        <meta name="description" content="Settings for Ski-Lab" />
      </Head>
      <div className="flex flex-col justify-center p-4 md:mt-10 mx-auto animate-fade-down animate-duration-300">
        {/* Username Section */}
        <div className="flex flex-col text-center">
          <h4 className="font-semibold text-lg mb-2">{t('username')}</h4>
          <div className="flex items-center justify-center space-x-2">
            {isEditingUsername ? (
              <div className="bg-container rounded p-2 space-x-2 border border-sbtn flex items-center focus-within:ring-1 focus-within:ring-btn">
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="bg-container rounded text-text p-2 px-4 flex-1 w-2/3 outline-none"
                />
                <button
                  className="bg-btn text-btntxt px-4 py-2 rounded hover:opacity-90"
                  onClick={handleDisplayNameUpdate}
                  disabled={isLoading}
                >
                  {t('save')}
                </button>
                <button
                  className="cursor-pointer bg-sbtn px-4 py-2 rounded"
                  onClick={() => setIsEditingUsername(false)}
                >
                  {t('close')}
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-between space-x-4 bg-sbtn rounded px-4 py-3 font-semibold cursor-pointer w-1/2"
                onClick={() => setIsEditingUsername(true)}
              >
                <div className="text-text">{user.displayName || t('no_username')}</div>
                <div className="p-2 rounded-full">
                  <RiEditLine />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preferences Section */}
        <div className="flex justify-center my-10 space-x-8">
          {/* Language Toggle Container */}
          <div className="flex flex-col items-center space-y-4 w-40">
            {!gloveMode ? (
              <>
                <h3 className="font-semibold text-lg">{t('language')}</h3>
                <label className="inline-flex relative items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="toggle-language"
                    className="sr-only peer"
                    checked={english}
                    onChange={(e) => setEnglish(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-300 transition duration-300 ease-in-out peer-checked:bg-btn after:absolute after:top-0.5 after:left-[2px] after:bg-btntxt after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
                <div className="flex items-center justify-center">
                  {english ? <Flag country="US" size={20} /> : <Flag country="NO" size={20} />}
                </div>
              </>
            ) : (
              // Render a placeholder of equal height to keep layout consistent.
              <div style={{ height: '100px' }}></div>
            )}
          </div>

          {/* Glove Mode Toggle Container */}
          <div className="flex flex-col items-center space-y-4 w-40">
            <h3 className="font-semibold text-lg">{t('glove_mode')}</h3>
            <label className="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                id="toggle-glove"
                className="sr-only peer"
                checked={gloveMode}
                onChange={(e) => setGloveMode(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-gray-300 transition duration-300 ease-in-out peer-checked:bg-btn after:absolute after:top-0.5 after:left-[2px] after:bg-btntxt after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
            </label>
            <div className="flex items-center justify-center">
              {gloveMode ? <GiWinterGloves size={20} /> : <FaHandsClapping size={20} />}
            </div>
          </div>
        </div>

        {/* Actions Section */}
        {!gloveMode && (
          <div className="flex flex-col justify-center gap-4 md:mx-24">
            <button
              className="flex-1 bg-btn w-1/2 mx-auto text-btntxt py-3 px-5 rounded hover:opacity-90"
              onClick={resetPassword}
            >
              {t('reset_password')}
            </button>
            <button
              className="flex-1 bg-delete w-1/2 mx-auto text-white py-3 px-5 rounded hover:opacity-90"
              onClick={deleteUserAccount}
            >
              {t('delete_account')}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {error && <div className="text-delete text-center mt-2">{error}</div>}
        {success && (
          <div className="text-highlight text-center mt-2">
            {success}
          </div>
        )}

        <div className="flex justify-center items-center mt-5">
          <BackBtn />
        </div>
      </div>
    </>
  );
};

export default Settings;
