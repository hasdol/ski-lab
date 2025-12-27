'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import getStripe from '@/helpers/stripe';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import { RiShoppingCartLine } from 'react-icons/ri'; // ...existing code... removed RiCheckFill, RiCloseLine
import { useRouter } from 'next/navigation';
import { PLAN_LIMITS } from '@/lib/constants/planLimits'; // NEW
import PageHeader from '@/components/layout/PageHeader'; // <-- Add this import
import { MdOutlineTimer } from "react-icons/md";


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

        // Ensure a visible Free plan card (hardcoded) with metadata-like fields
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
              // hardcoded metadata-like fields
              skiLimit: 8,
              teams: 0,
              members: 0,
              features: ['Unlimited testing', 'Advanced analytics', 'Join teams'],
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
    <div className="p-4 max-w-4xl w-full self-center pb-24 md:pb-8">
      <PageHeader
        icon={<RiShoppingCartLine className="text-blue-600 text-2xl" />}
        title="Pricing"
        subtitle={<span>Choose the plan that fits your needs</span>}
        actions={null}
      />

      {plans.length === 0 ? (
        <p className="text-center text-gray-600">No plans available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.plan === currentPlan;
            const isUpgrade = (planRank[plan.plan] ?? 0) > (planRank[currentPlan] ?? 0);
            const isDowngrade = (planRank[plan.plan] ?? 0) < (planRank[currentPlan] ?? 0);
            const buttonText = getButtonText(plan, isCurrent, isUpgrade);

            // Use Stripe metadata with fallback to PLAN_LIMITS
            const skisIncluded = plan.skiLimit ?? (PLAN_LIMITS[plan.plan] ?? '—');
            // Always show features for Free plan
            const features =
              plan.plan === 'free'
                ? ['Unlimited testing', 'Advanced analytics', 'Join teams']
                : Array.isArray(plan.features) && plan.features.length > 0
                ? plan.features
                : [];

            return (
              <div
                key={plan.productId}
                className={`p-6 rounded-2xl relative overflow-hidden flex flex-col bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs transition-colors duration-200 ${
                  isCurrent ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-3 right-3 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                    Current
                  </span>
                )}

                <div className="pt-2">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">{plan.name}</h2>
                  {plan.plan !== 'free' && !hasHadSubscription && (
                    <p className="flex items-center text-sm bg-blue-100 w-fit px-2 py-1 rounded text-blue-600 mt-1">
                      <MdOutlineTimer className="mr-1" /> 30-day free trial
                    </p>
                  )}
                </div>

                <div className="flex-1 pt-2 space-y-4">
                  {/* Skis included */}
                  <div className="flex">
                    <span className="text-base font-semibold text-gray-800">{skisIncluded}</span>
                    <span className="ml-2  text-gray-600">skis included</span>
                  </div>

                  {/* Features (metadata, no list dots) */}
                  {features.length > 0 && (
                    <div className="space-y-3 md:space-x-3">
                      {features.map((f, i) => (
                        <div
                          key={i}
                          className="text-sm text-blue-600 bg-blue-100 rounded-2xl px-3 py-1 inline-block"
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Teams */}
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800 w-32">Create teams:</span>
                    {Number(plan.teams) > 0 ? (
                      <span className="text-sm text-gray-700">Up to {plan.teams}</span>
                    ) : (
                      <span className="text-sm text-gray-400">Not included</span>
                    )}
                  </div>

                  {/* Members per team */}
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-800 w-32">Team members:</span>
                    {Number(plan.members) > 0 ? (
                      <span className="text-sm text-gray-700">{plan.members}</span>
                    ) : (
                      <span className="text-sm text-gray-400">Not included</span>
                    )}
                  </div>
                </div>

                {plan.amount !== null ? (
                  <div className="pt-4 pb-2 bg-gray-50 rounded-xl">
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
                ) : (
                  <div className="pt-4 pb-2 bg-gray-50 rounded-xl">
                    <p className="text-4xl font-bold text-gray-800">
                      {(plan.amount / 100).toFixed(0)}{' '}
                      <span className="text-lg font-medium text-gray-600">
                        {plan.currency.toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 italic mt-2">forever</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    loading={loadingCheckout === plan.priceId}
                    disabled={currentPlan === 'free' && isCurrent}
                    onClick={() =>
                      handlePlanSelect(plan.priceId, plan.plan, isDowngrade)
                    }
                    variant="primary"
                    className={`w-full text-base font-semibold ${
                      isCurrent && currentPlan === 'free' ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                    }`}
                  >
                    {buttonText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW: SEO cross-links */}
      <div className="mt-10 p-6 rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200">
        <p className="text-center text-sm text-gray-600">
          Need help choosing a plan? See how teams work on the{' '}
          <a href="/teams" className="text-blue-600 underline">Teams page</a>{' '}
          or{' '}
          <a href="/contact" className="text-blue-600 underline">contact us</a>.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;