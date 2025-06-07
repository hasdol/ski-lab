'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import getStripe from '@/helpers/stripe';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import { RiCheckFill, RiShoppingCartLine } from 'react-icons/ri';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState('');
  const functions = getFunctions();
  const { userData } = useAuth();
  const currentPlan = userData?.plan || 'free';

  // Plan ranking for upgrade/downgrade logic
  const planRank = { free: 0, athlete: 1, coach: 2, company: 3 };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const getStripePlans = httpsCallable(functions, 'getStripePlans');
        const result = await getStripePlans();
        const sorted = result.data.sort((a, b) => a.amount - b.amount);
        setPlans(sorted);
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
      setLoadingPlans(false);
    };

    fetchPlans();
  }, [functions]);

  const handlePlanSelect = async (priceId, planKey, isDowngrade) => {
    if (currentPlan !== 'free') {
      setLoadingCheckout(priceId);
      try {
        const getPortalUrl = httpsCallable(functions, 'getCustomerPortalUrl');
        const { data } = await getPortalUrl();
        window.location.href = data.url;
      } catch (err) {
        console.error(err);
      }
      setLoadingCheckout('');
      return;
    }

    if (isDowngrade) {
      if (!window.confirm('Nedgradering kan medføre at enkelte funksjoner går tapt. Er du sikker?')) return;
    }

    setLoadingCheckout(priceId);
    try {
      const createSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createSession({ priceId });
      const stripe = await getStripe();
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } catch (err) {
      console.error(err);
    }
    setLoadingCheckout('');
  };

  const getButtonText = (plan, isCurrent, isUpgrade) => {
    if (isCurrent) {
      return currentPlan === 'free' ? 'Current Plan' : 'Manage Subscription';
    }
    if (currentPlan === 'free') {
      return 'Choose Plan';
    }
    return isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`;
  };

  if (loadingPlans) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiShoppingCartLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600">Select a plan</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-gray-600">No plans available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.plan === currentPlan;
            const isUpgrade = planRank[plan.plan] > planRank[currentPlan];
            const isDowngrade = planRank[plan.plan] < planRank[currentPlan];
            const buttonText = getButtonText(plan, isCurrent, isUpgrade);

            return (
              <div
                key={plan.productId}
                className="rounded-lg relative shadow overflow-hidden flex flex-col"
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 bg-blue-50 text-blue-600 text-sm px-2 py-1 rounded-lg">
                    Current
                  </span>
                )}

                <div className="px-6 pt-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {plan.name}
                  </h2>
                  <p className="text-sm text-gray-500 italic mt-1">
                    {plan.name === 'Company' && 'Industry Leader'}
                    {plan.name === 'Coach' && '"Puppet-Master"'}
                    {plan.name === 'Senior Pluss' && 'Value pack'}
                    {plan.name === 'Senior' && 'Professional'}
                  </p>
                </div>

                <div className="flex-1 px-6 pt-4 space-y-2">
                  {plan.description.split(';').map((feat, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <RiCheckFill className="text-blue-500 w-5 h-5" />
                      <span className="text-gray-700 font-medium">{feat.trim()}</span>
                    </div>
                  ))}
                </div>

                {plan.amount && (
                  <div className="px-6 pt-4">
                    <p className="text-4xl font-bold text-gray-800">
                      {(plan.amount / 100).toFixed(0)}{' '}
                      <span className="text-lg font-medium text-gray-600">
                        {plan.currency.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 italic">
                      per {plan.interval}
                    </p>
                  </div>
                )}

                <div className="px-6 py-6">
                  <Button
                    loading={loadingCheckout === plan.priceId}
                    disabled={currentPlan === 'free' && isCurrent}
                    onClick={() =>
                      handlePlanSelect(
                        plan.priceId,
                        plan.plan,
                        isDowngrade
                      )
                    }
                    className={`${isCurrent && currentPlan === 'free'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:to-indigo-600 active:scale-95 focus:ring-2 focus:ring-indigo-300/50 shadow-sm'
                      } w-full py-2 rounded-md`}
                  >
                    {buttonText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlansPage;