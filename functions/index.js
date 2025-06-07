/* ------------------------------------------------------------------
   Firebase Cloud Functions – full file (updated May 2025)
   ------------------------------------------------------------------ */

/* eslint-disable consistent-return */
/* ------------------------------------------------------------------
   Initialisation
   ------------------------------------------------------------------ */
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();          // 🆕 default storage bucket

const functionsV1 = require('firebase-functions/v1');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const fetch = (...a) => import('node-fetch').then(({ default: f }) => f(...a));

/* ------------------------------------------------------------------
   🔐 Secrets
   ------------------------------------------------------------------ */
const METNO_USER_AGENT = defineSecret('METNO_USER_AGENT');

/* ------------------------------------------------------------------
   Plan limits & helpers (used everywhere)
   ------------------------------------------------------------------ */
const PLAN_LIMITS = {
  free: 8,
  senior: 16,
  senior_pluss: 32,
  coach: 64,
  company: 5000,
};
function getPlanLimit(plan = 'free') {
  return PLAN_LIMITS[plan] ?? 8; // safe fallback for unknown plans
}

/* ------------------------------------------------------------------
   CORS helper
   ------------------------------------------------------------------ */
function addCorsHeaders(res) {
  const ALLOWED = process.env.ALLOWED_ORIGINS || '*'; // tighten in prod
  res.set({
    'Access-Control-Allow-Origin': ALLOWED,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  });
}

/* ------------------------------------------------------------------
   weatherForecast (gen-2 HTTPS)
   ------------------------------------------------------------------ */
exports.weatherForecast = onRequest(
  {
    region: 'europe-north1',
    secrets: [METNO_USER_AGENT],
    timeoutSeconds: 15,
    memory: '256MiB',
  },
  async (req, res) => {
    addCorsHeaders(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon query params required' });
    }

    try {
      const upstream = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
        { headers: { 'User-Agent': METNO_USER_AGENT.value() } },
      );

      if (!upstream.ok) throw new Error(`yr.no responded ${upstream.status}`);

      addCorsHeaders(res);
      return res
        .set('Cache-Control', 'public, max-age=900, s-maxage=900')
        .json(await upstream.json());
    } catch (err) {
      console.error(err);
      addCorsHeaders(res);
      return res.status(502).json({ error: 'Failed to contact yr.no' });
    }
  },
);

/* ------------------------------------------------------------------
   Auth Trigger – Initialize user
   ------------------------------------------------------------------ */
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
  };
  try {
    await userRef.set(initialData);
    console.log(`Initialized user document for ${user.uid}`);
  } catch (error) {
    console.error(`Error initializing user document for ${user.uid}:`, error);
  }
});

/* ------------------------------------------------------------------
   Stripe Callable Functions
   ------------------------------------------------------------------ */
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
  if (!event.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const { priceId } = event.data;
  if (!priceId) throw new HttpsError('invalid-argument', 'Price ID must be provided.');

  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const appUrl = process.env.APP_URL;
  const userId = event.auth.uid;

  // Fetch subscription status
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const alreadySubscribed = Boolean(userData.stripeSubscriptionId || userData.stripeCustomerId);

  try {
    const price = await stripe.prices.retrieve(priceId);
    const product = await stripe.products.retrieve(price.product);
    const plan = product.metadata.plan || 'free';

    const subscriptionData = { metadata: { userId, plan } };
    if (!alreadySubscribed) subscriptionData.trial_period_days = 30;

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

/* ------------------------------------------------------------------
   Stripe Webhook
   ------------------------------------------------------------------ */
exports.stripeWebhook = onRequest({ secrets: ['STRIPE_SECRET', 'STRIPE_SIGNING_SECRET'] }, async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_SIGNING_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
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
  } catch (e) {
    console.error('Webhook handler failure:', e);
    return res.status(500).send('Webhook handler error');
  }

  res.status(200).json({ received: true });
});

/* ------------------------------------------------------------------
   Stripe Webhook Helpers (idempotent & single-write)
   ------------------------------------------------------------------ */
async function handleCheckoutSession(session) {
  const userRef = db.collection('users').doc(session.metadata.userId);
  const skisRef = userRef.collection('skis');
  const plan = session.metadata.plan || 'free';

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error(`User ${session.metadata.userId} does not exist.`);
    const u = snap.data();
    const lockedSnapshot = await tx.get(skisRef.where('locked', '==', true));

    tx.update(userRef, {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      plan,
      lockedSkisCount: 0,
    });
    lockedSnapshot.forEach((doc) => tx.update(doc.ref, { locked: false }));
  });
}

