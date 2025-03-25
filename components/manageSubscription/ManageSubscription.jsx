'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { RiLockUnlockLine } from "react-icons/ri";
import Spinner from '@/components/common/Spinner/Spinner';
import { useRouter } from 'next/navigation';

const ManageSubscription = () => {
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    router.push('/plans');
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const getCustomerPortalUrl = httpsCallable(functions, 'getCustomerPortalUrl');
      const { data } = await getCustomerPortalUrl();
      window.location.href = data.url; // Omdirigerer til Stripe Billing Portal
    } catch (error) {
      console.error('Error getting customer portal URL:', error);
    }
    setLoading(false);
  };

  // Hvis brukeren ikke har free-plan, så antas de å ha et aktivt abonnement
  if (userData?.plan && userData.plan !== 'free') {
    return (
      <button
        onClick={handleManageSubscription}
        className="hover:underline text-highlight"
        disabled={loading}
      >
        {loading ? t('loading') : t('manageSubscription')}
      </button>
    );
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="flex cursor-pointer h-fit w-fit justify-center bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow py-3 px-5 rounded hover:opacity-90"
    >
      <span className="flex items-center">
        {t('upgrade')}
        {loading ? <Spinner className="ml-1" /> : <RiLockUnlockLine className="ml-1" />}
      </span>
    </button>
  );
};

export default ManageSubscription;
