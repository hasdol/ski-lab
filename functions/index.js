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

// ------------------------------------------------------------------
// Plan limits (teams and members per team) and helpers
// ------------------------------------------------------------------
const PLAN_TEAM_CAP = {
  free: 0,
  senior: 0,
  senior_pluss: 0,
  coach: 2,
  company: 10,
  admin: 100000, // effectively unlimited for admin
};

const PLAN_MEMBERS_CAP = {
  coach: 25,
  company: 10000,
  admin: 100000, // effectively unlimited for admin
};

function getTeamCapForPlan(plan) {
  return PLAN_TEAM_CAP[plan] ?? 0;
}
function getMemberCapForPlan(plan) {
  return PLAN_MEMBERS_CAP[plan] ?? 0;
}

// Simple server-side keyword builder (prefixes for words len >= 3)
function buildTeamKeywordsServer(name = '') {
  const MIN = 3;
  const tokens = String(name).toLowerCase().trim().split(/[\s\-]+/).filter(Boolean);
  const out = new Set();
  tokens.forEach((w) => {
    if (w.length < MIN) return;
    for (let i = MIN; i <= w.length; i++) out.add(w.slice(0, i));
  });
  return Array.from(out);
}

/** Generate a 6-char A–Z/0–9 code */
function generateShareCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

// Add this helper for team join codes
function generateTeamCode() {
  // Reuse the share-code generator to keep format consistent
  return generateShareCode();
}

/* ------------------------------------------------------------------
   CORS helper
   ------------------------------------------------------------------ */
function addCorsHeaders(req, res) {
  const origin = req.get('Origin') || '';
  const allowed = new Set([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://ski-lab.com',
    'https://www.ski-lab.com',
  ]);
  const allow = allowed.has(origin) ? origin : '*';

  res.set('Access-Control-Allow-Origin', allow);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '86400');
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
    addCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
      addCorsHeaders(req, res);
      return res.status(400).json({ error: 'lat and lon query params required' });
    }

    try {
      const upstream = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
        { headers: { 'User-Agent': METNO_USER_AGENT.value() } },
      );

      if (!upstream.ok) throw new Error(`yr.no responded ${upstream.status}`);

      addCorsHeaders(req, res);
      return res
        .set('Cache-Control', 'public, max-age=900, s-maxage=900')
        .json(await upstream.json());
    } catch (err) {
      console.error(err);
      addCorsHeaders(req, res);
      return res.status(502).json({ error: 'Failed to contact yr.no' });
    }
  },
);


/* ------------------------------------------------------------------
   reverseGeocode (proxy with CORS)
   ------------------------------------------------------------------ */
