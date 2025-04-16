const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const functionsV1 = require('firebase-functions/v1');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');

// ----------------------------------------------------------------
// Auth Trigger – Initialize user
// ----------------------------------------------------------------
exports.onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  const initialData = {
    preferences: {
      themePreference: 'light',
      languagePreference: 'en',
    },
    displayName: '', 
    photoURL: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: 'free',
    skiCount: 0,
    lockedSkisCount: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    photoURL: null,
  };
  try {
    await userRef.set(initialData);
    console.log(`Initialized user document for ${user.uid}`);
  } catch (error) {
    console.error(`Error initializing user document for ${user.uid}:`, error);
  }
});

// ----------------------------------------------------------------
// Stripe Callable Functions
// ----------------------------------------------------------------
exports.getStripePlans = onCall({ secrets: ['STRIPE_SECRET'] }, async (event) => {
  if (!event.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const stripe = require('stripe')(process.env.STRIPE_SECRET);

  try {
    const products = await stripe.products.list({ active: true });
    const plans = await Promise.all(products.data.map(async (product) => {
      const prices = await stripe.prices.list({ product: product.id, active: true });
      if (prices.data.length === 0) return null;
      const price = prices.data[0];
      return {
        productId: product.id,
        name: product.name,
        description: product.description,
        priceId: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        plan: product.metadata.plan || 'unknown',
      };
    }));
    return plans.filter(Boolean);
  } catch (error) {
    console.error('Error fetching Stripe plans:', error);
    throw new HttpsError('internal', 'Unable to fetch plans.');
  }
});

exports.createCheckoutSession = onCall({ secrets: ['STRIPE_SECRET', 'APP_URL'] }, async (event) => {
  if (!event.auth)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  
  const { priceId } = event.data;
  if (!priceId)
    throw new HttpsError('invalid-argument', 'Price ID must be provided.');

  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const appUrl = process.env.APP_URL;
  const userId = event.auth.uid;
  
  // Fetch the user's Firestore document to check subscription details.
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};

  // If either a stripeSubscriptionId or stripeCustomerId exists, user is considered existing.
  const alreadySubscribed = Boolean(userData.stripeSubscriptionId || userData.stripeCustomerId);
  
  try {
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);
    const plan = product.metadata.plan || 'free';
    
    // Prepare subscription data.
    const subscriptionData = { metadata: { userId, plan } };
    
    // Only add a 30-day trial for new users selecting the athlete plan.
    if (plan === 'athlete' && !alreadySubscribed) {
      subscriptionData.trial_period_days = 30;
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/account`,
      metadata: { userId, plan },
      subscription_data: subscriptionData,
    });
    
    return { sessionId: session.id };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new HttpsError('internal', 'Unable to create checkout session.');
  }
});


exports.getCustomerPortalUrl = onCall({ secrets: ['STRIPE_SECRET', 'APP_URL'] }, async (event) => {
  if (!event.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const userId = event.auth.uid;
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) throw new HttpsError('not-found', 'User not found.');
  const stripeCustomerId = userDoc.data().stripeCustomerId;
  if (!stripeCustomerId) throw new HttpsError('failed-precondition', 'Missing Stripe customer ID.');

  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.APP_URL}/account`,
  });
  return { url: portalSession.url };
});

// ----------------------------------------------------------------
// Stripe Webhook
// ----------------------------------------------------------------
exports.stripeWebhook = onRequest({
  secrets: ['STRIPE_SECRET', 'STRIPE_SIGNING_SECRET']
}, async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_SIGNING_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSession(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

// ----------------------------------------------------------------
// Stripe Webhook Helpers
// ----------------------------------------------------------------
async function handleCheckoutSession(session) {
  const userRef = db.collection('users').doc(session.metadata.userId);
  const skisRef = userRef.collection('skis');
  const plan = session.metadata.plan || 'free';

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error(`User ${session.metadata.userId} does not exist.`);
    const lockedSkisSnapshot = await transaction.get(skisRef.where('locked', '==', true));

    transaction.update(userRef, {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      plan,
      lockedSkisCount: 0,
    });

    lockedSkisSnapshot.forEach((doc) => {
      transaction.update(doc.ref, { locked: false });
    });
  });
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.userId;
  const userRef = db.collection('users').doc(userId);
  const skisRef = userRef.collection('skis');

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new Error(`User ${userId} does not exist.`);

    const userData = userDoc.data();
    const skiCount = userData.skiCount || 0;
    const lockedSkisCount = userData.lockedSkisCount || 0;
    const planLimits = { free: 12 };
    const skiLimit = planLimits.free;
    const unlockedSkisCount = skiCount - lockedSkisCount;
    const skisToLockCount = Math.max(0, unlockedSkisCount - skiLimit);

    let skisToLockSnapshot = null;
    if (skisToLockCount > 0) {
      skisToLockSnapshot = await transaction.get(
        skisRef.where('locked', '==', false).orderBy('dateAdded', 'desc').limit(skisToLockCount)
      );
    }

    transaction.update(userRef, {
      plan: 'free',
      stripeSubscriptionId: admin.firestore.FieldValue.delete(),
    });

    if (skisToLockSnapshot) {
      skisToLockSnapshot.forEach((doc) => {
        transaction.update(doc.ref, { locked: true });
      });
      transaction.update(userRef, {
        lockedSkisCount: admin.firestore.FieldValue.increment(skisToLockCount),
      });
    }
  });

  const snap = await userRef.get();
  if (snap.exists && snap.data().scheduledDeletion) {
    await admin.auth().deleteUser(userId);
    await userRef.delete();
  }
}

async function handleSubscriptionUpdated(subscription) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const userId = subscription.metadata.userId;
  const userRef = db.collection('users').doc(userId);
  const skisRef = userRef.collection('skis');

  try {
    const priceId = subscription.items.data[0]?.price.id;
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);
    const newPlan = product.metadata.plan || 'free';

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error(`User ${userId} does not exist.`);

      const userData = userDoc.data();
      const skiCount = userData.skiCount || 0;
      const lockedSkisCount = userData.lockedSkisCount || 0;
      const unlockedSkisCount = skiCount - lockedSkisCount;

      const planLimits = {
        free: 12,
        athlete: 48,
        coach: 200,
        company: 5000,
      };
      const newLimit = planLimits[newPlan] || 12;

      // Case: Too many unlocked skis → lock
      const skisToLockCount = Math.max(0, unlockedSkisCount - newLimit);
      if (skisToLockCount > 0) {
        const skisToLockSnapshot = await transaction.get(
          skisRef.where('locked', '==', false)
                 .orderBy('dateAdded', 'desc')
                 .limit(skisToLockCount)
        );
        skisToLockSnapshot.forEach((doc) => {
          transaction.update(doc.ref, { locked: true });
        });
        transaction.update(userRef, {
          lockedSkisCount: admin.firestore.FieldValue.increment(skisToLockCount),
        });
      }

      // Case: Enough room for unlocking → unlock
      const skisToUnlockCount = Math.max(0, newLimit - unlockedSkisCount);
      if (skisToUnlockCount > 0 && lockedSkisCount > 0) {
        const actualUnlockCount = Math.min(skisToUnlockCount, lockedSkisCount);

        const skisToUnlockSnapshot = await transaction.get(
          skisRef.where('locked', '==', true)
                 .orderBy('dateAdded') // oldest locked skis first
                 .limit(actualUnlockCount)
        );
        skisToUnlockSnapshot.forEach((doc) => {
          transaction.update(doc.ref, { locked: false });
        });
        transaction.update(userRef, {
          lockedSkisCount: admin.firestore.FieldValue.increment(-actualUnlockCount),
        });
      }

      transaction.update(userRef, { plan: newPlan });
    });

    console.log(`Updated user ${userId} to plan ${newPlan}`);
  } catch (error) {
    console.error(`Failed to update user plan:`, error);
  }
}




// ----------------------------------------------------------------
// Firestore Triggers
// ----------------------------------------------------------------
exports.onSkiCreated = onDocumentCreated('users/{userId}/skis/{skiId}', async (event) => {
  const { userId } = event.params;
  const userRef = db.collection('users').doc(userId);
  const skiData = event.data.data();

  const userDoc = await userRef.get();
  if (!userDoc.exists) return;
  const userData = userDoc.data();
  const planLimits = {
    free: 12,
    athlete: 48,
    coach: 200,
    company: 5000,
  };
  const skiLimit = planLimits[userData.plan || 'free'] || 12;
  const skiCount = userData.skiCount || 0;
  const shouldLock = skiCount >= skiLimit;

  await userRef.firestore.runTransaction(async (transaction) => {
    transaction.update(userRef, {
      skiCount: admin.firestore.FieldValue.increment(1),
      ...(shouldLock && { lockedSkisCount: admin.firestore.FieldValue.increment(1) }),
    });
    transaction.update(event.data.ref, {
      locked: shouldLock,
      dateAdded: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
});

exports.onSkiDeleted = onDocumentDeleted('users/{userId}/skis/{skiId}', async (event) => {
  const { userId } = event.params;
  const skiData = event.data.data();
  const userRef = db.collection('users').doc(userId);
  const skisRef = userRef.collection('skis');

  const userDoc = await userRef.get();
  if (!userDoc.exists) return;
  const userData = userDoc.data();

  const planLimits = {
    free: 12,
    athlete: 48,
    coach: 200,
    company: 5000,
  };
  const skiLimit = planLimits[userData.plan || 'free'] || 12;
  const skiCount = userData.skiCount || 0;
  const lockedSkisCount = userData.lockedSkisCount || 0;
  const unlockedSkisCount = skiCount - lockedSkisCount;
  const newUnlockedCount = skiData.locked ? unlockedSkisCount : unlockedSkisCount - 1;
  const skisToUnlockCount = (newUnlockedCount < skiLimit && lockedSkisCount > 0)
    ? skiLimit - newUnlockedCount
    : 0;

  await db.runTransaction(async (transaction) => {
    const update = {
      skiCount: admin.firestore.FieldValue.increment(-1),
    };
    if (skiData.locked) update.lockedSkisCount = admin.firestore.FieldValue.increment(-1);
    transaction.update(userRef, update);

    if (skisToUnlockCount > 0) {
      const snapshot = await transaction.get(
        skisRef.where('locked', '==', true).orderBy('dateAdded').limit(skisToUnlockCount)
      );
      snapshot.forEach((doc) => {
        transaction.update(doc.ref, { locked: false });
      });
      transaction.update(userRef, {
        lockedSkisCount: admin.firestore.FieldValue.increment(-skisToUnlockCount),
      });
    }
  });
});

// ----------------------------------------------------------------
// Account Deletion Management
// ----------------------------------------------------------------

async function deleteProfilePicture(userId) {
  const bucket = admin.storage().bucket(); // Uses the default bucket from your project
  const file = bucket.file(`profilePictures/${userId}/profile.jpg`);
  try {
    await file.delete();
    console.log('Profile picture deleted successfully.');
  } catch (error) {
    // If the file is not found, error.code might be 404.
    if (error.code === 404) {
      console.log('No profile picture to delete.');
    } else {
      console.error('Error deleting profile picture:', error.message);
      throw error;
    }
  }
}

exports.deleteUserAccount = onCall({ secrets: ['STRIPE_SECRET'] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }
  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError("not-found", "User document not found.");
  }
  const userData = userDoc.data();

  // Check for an active subscription
  if (userData.stripeSubscriptionId) {
    const confirmDeleteSubscription = request.data.confirmDeleteSubscription;
    if (!confirmDeleteSubscription) {
      throw new HttpsError(
        "failed-precondition",
        "You must confirm that your active subscription will be cancelled in order to delete your account."
      );
    }
    // Initialize Stripe with the secret from the environment
    const stripe = require('stripe')(process.env.STRIPE_SECRET);
    try {
      await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
      console.log(`Stripe subscription ${userData.stripeSubscriptionId} cancelled.`);
      await userRef.update({
        stripeSubscriptionId: admin.firestore.FieldValue.delete(),
        stripeCustomerId: admin.firestore.FieldValue.delete(),
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw new HttpsError("internal", "Error cancelling subscription. Please try again later.");
    }
  }

  // Delete the profile picture from Cloud Storage.
  await deleteProfilePicture(uid);

  // Delete subcollections (e.g., 'skis' and 'testResults').
  const subcollections = ['skis', 'testResults'];
  for (const sub of subcollections) {
    const subColRef = userRef.collection(sub);
    const snapshot = await subColRef.get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Subcollection '${sub}' deleted for user ${uid}.`);
  }

  // Delete the Firebase Auth user.
  await admin.auth().deleteUser(uid);

  // Delete the main Firestore user document.
  await userRef.delete();

  return { message: "User account and all related data deleted successfully." };
});




exports.cancelUserDeletion = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be authenticated.");
  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  await userRef.update({
    scheduledDeletion: admin.firestore.FieldValue.delete(),
    deletionScheduledAt: admin.firestore.FieldValue.delete(),
  });
  return { message: "Account deletion has been cancelled." };
});

exports.joinTeamByCode = onCall(async (request) => {
  // Must be signed in.
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = request.auth.uid;
  const code = request.data.code; // The code from the client
  
  if (!code) {
    throw new HttpsError('invalid-argument', 'Missing team code.');
  }

  const teamsRef = db.collection('teams');
  const snap = await teamsRef.where('joinCode', '==', code).limit(1).get();

  if (snap.empty) {
    throw new HttpsError('not-found', 'No team found with the given code.');
  }

  // We only take the first matching doc
  const teamDoc = snap.docs[0];
  const teamId = teamDoc.id;

  // We can optionally check if user is already in the team.
  const teamData = teamDoc.data() || {};
  const members = teamData.members || [];

  if (members.includes(userId)) {
    // They’re already in the team – optional or you can allow no-op
    throw new HttpsError('already-exists', 'You are already in this team.');
  }

  // Now add user to members
  await teamDoc.ref.update({
    members: admin.firestore.FieldValue.arrayUnion(userId),
  });

  return { teamId };
});

exports.leaveTeamById = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const userId = request.auth.uid;
  const teamId = request.data.teamId;

  if (!teamId) {
    throw new HttpsError('invalid-argument', 'Missing team ID.');
  }

  const teamRef = db.collection('teams').doc(teamId);
  const teamSnap = await teamRef.get();

  if (!teamSnap.exists) {
    throw new HttpsError('not-found', 'Team not found.');
  }

  const teamData = teamSnap.data();

  if (teamData.createdBy === userId) {
    throw new HttpsError('failed-precondition', 'You cannot leave a team you created.');
  }

  // Remove the user from the members array
  await teamRef.update({
    members: admin.firestore.FieldValue.arrayRemove(userId),
  });

  return { message: 'Left the team successfully.' };
});

// Add this with other secret definitions (near STRIPE_SECRET)
const metnoUserAgent = defineSecret('METNO_USER_AGENT');

// Replace the existing weatherProxy function with this v2 version
exports.weatherProxy = onRequest(
  { 
    secrets: [metnoUserAgent],
    cors: true,
    region: 'europe-west1' // Choose region closest to your users
  }, 
  async (req, res) => {
    try {
      // Verify authentication
      if (!req.headers.authorization?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const idToken = req.headers.authorization.split('Bearer ')[1];
      await admin.auth().verifyIdToken(idToken);

      // Validate coordinates
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Invalid coordinates format' });
      }
      
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return res.status(400).json({ error: 'Coordinates out of range' });
      }

      // Fetch from MET API
      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
        {
          headers: {
            'User-Agent': `${metnoUserAgent.value()} (${process.env.NODE_ENV})`,
          },
        }
      );

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      
      const data = await response.json();
      
      // Cache response for 30 minutes
      res.set('Cache-Control', 'public, max-age=1800, s-maxage=1800');
      res.status(200).json(data);
    } catch (error) {
      console.error('Weather proxy error:', error);
      const status = error.code === 'auth/id-token-expired' ? 401 : 500;
      res.status(status).json({ 
        error: 'Failed to fetch weather data',
        details: error.message 
      });
    }
  }
);