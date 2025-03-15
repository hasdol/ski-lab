// index.js

const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// ----------------------------------------------------------------
// 1st Gen Functions (for basic Auth triggers)
// ----------------------------------------------------------------
const functionsV1 = require('firebase-functions/v1');

// Basic Auth trigger (1st gen)
exports.onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const userRef = db.collection('users').doc(userId);

  const initialData = {
    preferences: {
      themePreference: 'light',
      languagePreference: 'en',
    },
    isPro: false,
    skiCount: 0,
    lockedSkisCount: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };

  try {
    await userRef.set(initialData);
    console.log(`Initialized user document for ${userId}`);
  } catch (error) {
    console.error(`Error initializing user document for ${userId}:`, error);
  }
});

// ----------------------------------------------------------------
// 2nd Gen Functions (for HTTPS and Firestore triggers)
// ----------------------------------------------------------------
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');

// HTTPS Callable Function: Create Checkout Session
exports.createCheckoutSession = onCall({
  secrets: ['STRIPE_SECRET', 'APP_URL', 'STRIPE_PRICE_ID', 'STRIPE_SIGNING_SECRET']
}, async (event) => {
  if (!event.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const userId = event.auth.uid;
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const appUrl = process.env.APP_URL;
  const stripePriceId = process.env.STRIPE_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    allow_promotion_codes: true,
    line_items: [{
      price: stripePriceId,
      quantity: 1,
    }],
    success_url: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/account`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  return { sessionId: session.id };
});

// HTTPS Function: Stripe Webhook
exports.stripeWebhook = onRequest({
  secrets: ['STRIPE_SECRET', 'STRIPE_SIGNING_SECRET']
}, async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const stripeSigningSecret = process.env.STRIPE_SIGNING_SECRET;
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeSigningSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutSession(session);
      break;
    }
    case 'invoice.paid': {
      // Handle successful invoice payment if needed
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

// Helper: Handle Checkout Session Completion (Upgrade to Pro)
async function handleCheckoutSession(session) {
  const userId = session.metadata.userId;
  const subscriptionId = session.subscription;
  const customerId = session.customer;
  const userRef = db.collection('users').doc(userId);
  const skisRef = userRef.collection('skis');

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User ${userId} does not exist.`);
      }
      const lockedSkisQuery = skisRef.where('locked', '==', true);
      const lockedSkisSnapshot = await transaction.get(lockedSkisQuery);

      const updateUserData = {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        isPro: true,
        lockedSkisCount: 0,
      };
      transaction.update(userRef, updateUserData);

      lockedSkisSnapshot.forEach((doc) => {
        transaction.update(doc.ref, { locked: false });
      });

      console.log(`User ${userId} upgraded to Pro. All skis unlocked.`);
    });
  } catch (error) {
    console.error(`Failed to handle checkout session for user ${userId}:`, error);
  }
}

