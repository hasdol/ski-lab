import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import getStripe from '../../helpers/stripe';
import { RiLockUnlockLine } from "react-icons/ri";



const GetPro = () => {
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession();

      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });

      if (error) {
        console.error(error);
        // Optionally display an error message to the user
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Optionally display an error message to the user
    }

    setLoading(false);
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const getCustomerPortalUrl = httpsCallable(functions, 'getCustomerPortalUrl');
      const { data } = await getCustomerPortalUrl();

      window.location.href = data.url; // Redirect to Stripe Customer Portal
    } catch (error) {
      console.error('Error getting customer portal URL:', error);
      // Optionally display an error message to the user
    }

    setLoading(false);
  };

  if (userData?.isPro && !userData?.admin) {
    return (
      <button
        onClick={handleManageSubscription}
        className='hover:underline'
        disabled={loading}
      >
        {loading ? t('loading') : t('manageSubscription')}
      </button>
    );
  }

  if (userData?.admin) {
    return (
      <p>Admin</p>
    )
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className='flex cursor-pointer h-fit w-fit justify-center
                    bg-gradient-to-r from-btn to-blue-400 text-btntxt shadow py-3 px-5 rounded '
    >
      {loading ? t('loading') : <span className='flex'>{t('getPro')} <RiLockUnlockLine className='ml-1'/></span>}
    </button>
  );
};

export default GetPro;