async function handleSubscriptionDeleted(subscription) {
  const userId = subscription.metadata.userId;
  const userRef = db.collection('users').doc(userId);
  const skisCol = userRef.collection('skis');

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error(`User ${userId} missing`);

    const u = snap.data();
    if (!u.stripeSubscriptionId) return; // idempotent

    const limit = getPlanLimit('free');
    const unlocked = (u.skiCount || 0) - (u.lockedSkisCount || 0);
    let lockCount = Math.max(0, unlocked - limit);

    if (lockCount) {
      const q = skisCol.where('locked', '==', false).orderBy('dateAdded', 'desc').limit(lockCount);
      (await tx.get(q)).forEach((d) => tx.update(d.ref, { locked: true }));
    }

    tx.update(userRef, {
      plan: 'free',
      stripeSubscriptionId: admin.firestore.FieldValue.delete(),
      lockedSkisCount: (u.lockedSkisCount || 0) + lockCount,
    });
  });
}

async function handleSubscriptionUpdated(subscription) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const userId = subscription.metadata.userId;
  const userRef = db.collection('users').doc(userId);
  const skisCol = userRef.collection('skis');

  // Lookup plan + limit
  const priceId = subscription.items.data[0].price.id;
  const product = await stripe.products.retrieve((await stripe.prices.retrieve(priceId)).product);
  const newPlan = product.metadata.plan || 'free';
  const newLimit = getPlanLimit(newPlan);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error(`User ${userId} missing`);

    const u = snap.data();
    const unlockedNow = (u.skiCount || 0) - (u.lockedSkisCount || 0);

    // Downgrade → lock newest skis
    let lockCount = Math.max(0, unlockedNow - newLimit);
    if (lockCount) {
      const qLock = skisCol.where('locked', '==', false).orderBy('dateAdded', 'desc').limit(lockCount);
      (await tx.get(qLock)).forEach((d) => tx.update(d.ref, { locked: true }));
    }

    // Upgrade → unlock oldest locked skis
    let unlockCount = Math.max(0, newLimit - unlockedNow);
    unlockCount = Math.min(unlockCount, u.lockedSkisCount || 0);
    if (unlockCount) {
      const qUnlock = skisCol.where('locked', '==', true).orderBy('dateAdded').limit(unlockCount);
      (await tx.get(qUnlock)).forEach((d) => tx.update(d.ref, { locked: false }));
    }

    tx.update(userRef, {
      plan: newPlan,
      lockedSkisCount: (u.lockedSkisCount || 0) + lockCount - unlockCount,
    });
  });
  console.log(`Updated user ${userId} to plan ${newPlan}`);
}

/* ------------------------------------------------------------------
   Firestore Triggers – skis add / delete (single-write counters)
   ------------------------------------------------------------------ */
exports.onSkiCreated = onDocumentCreated('users/{userId}/skis/{skiId}', async (event) => {
  const { userId } = event.params;
  const userRef = db.collection('users').doc(userId);
  const skiRef = event.data.ref;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;

    const u = snap.data();
    const limit = getPlanLimit(u.plan);
    const newSkiCount = (u.skiCount || 0) + 1;
    const shouldLock = newSkiCount - (u.lockedSkisCount || 0) > limit;

    tx.update(userRef, {
      skiCount: newSkiCount,
      lockedSkisCount: (u.lockedSkisCount || 0) + (shouldLock ? 1 : 0),
    });
    tx.update(skiRef, {
      locked: shouldLock,
      dateAdded: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
});

exports.onSkiDeleted = onDocumentDeleted('users/{userId}/skis/{skiId}', async (event) => {
  const { userId } = event.params;
  const wasLocked = event.data.data().locked;
  const userRef = db.collection('users').doc(userId);
  const skisCol = userRef.collection('skis');

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) return;

    const u = snap.data();
    const newSkiCount = (u.skiCount || 0) - 1;
    const newLockedCount = (u.lockedSkisCount || 0) - (wasLocked ? 1 : 0);
    const limit = getPlanLimit(u.plan);
    const unlockedAfterDel = newSkiCount - newLockedCount;

    let toUnlock = 0;
    if (unlockedAfterDel < limit && newLockedCount > 0) {
      toUnlock = Math.min(limit - unlockedAfterDel, newLockedCount);
      const q = skisCol.where('locked', '==', true).orderBy('dateAdded').limit(toUnlock);
      (await tx.get(q)).forEach((d) => tx.update(d.ref, { locked: false }));
    }

    tx.update(userRef, {
      skiCount: newSkiCount,
      lockedSkisCount: newLockedCount - toUnlock,
    });
  });
});

/* ------------------------------------------------------------------
   Account Deletion Management
   ------------------------------------------------------------------ */

