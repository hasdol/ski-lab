// params.js (or near the top of index.js)
const { defineSecret, defineString } = require('firebase-functions/params');

// Secure “secrets”
exports.STRIPE_SECRET = defineSecret('STRIPE_SECRET');
exports.STRIPE_SIGNING_SECRET = defineSecret('STRIPE_SIGNING_SECRET');

// Non-secret strings
exports.APP_URL = defineString('http://localhost:3000');
exports.STRIPE_PRICE_ID = defineString('STRIPE_PRICE_ID');
