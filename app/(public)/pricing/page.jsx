'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import getStripe from '@/helpers/stripe';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import { RiCheckFill, RiShoppingCartLine, RiCloseLine } from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import { PLAN_LIMITS } from '@/lib/constants/planLimits'; // NEW

const PricingPage = () => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(null);
  const functions = getFunctions();
  const { user, userData } = useAuth();
  const currentPlan = userData?.plan || 'free';
  const router = useRouter();

  // Hide free trial banner if the user has had a subscription before
  const hasHadSubscription = !!(userData?.stripeCustomerId || userData?.stripeSubscriptionId);

  // Plan ranking for upgrade/downgrade text
  const planRank = { free: 0, athlete: 1, coach: 2, company: 3 };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const getStripePlans = httpsCallable(functions, 'getStripePlans');
        const result = await getStripePlans();
        let fetched = (result?.data || []);

        // Ensure a visible Free plan card
        const hasFree = fetched.some((p) => p.plan === 'free');
        if (!hasFree) {
          fetched = [
            {
              productId: 'free',
              name: 'Free',
              plan: 'free',
              amount: null,
              currency: 'NOK',
              interval: 'month',
              description: '',
              priceId: '',
            },
            ...fetched,
          ];
        }

        const sorted = fetched.sort((a, b) => {
          if (a.plan === 'free') return -1;
          if (b.plan === 'free') return 1;
          return (a.amount || 0) - (b.amount || 0);
        });
        setPlans(sorted);
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
      setLoadingPlans(false);
    };

    fetchPlans();
  }, [functions]);

  const handlePlanSelect = async (priceId, planKey, isDowngrade) => {
    // Not logged in: send to login with callback back to pricing
    if (!user) {
      const cb = encodeURIComponent('/pricing');
      router.push(`/login?next=${cb}`);
      return;
    }

    // Already has a paid plan -> open Stripe portal
    if (currentPlan !== 'free') {
      setLoadingCheckout(priceId);
      try {
        const getPortalUrl = httpsCallable(functions, 'getCustomerPortalUrl');
        const { data } = await getPortalUrl();
        window.location.href = data.url;
      } catch (err) {
        console.error(err);
      }
      setLoadingCheckout(null);
      return;
    }

    // Free -> go to checkout
    if (isDowngrade) {
      if (!window.confirm('Downgrading may remove some features. Continue?')) return;
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
    setLoadingCheckout(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
          <div className="text-xs text-gray-600 mt-1 flex flex-col gap-2">
            <span>Choose the plan that fits your needs</span>
            
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-gray-600">No plans available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.plan === currentPlan;
            const isUpgrade = (planRank[plan.plan] ?? 0) > (planRank[currentPlan] ?? 0);
            const isDowngrade = (planRank[plan.plan] ?? 0) < (planRank[currentPlan] ?? 0);
            const buttonText = getButtonText(plan, isCurrent, isUpgrade);

            // NEW: Derive plan limit and team permissions
            const skisIncluded =
              PLAN_LIMITS[plan.plan] !== undefined ? PLAN_LIMITS[plan.plan] : '—';
            const canCreateManageTeams = ['coach', 'company'].includes(plan.plan);

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
                  {plan.plan !== 'free' && !hasHadSubscription && (
                    <p className="text-sm bg-green-100 w-fit px-2 py-1 rounded text-green-700 mt-1">30-day free trial</p>
                  )}
                </div>

                {/* NEW: Only the required info per plan */}
                <div className="flex-1 px-6 pt-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <RiCheckFill className="text-green-500 w-5 h-5" />
                    <span className="text-gray-800 font-medium">
                       {skisIncluded} skis included
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <RiCheckFill className="text-green-500 w-5 h-5" />
                    <span className="text-gray-800 font-medium">Join teams</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canCreateManageTeams ? (
                      <RiCheckFill className="text-green-500 w-5 h-5" />
                    ) : (
                      <RiCloseLine className="text-gray-400 w-5 h-5" />
                    )}
                    <span
                      className={
                        canCreateManageTeams
                          ? 'text-gray-800 font-medium'
                          : 'text-gray-400'
                      }
                    >
                      Create & manage teams
                    </span>
                  </div>
                </div>

                {plan.amount && (
                  <div className="px-6 pt-4">
                    <p className="text-4xl font-bold text-gray-800">
                      {(plan.amount / 100).toFixed(0)}{' '}
                      <span className="text-lg font-medium text-gray-600">
                        {plan.currency.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 italic mt-2">
                      per {plan.interval}
                    </p>
                  </div>
                )}

                <div className="px-6 py-6">
                  <Button
                    loading={loadingCheckout === plan.priceId}
                    disabled={currentPlan === 'free' && isCurrent}
                    onClick={() =>
                      handlePlanSelect(plan.priceId, plan.plan, isDowngrade)
                    }
                    className={`${
                      isCurrent && currentPlan === 'free'
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

export default PricingPage;