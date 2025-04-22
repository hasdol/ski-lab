'use client'
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import getStripe from '@/helpers/stripe';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/common/Button';
import { RiCheckFill } from "react-icons/ri";

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState('');
  const functions = getFunctions();
  const { userData } = useAuth();
  const currentPlan = userData?.plan || 'free';

  // Ranking of plans: free = 0, athlete = 1, coach = 2, company = 3
  const planRank = { free: 0, athlete: 1, coach: 2, company: 3 };

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const getStripePlans = httpsCallable(functions, 'getStripePlans');
        const result = await getStripePlans();
        // Sort plans by price amount low-high
        const sortedPlans = result.data.sort((a, b) => a.amount - b.amount);
        setPlans(sortedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
      }
      setLoadingPlans(false);
    };

    fetchPlans();
  }, [functions]);

  const handlePlanSelect = async (priceId, newPlan, isDowngrade) => {
    // For paid users, clicking any plan (including the current plan)
    // should redirect to the Stripe portal.
    if (currentPlan !== 'free') {
      setLoadingCheckout(priceId);
      try {
        const getPortalUrl = httpsCallable(functions, 'getCustomerPortalUrl');
        const result = await getPortalUrl();
        window.location.href = result.data.url;
      } catch (error) {
        console.error('Error redirecting to customer portal:', error);
      }
      setLoadingCheckout('');
      return;
    }

    // For free users: if it's a downgrade, confirm with the user first.
    if (isDowngrade) {
      const confirmDowngrade = window.confirm(
        "Nedgradering kan medføre at enkelte funksjoner går tapt. Er du sikker?"
      );
      if (!confirmDowngrade) return;
    }
    setLoadingCheckout(priceId);
    try {
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSession({ priceId });
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({ sessionId: result.data.sessionId });
      if (error) {
        console.error('Error redirecting to checkout:', error);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
    setLoadingCheckout('');
  };

  // Determine button text based on the plan and subscription state
  const getButtonText = (plan, isCurrentPlan, isUpgrade, isDowngrade) => {
    if (isCurrentPlan) {
      // For the current plan, show "Current Plan" for free users and
      // "Manage Subscription" for paid users.
      return currentPlan === 'free' ? "Current Plan" : "Manage Subscription";
    } else {
      if (currentPlan === 'free') {
        return "Choose Plan";
      } else {
        return isUpgrade ? `Upgrade to ${plan.name}` : `Downgrade to ${plan.name}`;
      }
    }
  };

  if (loadingPlans) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="my-5 mb-10 text-3xl font-semibold text-center">Pick a plan</h1>
      {plans.length === 0 && <p>No plans available at the moment.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.plan === currentPlan;
          const isUpgrade = planRank[plan.plan] > planRank[currentPlan];
          const isDowngrade = planRank[plan.plan] < planRank[currentPlan];
          const buttonText = getButtonText(plan, isCurrentPlan, isUpgrade, isDowngrade);

          return (
            <div
              key={plan.productId}
              className="bg-gradient-to-b from-container to-slate-100 rounded-md shadow-md text-center relative flex flex-col"
            >
              {isCurrentPlan && (
                <div className="absolute top-0 right-0 bg-gradient-to-br from-blue-500 to-indigo-500 text-white px-2 py-1 text-xs rounded">
                  Current
                </div>
              )}

              <div className="bg-slate-700 p-4 rounded-t text-white">
                <h2 className="font-semibold text-xl ">{plan.name}</h2>
                <p className="text-sm mt-1 italic">
                  {plan.name === "Company" && 'Industry Leader'}
                  {plan.name === "Coach" && '"Puppet-Master"'}
                  {plan.name === "Athlete" && 'Professional'}
                </p>
              </div>

              <div className="flex flex-col space-y-2 items-center mt-10 mb-5 font-semibold">
                {plan.description.split(';').map((sentence, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <RiCheckFill className="text-blue-500" />
                    <span>{sentence.trim()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                {plan.amount && (
                  <div className="my-5">
                    <div className="text-highlight mb-8">
                      <p className="font-semibold">30 Days Free Trail</p>
                      <p className="text-text text-xs">*only new users</p>
                    </div>
                    <p className="text-4xl mb-2 text-gray-800">
                      {(plan.amount / 100)} {plan.currency.toUpperCase()}
                    </p>
                    <p className="italic">per {plan.interval}</p>
                  </div>
                )}
                <div className="flex justify-center mx-5 my-5">
                  <Button
                    loading={loadingCheckout === plan.priceId}
                    disabled={currentPlan === 'free' && plan.plan === currentPlan}
                    onClick={() =>
                      handlePlanSelect(
                        plan.priceId,
                        plan.plan,
                        planRank[plan.plan] < planRank[currentPlan]
                      )
                    }
                    // You can either set variant via prop or inline via className
                    className={`${plan.plan === currentPlan && currentPlan === 'free'
                        ? "bg-gray-500"
                        : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:to-indigo-600 active:scale-[0.98] focus:ring-2 focus:ring-indigo-300/50 shadow-sm"
                      } text-white px-4 py-2 rounded-md mt-4`}
                  >
                    {buttonText}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlansPage;