// Helper: Handle Subscription Deletion (Downgrade to Free)
async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.userId;
  const userRef = db.collection('users').doc(userId);
  const skisRef = userRef.collection('skis');
  const skiLimit = 12; // Free plan limit

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User ${userId} does not exist.`);
      }
      const userData = userDoc.data() || {};
      const skiCount = userData.skiCount || 0;
      const lockedSkisCount = userData.lockedSkisCount || 0;
      const unlockedSkisCount = skiCount - lockedSkisCount;
      const skisToLockCount = unlockedSkisCount > skiLimit ? unlockedSkisCount - skiLimit : 0;

      let skisToLockSnapshot = null;
      if (skisToLockCount > 0) {
        const skisToLockQuery = skisRef
          .where('locked', '==', false)
          .orderBy('dateAdded', 'desc')
          .limit(skisToLockCount);
        skisToLockSnapshot = await transaction.get(skisToLockQuery);
      }

      const updateUserData = {
        isPro: false,
        stripeSubscriptionId: admin.firestore.FieldValue.delete(),
      };
      transaction.update(userRef, updateUserData);

      if (skisToLockCount > 0 && skisToLockSnapshot) {
        skisToLockSnapshot.forEach((doc) => {
          transaction.update(doc.ref, { locked: true });
        });
        transaction.update(userRef, {
          lockedSkisCount: admin.firestore.FieldValue.increment(skisToLockCount),
        });
        console.log(`User ${userId} downgraded to Free. Locked ${skisToLockCount} skis.`);
      } else {
        console.log(`User ${userId} downgraded to Free. No skis need to be locked.`);
      }
    });
  } catch (error) {
    console.error(`Failed to handle subscription deletion for user ${userId}:`, error);
  }
}

// Firestore Trigger: Ski Creation (2nd gen)
exports.onSkiCreated = onDocumentCreated('users/{userId}/skis/{skiId}', async (event) => {
  const { userId } = event.params;
  const userRef = db.collection('users').doc(userId);
  const skiData = event.data.data();

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User ${userId} does not exist.`);
      }
      const userData = userDoc.data() || {};
      const isPro = userData.isPro || false;
      const skiCount = userData.skiCount || 0;
      const skiLimit = isPro ? 48 : 12;
      const shouldLock = skiCount >= skiLimit;
      const updateData = { skiCount: admin.firestore.FieldValue.increment(1) };

      if (shouldLock) {
        updateData.lockedSkisCount = admin.firestore.FieldValue.increment(1);
      }

      transaction.update(userRef, updateData);
      transaction.update(event.data.ref, {
        locked: shouldLock,
        dateAdded: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Ski ${event.data.id} ${shouldLock ? 'locked' : 'unlocked'} due to plan limitations.`);
    });
  } catch (error) {
    console.error(`Failed to handle ski creation for user ${userId}:`, error);
  }
});

// Firestore Trigger: Ski Deletion (2nd gen)
exports.onSkiDeleted = onDocumentDeleted('users/{userId}/skis/{skiId}', async (event) => {
  const { userId } = event.params;
  const skiData = event.data.data();
  const userRef = db.collection('users').doc(userId);
  const skisRef = userRef.collection('skis');

  try {
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`User ${userId} does not exist.`);
      }
      const userData = userDoc.data() || {};
      const isPro = userData.isPro || false;
      const skiCount = userData.skiCount || 0;
      const lockedSkisCount = userData.lockedSkisCount || 0;
      const unlockedSkisCount = skiCount - lockedSkisCount;
      const skiLimit = isPro ? 48 : 12;
      const newUnlockedSkisCount = skiData.locked ? unlockedSkisCount : unlockedSkisCount - 1;
      const skisToUnlockCount =
        (!isPro && newUnlockedSkisCount < skiLimit && lockedSkisCount > 0)
          ? skiLimit - newUnlockedSkisCount
          : 0;

      let skisToUnlockSnapshot = null;
      if (skisToUnlockCount > 0) {
        const skisToUnlockQuery = skisRef.where('locked', '==', true)
          .orderBy('dateAdded')
          .limit(skisToUnlockCount);
        skisToUnlockSnapshot = await transaction.get(skisToUnlockQuery);
      }

      const updateData = { skiCount: admin.firestore.FieldValue.increment(-1) };
      if (skiData.locked) {
        updateData.lockedSkisCount = admin.firestore.FieldValue.increment(-1);
      }
      transaction.update(userRef, updateData);

      if (skisToUnlockCount > 0 && skisToUnlockSnapshot) {
        skisToUnlockSnapshot.forEach((doc) => {
          transaction.update(doc.ref, { locked: false });
        });
        transaction.update(userRef, {
          lockedSkisCount: admin.firestore.FieldValue.increment(-skisToUnlockCount),
        });
        console.log(`Unlocked ${skisToUnlockCount} ski(s) for user ${userId} as a slot became available.`);
      } else {
        console.log(`Ski ${event.data.id} deleted for user ${userId}. No skis needed to be unlocked.`);
      }
    });
  } catch (error) {
    console.error(`Failed to handle ski deletion for user ${userId}:`, error);
  }
});

// HTTPS Callable Function: Get Customer Portal URL (2nd gen)
exports.getCustomerPortalUrl = onCall({
  secrets: ['STRIPE_SECRET', 'APP_URL']
}, async (event) => {
  if (!event.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }
  const userId = event.auth.uid;
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User data not found.');
  }

  const stripeCustomerId = userDoc.data().stripeCustomerId;
  if (!stripeCustomerId) {
    throw new HttpsError('failed-precondition', 'Stripe customer ID not found.');
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET);
    const appUrl = process.env.APP_URL;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/account`,
    });
    return { url: portalSession.url };
  } catch (error) {
    console.error(`Failed to create customer portal session for user ${userId}:`, error);
    throw new HttpsError('internal', 'Unable to create customer portal session.');
  }
});