exports.reverseGeocode = onRequest(
  {
    region: 'europe-north1',
    timeoutSeconds: 10,
    memory: '256MiB',
  },
  async (req, res) => {
    addCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon query params required' });
    }

    try {
      const upstream = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json`,
        {
          headers: {
            // Identify your app per Nominatim policy
            'User-Agent': 'Ski-Lab/1.0 (https://ski-lab.com)',
          },
        }
      );

      if (!upstream.ok) throw new Error(`nominatim responded ${upstream.status}`);

      return res
        .set('Cache-Control', 'public, max-age=600, s-maxage=600')
        .json(await upstream.json());
    } catch (err) {
      console.error('reverseGeocode failed:', err);
      return res.status(502).json({ error: 'reverse geocode failed' });
    }
  }
);

/* ------------------------------------------------------------------
   Auth Trigger – Initialize user
   ------------------------------------------------------------------ */
exports.onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const userRef = db.collection('users').doc(user.uid);
  const initialData = {
    // Do NOT set displayName here; let client set it
    preferences: {
      themePreference: 'light',
      languagePreference: 'en',
    },
    photoURL: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    plan: 'free',
    skiCount: 0,
    lockedSkisCount: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
  try {
    // Use merge to avoid clobbering existing fields set by the client
    await userRef.set(initialData, { merge: true });
    console.log(`Initialized user document for ${user.uid}`);
  } catch (error) {
    console.error(`Error initializing user document for ${user.uid}:`, error);
  }
});

/* ------------------------------------------------------------------
   Stripe Callable Functions
   ------------------------------------------------------------------ */
exports.getStripePlans = onCall({ secrets: ['STRIPE_SECRET'] }, async (event) => {
  // REMOVE: if (!event.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const stripe = require('stripe')(process.env.STRIPE_SECRET);

  try {
    const products = await stripe.products.list({ active: true });
    const plans = await Promise.all(products.data.map(async (product) => {
      const prices = await stripe.prices.list({ product: product.id, active: true });
      if (prices.data.length === 0) return null;
      const price = prices.data[0];

      // NEW: derive metadata (with safe parsing)
      const md = product.metadata || {};
      const skiLimit = Number.parseInt(md.skiLimit, 10);
      const teamCap = Number.parseInt(md.teamCap, 10);
      const memberCap = Number.parseInt(md.memberCap, 10);
      const features = (md.features || '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean);

      return {
        productId: product.id,
        name: product.name,
        description: product.description,
        priceId: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        plan: md.plan || 'unknown',
        // NEW fields for the UI
        skiLimit: Number.isFinite(skiLimit) ? skiLimit : null,
        teams: Number.isFinite(teamCap) ? teamCap : 0,
        members: Number.isFinite(memberCap) ? memberCap : 0,
        features,
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
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const userRef = db.collection('users').doc(session.metadata.userId);
  const skisRef = userRef.collection('skis');

  // Look up product metadata from the subscription's price
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  const priceId = subscription.items.data[0].price.id;
  const product = await stripe.products.retrieve((await stripe.prices.retrieve(priceId)).product);
  const md = product.metadata || {};
  const plan = md.plan || 'free';
  const skiLimit = Number.parseInt(md.skiLimit, 10);
  const teamCap = Number.parseInt(md.teamCap, 10);
  const memberCap = Number.parseInt(md.memberCap, 10);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error(`User ${session.metadata.userId} does not exist.`);
    const lockedSnapshot = await tx.get(skisRef.where('locked', '==', true));

    tx.update(userRef, {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      plan,
      // NEW: persist dynamic caps on user
      planSkisLimit: Number.isFinite(skiLimit) ? skiLimit : getPlanLimit(plan),
      planTeamsCap: Number.isFinite(teamCap) ? teamCap : 0,
      planMembersCap: Number.isFinite(memberCap) ? memberCap : 0,
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
    if (!u.stripeSubscriptionId) return;

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
      // NEW: reset caps to free
      planSkisLimit: getPlanLimit('free'),
      planTeamsCap: 0,
      planMembersCap: 0,
    });
  });
}

async function handleSubscriptionUpdated(subscription) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET);
  const userId = subscription.metadata.userId;
  const userRef = db.collection('users').doc(userId);
  const skisCol = userRef.collection('skis');

  const priceId = subscription.items.data[0].price.id;
  const product = await stripe.products.retrieve((await stripe.prices.retrieve(priceId)).product);
  const md = product.metadata || {};
  const newPlan = md.plan || 'free';
  const newLimit = Number.isFinite(Number.parseInt(md.skiLimit, 10))
    ? Number.parseInt(md.skiLimit, 10)
    : getPlanLimit(newPlan);
  const newTeamCap = Number.parseInt(md.teamCap, 10);
  const newMemberCap = Number.parseInt(md.memberCap, 10);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) throw new Error(`User ${userId} missing`);

    const u = snap.data();
    const unlockedNow = (u.skiCount || 0) - (u.lockedSkisCount || 0);

    let lockCount = Math.max(0, unlockedNow - newLimit);
    if (lockCount) {
      const qLock = skisCol.where('locked', '==', false).orderBy('dateAdded', 'desc').limit(lockCount);
      (await tx.get(qLock)).forEach((d) => tx.update(d.ref, { locked: true }));
    }

    let unlockCount = Math.max(0, newLimit - unlockedNow);
    unlockCount = Math.min(unlockCount, u.lockedSkisCount || 0);
    if (unlockCount) {
      const qUnlock = skisCol.where('locked', '==', true).orderBy('dateAdded').limit(unlockCount);
      (await tx.get(qUnlock)).forEach((d) => tx.update(d.ref, { locked: false }));
    }

    tx.update(userRef, {
      plan: newPlan,
      lockedSkisCount: (u.lockedSkisCount || 0) + lockCount - unlockCount,
      // NEW: update caps on user
      planSkisLimit: newLimit,
      planTeamsCap: Number.isFinite(newTeamCap) ? newTeamCap : (u.planTeamsCap ?? 0),
      planMembersCap: Number.isFinite(newMemberCap) ? newMemberCap : (u.planMembersCap ?? 0),
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
    const limit = (u.planSkisLimit ?? getPlanLimit(u.plan));
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
    const limit = (u.planSkisLimit ?? getPlanLimit(u.plan));
    const newSkiCount = (u.skiCount || 0) - 1;
    const newLockedCount = (u.lockedSkisCount || 0) - (wasLocked ? 1 : 0);
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

/* ------------------------------------------------------------------
   Team Management
   ------------------------------------------------------------------ */
// ------------------------------------------------------------------
// createTeam – callable (enforces per-plan creation caps)
// ------------------------------------------------------------------
exports.createTeam = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const uid = request.auth.uid;
  const { name, isPublic = false } = request.data || {};
  if (!name || typeof name !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing or invalid team name.');
  }

  // Load user to determine plan
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'User profile not found.');
  const user = userSnap.data() || {};
  const plan = user.plan || 'free';

  // Only coach/company/admin can create
  if (!['coach', 'company', 'admin'].includes(plan)) {
    throw new HttpsError('permission-denied', 'Your plan does not allow creating teams.');
  }

  // Enforce team creation cap
  const teamCap = (user.planTeamsCap ?? getTeamCapForPlan(plan));
  const ownedSnap = await db.collection('teams').where('createdBy', '==', uid).get();
  const ownedCount = ownedSnap.size;
  if (ownedCount >= teamCap) {
    throw new HttpsError('resource-exhausted', `Team limit reached for your plan (${teamCap}).`);
  }

  // Create team
  const teamRef = db.collection('teams').doc(); // generate id
  const doc = {
    name,
    imageURL: '',
    joinCode: generateTeamCode(),
    createdBy: uid,
    members: [uid],
    isPublic: !!isPublic,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    memberCount: 1,
    keywords_en: buildTeamKeywordsServer(name),
    mods: [],
  };
  await teamRef.set(doc);

  return { teamId: teamRef.id, joinCode: doc.joinCode };
});

exports.joinTeamByCode = onCall(async (request) => {
  if (!request.auth)
    throw new HttpsError('unauthenticated', 'User must be authenticated.');

  const userId = request.auth.uid;
  const code = request.data.code;
  if (!code) throw new HttpsError('invalid-argument', 'Missing team code.');

  // Fetch the user's display name from the users collection.
  const userDoc = await db.collection('users').doc(userId).get();
  const username = userDoc.exists ? userDoc.data().displayName : null;

  const teamsRef = db.collection('teams');
  const snap = await teamsRef.where('joinCode', '==', code).limit(1).get();
  if (snap.empty) throw new HttpsError('not-found', 'No team found with the given code.');

  const teamDoc = snap.docs[0];
  const teamData = teamDoc.data() || {};
  const members = Array.isArray(teamData.members) ? teamData.members : [];
  const teamId = teamDoc.id;

  // Prevent re-join
  if (members.includes(userId)) throw new HttpsError('already-exists', 'You are already in this team.');

  // Resolve owner plan for member cap
  const ownerRef = db.collection('users').doc(teamData.createdBy);
  const ownerSnap = await ownerRef.get();
  const ownerPlan = ownerSnap.exists ? ownerSnap.data().plan : 'coach';
  const ownerMembersCap = ownerSnap.exists ? ownerSnap.data().planMembersCap : null;
  const memberCap = Number.isFinite(ownerMembersCap) ? ownerMembersCap : getMemberCapForPlan(ownerPlan);

  // If team is at capacity, block joins/requests
  if (members.length >= memberCap) {
    throw new HttpsError('resource-exhausted', 'Team member limit reached for this plan.');
  }

  const joinRequestsRef = teamDoc.ref.collection('joinRequests');
  const requestsSnap = await joinRequestsRef.where('userId', '==', userId).get();

  // Check if any pending request exists
  const pendingRequest = requestsSnap.docs.find(doc => doc.data().status === 'pending');
  if (pendingRequest) {
    throw new HttpsError('already-exists', 'Join request already pending.');
  }

  // Cleanup any past join request documents (e.g. declined ones)
  for (const doc of requestsSnap.docs) {
    if (doc.data().status !== 'pending') {
      await doc.ref.delete();
    }
  }

  if (teamData.isPublic) {
    // Create a pending join request for public teams.
    await joinRequestsRef.add({
      userId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      email: request.auth.token.email || null,
      username,
    });
    return { teamId, pending: true };
  } else {
    // For private teams, perform an immediate join with memberCount increment.
    await teamDoc.ref.update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
      memberCount: admin.firestore.FieldValue.increment(1),
    });
    return { teamId, pending: false };
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
  if (request.auth.uid !== teamData.createdBy && !(teamData.mods || []).includes(request.auth.uid)) {
    throw new HttpsError('permission-denied', 'Only the team creator or mods can accept join requests.');
  }

  const joinRequestRef = teamRef.collection('joinRequests').doc(requestId);
  const joinRequestSnap = await joinRequestRef.get();
  if (!joinRequestSnap.exists)
    throw new HttpsError('not-found', 'Join request not found.');
  const joinRequestData = joinRequestSnap.data();
  if (joinRequestData.status !== 'pending')
    throw new HttpsError('failed-precondition', 'Join request is not pending.');

  // Enforce member cap based on owner plan
  const ownerRef = db.collection('users').doc(teamData.createdBy);
  const ownerSnap = await ownerRef.get();
  const ownerPlan = ownerSnap.exists ? ownerSnap.data().plan : 'coach';
  const ownerMembersCap = ownerSnap.exists ? ownerSnap.data().planMembersCap : null;
  const memberCap = Number.isFinite(ownerMembersCap) ? ownerMembersCap : getMemberCapForPlan(ownerPlan);
  const currentMembers = Array.isArray(teamData.members) ? teamData.members : [];
  if (currentMembers.length >= memberCap) {
    throw new HttpsError('resource-exhausted', 'Team member limit reached for this plan.');
  }

  // Add the user to the team and mark the request as accepted; increment memberCount
  await teamRef.update({
    members: admin.firestore.FieldValue.arrayUnion(joinRequestData.userId),
    memberCount: admin.firestore.FieldValue.increment(1),
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
  if (request.auth.uid !== teamData.createdBy && !(teamData.mods || []).includes(request.auth.uid)) {
    throw new HttpsError('permission-denied', 'Only the team creator or mods can decline join requests.');
  }

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

exports.getTeamMemberProfiles = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  const { teamId } = request.data || {};
  if (!teamId) throw new HttpsError('invalid-argument', 'Missing teamId.');

  const teamRef = db.collection('teams').doc(teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) throw new HttpsError('not-found', 'Team not found.');

  const team = teamSnap.data();
  if (team.createdBy !== request.auth.uid && !(team.mods || []).includes(request.auth.uid)) {
    throw new HttpsError('permission-denied', 'Only creator or mods can view member profiles.');
  }

  const memberIds = Array.isArray(team.members) ? team.members : [];
  if (memberIds.length === 0) return [];

  const userSnaps = await Promise.all(
    memberIds.map((uid) => db.collection('users').doc(uid).get())
  );

  return userSnaps.map((doc) => ({
    uid: doc.id,
    displayName: doc.exists ? doc.data().displayName || null : null,
    photoURL: doc.exists ? doc.data().photoURL || null : null,
  }));
});

exports.leaveTeam = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be authenticated.');
  const { teamId } = request.data || {};
  if (!teamId) throw new HttpsError('invalid-argument', 'Missing teamId.');

  const uid = request.auth.uid;
  const teamRef = db.collection('teams').doc(teamId);
  const teamSnap = await teamRef.get();
  if (!teamSnap.exists) throw new HttpsError('not-found', 'Team not found.');
  const team = teamSnap.data();

  if (team.createdBy === uid)
    throw new HttpsError('failed-precondition', "The team creator can't leave their own team.");

  const members = Array.isArray(team.members) ? team.members : [];
  if (!members.includes(uid)) return { ok: true, message: 'Not a member.' };

  await teamRef.update({
    members: admin.firestore.FieldValue.arrayRemove(uid),
    memberCount: admin.firestore.FieldValue.increment(-1),
  });

  return { ok: true };
});

// ------------------------------------------------------------------
// Mod Management (team moderators)
// ------------------------------------------------------------------
exports.addTeamMod = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated','Auth required.');
  const { teamId, userId } = request.data || {};
  if (!teamId || !userId) throw new HttpsError('invalid-argument','Missing teamId or userId.');
  const teamRef = db.collection('teams').doc(teamId);
  const snap = await teamRef.get();
  if (!snap.exists) throw new HttpsError('not-found','Team not found.');
  const team = snap.data();
  if (team.createdBy !== request.auth.uid) throw new HttpsError('permission-denied','Only creator can add mods.');
  if (!team.members.includes(userId)) throw new HttpsError('failed-precondition','User must be a member.');
  await teamRef.update({
    mods: admin.firestore.FieldValue.arrayUnion(userId),
  });
  return { ok: true };
});

exports.removeTeamMod = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated','Auth required.');
  const { teamId, userId } = request.data || {};
  if (!teamId || !userId) throw new HttpsError('invalid-argument','Missing teamId or userId.');
  const teamRef = db.collection('teams').doc(teamId);
  const snap = await teamRef.get();
  if (!snap.exists) throw new HttpsError('not-found','Team not found.');
  const team = snap.data();
  if (team.createdBy !== request.auth.uid) throw new HttpsError('permission-denied','Only creator can remove mods.');
  await teamRef.update({
    mods: admin.firestore.FieldValue.arrayRemove(userId),
  });
  return { ok: true };
});

exports.removeTeamMember = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  const { teamId, memberId } = request.data || {};
  if (!teamId || !memberId) throw new HttpsError('invalid-argument', 'Missing teamId or memberId.');

  const uid = request.auth.uid;
  const teamRef = db.collection('teams').doc(teamId);
  const snap = await teamRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Team not found.');
  const team = snap.data();

  const isCreator = team.createdBy === uid;
  const isMod = !isCreator && (Array.isArray(team.mods) && team.mods.includes(uid));
  if (!isCreator && !isMod) throw new HttpsError('permission-denied', 'Only owner or mods can remove members.');

  if (memberId === team.createdBy) {
    throw new HttpsError('failed-precondition', 'Cannot remove the team owner.');
  }

  // Mods cannot remove other mods
  const targetIsMod = Array.isArray(team.mods) && team.mods.includes(memberId);
  if (isMod && targetIsMod) {
    throw new HttpsError('permission-denied', 'Mods cannot remove other mods.');
  }

  const members = Array.isArray(team.members) ? team.members : [];
  if (!members.includes(memberId)) return { ok: true, message: 'Not a member.' };

  await teamRef.update({
    members: admin.firestore.FieldValue.arrayRemove(memberId),
    mods: admin.firestore.FieldValue.arrayRemove(memberId),
    memberCount: admin.firestore.FieldValue.increment(-1),
  });

  return { ok: true };
});

exports.setAdmin = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Only admins can grant admin.');
  const { uid } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid.');
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  return { ok: true };
});

exports.unsetAdmin = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Only admins can revoke admin.');
  const { uid } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'Missing uid.');
  await admin.auth().setCustomUserClaims(uid, { admin: false });
  return { ok: true };
});

// ----------------------
// Sharing – helpers
// ----------------------
function genShareCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const SHARE_CODE_MAX_TRIES = 20;

// Atomically reserve a unique code for a user, optionally replacing a previous one
async function reserveCodeForUser(uid, prevCodeUpper = null) {
  for (let i = 0; i < SHARE_CODE_MAX_TRIES; i++) {
    const candUpper = genShareCode().toUpperCase();
    const mapRef = db.collection('shareCodes').doc(candUpper);
    const ok = await db.runTransaction(async (tx) => {
      const mapSnap = await tx.get(mapRef);
      if (mapSnap.exists) return false; // already taken

      const userRef = db.collection('users').doc(uid);

      // If replacing, delete the old mapping only if it was ours
      if (prevCodeUpper) {
        const oldRef = db.collection('shareCodes').doc(prevCodeUpper);
        const oldSnap = await tx.get(oldRef);
        if (oldSnap.exists && oldSnap.data().uid === uid) tx.delete(oldRef);
      }

      // Create mapping and upsert normalized code on user
      tx.set(mapRef, { uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      tx.set(userRef, { shareCode: candUpper, shareCodeLower: candUpper.toLowerCase() }, { merge: true });
      return true;
    });
    if (ok) return candUpper;
  }
  throw new HttpsError('resource-exhausted', 'Failed to allocate share code');
}

/**
 * Ensure the current user has a unique share code. If exists, fix legacy state.
 */
exports.ensureShareCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  const current = userSnap.exists ? (userSnap.data().shareCode || null) : null;

  // No existing code -> allocate fresh
  if (!current) {
    const newUpper = await reserveCodeForUser(uid, null);
    return { shareCode: newUpper };
  }

  // Normalize legacy code to UPPERCASE and ensure mapping exists and points to us
  const currentUpper = String(current).toUpperCase();
  const mapRef = db.collection('shareCodes').doc(currentUpper);
  const mapSnap = await mapRef.get();

  if (mapSnap.exists) {
    const owner = mapSnap.data().uid;
    if (owner === uid) {
      // Healthy mapping: just normalize user doc and backfill lowercase mirror
      await userRef.set(
        { shareCode: currentUpper, shareCodeLower: currentUpper.toLowerCase() },
        { merge: true }
      );
      return { shareCode: currentUpper };
    } else {
      // Collision (legacy doc pointing to someone else) -> allocate a new code for this user
      const newUpper = await reserveCodeForUser(uid, null);
      await userRef.set({ shareCode: newUpper, shareCodeLower: newUpper.toLowerCase() }, { merge: true });
      return { shareCode: newUpper };
    }
  } else {
    // Mapping missing -> create it atomically and normalize user fields
    await db.runTransaction(async (tx) => {
      const mapSnap2 = await tx.get(mapRef);
      if (mapSnap2.exists && mapSnap2.data().uid !== uid) {
        // Lost the race and another user took it: reserve a new one
        throw new Error('RETRY_ALLOC');
      }
      tx.set(mapRef, { uid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      tx.set(userRef, { shareCode: currentUpper, shareCodeLower: currentUpper.toLowerCase() }, { merge: true });
    }).catch(async (e) => {
      if (String(e.message) === 'RETRY_ALLOC') {
        const newUpper = await reserveCodeForUser(uid, null);
        await userRef.set({ shareCode: newUpper, shareCodeLower: newUpper.toLowerCase() }, { merge: true });
      } else {
        throw e;
      }
    });
    const finalSnap = await userRef.get();
    return { shareCode: finalSnap.data().shareCode };
  }
});

/**
 * Regenerate a share code (invalidates the old code mapping).
 */
exports.regenerateShareCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const uid = request.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const prevUpper = userSnap.exists && userSnap.data().shareCode
    ? String(userSnap.data().shareCode).toUpperCase()
    : null;

  const newUpper = await reserveCodeForUser(uid, prevUpper);
  // Ensure user mirrors are correct
  await userRef.set({ shareCode: newUpper, shareCodeLower: newUpper.toLowerCase() }, { merge: true });
  return { shareCode: newUpper };
});

/**
 * Create a read-share request by share code.
 * fromUid: requester (reader), toUid: owner
 */
exports.requestShareByCode = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');
  const fromUid = request.auth.uid;
  const raw = (request.data?.code || '').toString().trim();
  if (!raw) throw new HttpsError('invalid-argument', 'Missing code.');

  const codeUpper = raw.toUpperCase();
  const codeLower = codeUpper.toLowerCase();

  // 1) Resolve by authoritative mapping
  let toUid = null;
  const mapSnap = await db.collection('shareCodes').doc(codeUpper).get();
  if (mapSnap.exists) {
    toUid = mapSnap.data().uid;
  } else {
    // 2) Fallback for legacy users: lookup by user fields
    const usersCol = db.collection('users');
    let ownerSnap = await usersCol.where('shareCodeLower', '==', codeLower).limit(1).get();
    if (ownerSnap.empty) {
      ownerSnap = await usersCol.where('shareCode', '==', codeUpper).limit(1).get();
    }
    if (ownerSnap.empty) {
      throw new HttpsError('invalid-argument', 'Invalid code');
    }
    toUid = ownerSnap.docs[0].id;

    // Self-heal: create mapping doc if still free
    try {
      await db.runTransaction(async (tx) => {
        const ref = db.collection('shareCodes').doc(codeUpper);
        const s = await tx.get(ref);
        if (!s.exists) {
          tx.set(ref, { uid: toUid, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        }
      });
    } catch (_) {}
  }

  if (toUid === fromUid) throw new HttpsError('failed-precondition', 'You cannot request yourself.');

  // already shared?
  const sharedSnap = await db.collection('userShares')
    .where('ownerUid', '==', toUid)
    .where('readerUid', '==', fromUid)
    .limit(1)
    .get();
  if (!sharedSnap.empty) return { alreadyShared: true };

  // already pending?
  const pendingSnap = await db.collection('shareRequests')
    .where('fromUid', '==', fromUid)
    .where('toUid', '==', toUid)
    .where('status', '==', 'pending')
    .limit(1)
    .get();
  if (!pendingSnap.empty) return { alreadyRequested: true };

  // Denormalize display names to avoid profile reads on pending requests
  const [fromDoc, toDoc] = await Promise.all([
    db.collection('users').doc(fromUid).get(),
    db.collection('users').doc(toUid).get(),
  ]);

  await db.collection('shareRequests').add({
    fromUid,
    toUid,
    fromDisplayName: fromDoc.exists ? (fromDoc.data().displayName || null) : null,
    toDisplayName: toDoc.exists ? (toDoc.data().displayName || null) : null,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

/** respondShareRequest – owner approves/declines a request */
exports.respondShareRequest = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  const { requestId, action } = request.data || {};
  if (!requestId || !['approved', 'declined'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Invalid request or action.');
  }

  const reqRef = db.collection('shareRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) throw new HttpsError('not-found', 'Request not found.');
  const reqData = reqSnap.data();
  if (reqData.status !== 'pending') throw new HttpsError('failed-precondition', 'Already handled.');
  if (reqData.toUid !== request.auth.uid) throw new HttpsError('permission-denied', 'Not your request.');

  if (action === 'approved') {
    const ownerUid = reqData.toUid;
    const readerUid = reqData.fromUid;
    const docId = `${ownerUid}_${readerUid}`;
    const pairRef = db.collection('userShares').doc(docId);

    // Fetch display names to denormalize
    const [ownerDoc, readerDoc] = await Promise.all([
      db.collection('users').doc(ownerUid).get(),
      db.collection('users').doc(readerUid).get(),
    ]);
    const ownerDisplayName = ownerDoc.exists ? (ownerDoc.data().displayName || null) : null;
    const ownerPhotoURL = ownerDoc.exists ? (ownerDoc.data().photoURL || null) : null;
    const readerDisplayName = readerDoc.exists ? (readerDoc.data().displayName || null) : null;
    const readerPhotoURL = readerDoc.exists ? (readerDoc.data().photoURL || null) : null;

    await db.runTransaction(async (tx) => {
      const exists = await tx.get(pairRef);
      if (!exists.exists) {
        tx.set(pairRef, {
          ownerUid,
          readerUid,
          ownerDisplayName,
          ownerPhotoURL,
          readerDisplayName,
          readerPhotoURL,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // backfill denormalized fields if missing
        tx.set(pairRef, {
          ownerDisplayName,
          ownerPhotoURL,
          readerDisplayName,
          readerPhotoURL,
        }, { merge: true });
      }
      // Cleanup legacy random-id duplicates
      const dupQ = await db.collection('userShares')
        .where('ownerUid', '==', ownerUid)
        .where('readerUid', '==', readerUid)
        .get();
      dupQ.forEach((d) => { if (d.id !== docId) tx.delete(d.ref); });
    });
  }

  await reqRef.update({
    status: action,
    respondedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

/** revokeShare – owner revokes a reader */
exports.revokeShare = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  const ownerUid = request.auth.uid;
  const { readerUid } = request.data || {};
  if (!readerUid) throw new HttpsError('invalid-argument', 'Missing readerUid.');

  const docId = `${ownerUid}_${readerUid}`;
  const ref = db.collection('userShares').doc(docId);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.delete();
    return { ok: true };
  }
  // Fallback cleanup for legacy random-id docs
  const q = await db.collection('userShares')
    .where('ownerUid', '==', ownerUid)
    .where('readerUid', '==', readerUid)
    .get();
  const batch = db.batch();
  q.forEach(d => batch.delete(d.ref));
  if (!q.empty) await batch.commit();
  return { ok: true };
});

/** leaveShare – reader leaves an owner */
exports.leaveShare = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Auth required.');
  const readerUid = request.auth.uid;
  const { ownerUid } = request.data || {};
  if (!ownerUid) throw new HttpsError('invalid-argument', 'Missing ownerUid.');

  const docId = `${ownerUid}_${readerUid}`;
  const ref = db.collection('userShares').doc(docId);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.delete();
    return { ok: true };
  }
  // Fallback cleanup for legacy random-id docs
  const q = await db.collection('userShares')
    .where('ownerUid', '==', ownerUid)
    .where('readerUid', '==', readerUid)
    .get();
  const batch = db.batch();
  q.forEach(d => batch.delete(d.ref));
  await batch.commit();
  return { ok: true };
});
