'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import Button from '../../../../components/common/Button';

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
      <Button
        onClick={handleManageSubscription}
        loading={loading}
        variant='primary'
      >
        {t('manageSubscription')}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleUpgrade}
      loading={loading}
      variant="primary"
    >
      {t('upgrade')}
    </Button>
  );
};

export default ManageSubscription;