// ------------------------------------------------------------------
// Helper: delete a single file if it exists (server-side storage API)
// ------------------------------------------------------------------
async function deleteFileIfExists(path) {
  try {
    await bucket.file(path).delete();
    console.log(`✅ deleted gs://${bucket.name}/${path}`);
  } catch (err) {
    if (err.code === 404) return; // ignore missing files
    console.error('Storage delete failed:', err.message);
    throw err;
  }
}

// ------------------------------------------------------------------
// Helper: fetch the teams a user owns vs. just belongs to
// ------------------------------------------------------------------
async function getUserTeamsByOwnership(uid) {
  const teamsRef = db.collection('teams');
  const snap = await teamsRef.where('members', 'array-contains', uid).get();

  const ownedTeams = [];
  const memberTeams = [];

  snap.forEach((doc) => {
    (doc.data().createdBy === uid ? ownedTeams : memberTeams).push(doc);
  });

  return { ownedTeams, memberTeams };
}

// ------------------------------------------------------------------
// Helper: delete all events (and their images & testResults) in a team
// If uid is provided, we delete only events created by that uid.
// ------------------------------------------------------------------
async function wipeEventsOfTeam(teamId, uid = null) {
  const eventsRef = db.collection(`teams/${teamId}/events`);
  const q = uid ? eventsRef.where('createdBy', '==', uid) : eventsRef;
  const eventsSnap = await q.get();

  for (const evt of eventsSnap.docs) {
    const evtId = evt.id;

    // 1) delete event image
    await deleteFileIfExists(`teams/${teamId}/events/${evtId}/event.jpg`);

    // 2) delete testResults sub-collection in pages of 500
    const testsRef = evt.ref.collection('testResults');
    while (true) {
      const page = await testsRef.limit(500).get();
      if (page.empty) break;
      const batch = db.batch();
      page.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 3) delete the event document
    await evt.ref.delete();
  }
}

// ------------------------------------------------------------------
// Helper: deep-delete an entire team and everything under it
// ------------------------------------------------------------------
async function wipeWholeTeam(teamId) {
  // 1) Delete all events (and their images & testResults) in the team.
  await wipeEventsOfTeam(teamId);

  // 2) Delete all joinRequests documents in the team.
  const joinRequestsRef = db.collection(`teams/${teamId}/joinRequests`);
  const joinRequestsSnap = await joinRequestsRef.get();
  for (const doc of joinRequestsSnap.docs) {
    await doc.ref.delete();
  }

  // 3) Delete the team-level image.
  await deleteFileIfExists(`teams/${teamId}/team.jpg`);

  // 4) Delete the team document itself.
  await db.collection('teams').doc(teamId).delete();
}

// ------------------------------------------------------------------
// Helper: delete the user’s profile picture (legacy client path)
// ------------------------------------------------------------------
async function deleteProfilePicture(userId) {
  await deleteFileIfExists(`profilePictures/${userId}/profile.jpg`);
}

// ------------------------------------------------------------------
// deleteUserAccount – callable
// ------------------------------------------------------------------
exports.deleteUserAccount = onCall({ secrets: ['STRIPE_SECRET'] }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');

  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) throw new HttpsError('not-found', 'User document not found.');
  const userData = userDoc.data();

  /* --------------------------------------------------------------
     1. Cancel active Stripe subscription (unchanged)
  -------------------------------------------------------------- */
  if (userData.stripeSubscriptionId) {
    const confirmDeleteSubscription = request.data.confirmDeleteSubscription;
    if (!confirmDeleteSubscription) {
      throw new HttpsError(
        'failed-precondition',
        'You must confirm that your active subscription will be cancelled in order to delete your account.',
      );
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET);
    try {
      await stripe.subscriptions.cancel(userData.stripeSubscriptionId);
      console.log(`Stripe subscription ${userData.stripeSubscriptionId} cancelled.`);
      await userRef.update({
        stripeSubscriptionId: admin.firestore.FieldValue.delete(),
        stripeCustomerId: admin.firestore.FieldValue.delete(),
      });
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      throw new HttpsError('internal', 'Error cancelling subscription. Please try again later.');
    }
  }

  /* --------------------------------------------------------------
     2. Handle teams & events created by / shared with this user
  -------------------------------------------------------------- */
  const { ownedTeams, memberTeams } = await getUserTeamsByOwnership(uid);

  // 2a. remove teams the user owns
  for (const teamDoc of ownedTeams) {
    await wipeWholeTeam(teamDoc.id);
  }

  // 2b. in teams the user does NOT own:
  for (const teamDoc of memberTeams) {
    const teamId = teamDoc.id;

    // remove only events they created
    await wipeEventsOfTeam(teamId, uid);

    // remove them from the members array
    await teamDoc.ref.update({
      members: admin.firestore.FieldValue.arrayRemove(uid),
    });
  }

  /* --------------------------------------------------------------
     3. Delete user-specific assets & sub-collections
  -------------------------------------------------------------- */
  await deleteProfilePicture(uid);

  const subcollections = ['skis', 'testResults'];
  for (const sub of subcollections) {
    const subColRef = userRef.collection(sub);
    while (true) {
      const page = await subColRef.limit(500).get();
      if (page.empty) break;
      const batch = db.batch();
      page.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    console.log(`Subcollection '${sub}' wiped for user ${uid}.`);
  }

  /* --------------------------------------------------------------
     4. Delete Auth user & top-level user doc
  -------------------------------------------------------------- */
  await admin.auth().deleteUser(uid);
  await userRef.delete();

  return { message: 'User account and all related data deleted successfully.' };
});

/* ------------------------------------------------------------------
   cancelUserDeletion
   ------------------------------------------------------------------ */
exports.cancelUserDeletion = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  await userRef.update({
    scheduledDeletion: admin.firestore.FieldValue.delete(),
    deletionScheduledAt: admin.firestore.FieldValue.delete(),
  });
  return { message: 'Account deletion has been cancelled.' };
});

exports.joinTeamByCode = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');

  const userId = request.auth.uid;
  const code = request.data.code;
  if (!code) throw new HttpsError('invalid-argument', 'Missing team code.');

  const teamsRef = db.collection('teams');
  const snap = await teamsRef.where('joinCode', '==', code).limit(1).get();
  if (snap.empty) throw new HttpsError('not-found', 'No team found with the given code.');

  const teamDoc = snap.docs[0];
  const teamData = teamDoc.data() || {};
  const members = teamData.members || [];

  // Check if the user is already a member or has a pending join request.
  if (members.includes(userId)) {
    throw new HttpsError('already-exists', 'You are already in this team.');
  }
  const joinRequestsRef = teamDoc.ref.collection('joinRequests');
  const existingRequest = await joinRequestsRef.where('userId', '==', userId).get();
  if (!existingRequest.empty) {
    throw new HttpsError('already-exists', 'Join request already pending.');
  }

  if (teamData.isPublic) {
    // Create a pending join request for public teams.
    await joinRequestsRef.add({
      userId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      email: request.auth.token.email || null,
    });
    return { teamId: teamDoc.id, pending: true };
  } else {
    // For private teams, perform an immediate join.
    await teamDoc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });
    return { teamId: teamDoc.id, pending: false };
  }
});

exports.acceptJoinRequest = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');

  const { teamId, requestId } = request.data;
  if (!teamId || !requestId)
    throw new HttpsError('invalid-argument', 'Team ID and request ID are required.');

  const teamRef = db.collection('teams').doc(teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists)
    throw new HttpsError('not-found', 'Team not found.');
  const teamData = teamSnap.data();
  if (request.auth.uid !== teamData.createdBy)
    throw new HttpsError('permission-denied', 'Only the team creator can accept join requests.');

  const joinRequestRef = teamRef.collection('joinRequests').doc(requestId);
  const joinRequestSnap = await joinRequestRef.get();
  if (!joinRequestSnap.exists)
    throw new HttpsError('not-found', 'Join request not found.');
  const joinRequestData = joinRequestSnap.data();
  if (joinRequestData.status !== 'pending')
    throw new HttpsError('failed-precondition', 'Join request is not pending.');

  // Add the user to the team and mark the request as accepted.
  await teamRef.update({
    members: admin.firestore.FieldValue.arrayUnion(joinRequestData.userId),
  });
  await joinRequestRef.update({
    status: 'accepted',
    respondedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { message: 'Join request accepted.' };
});

exports.declineJoinRequest = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
    
  const { teamId, requestId } = request.data;
  if (!teamId || !requestId)
    throw new HttpsError('invalid-argument', 'Team ID and request ID are required.');

  const teamRef = db.collection('teams').doc(teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists)
    throw new HttpsError('not-found', 'Team not found.');
  const teamData = teamSnap.data();
  if (request.auth.uid !== teamData.createdBy)
    throw new HttpsError('permission-denied', 'Only the team creator can decline join requests.');

  const joinRequestRef = teamRef.collection('joinRequests').doc(requestId);
  const joinRequestSnap = await joinRequestRef.get();
  if (!joinRequestSnap.exists)
    throw new HttpsError('not-found', 'Join request not found.');
  const joinRequestData = joinRequestSnap.data();
  if (joinRequestData.status !== 'pending')
    throw new HttpsError('failed-precondition', 'Join request is not pending.');

  // Mark the request as declined.
  await joinRequestRef.update({
    status: 'declined',
    respondedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { message: 'Join request declined.' };
});
