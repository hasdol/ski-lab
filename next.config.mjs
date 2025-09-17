// next.config.mjs
import nextPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

/* ───────────────── PWA runtime caching ───────────────── */
const runtimeCaching = [
  {
    urlPattern: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/_next'),
    handler: 'CacheFirst',
    options: {
      cacheName: 'next-assets',
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
    }
  },
  {
    urlPattern: ({ request }) => request.destination === 'image',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'images',
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
    }
  },
  {
    urlPattern: ({ url }) =>
      url.pathname.startsWith('/api') ||
      url.hostname.includes('met.no') ||
      url.hostname.includes('europe-north1') ||
      url.hostname.includes('cloudfunctions.net'),
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 10 }
    }
  },
  {
    urlPattern: ({ request }) => request.destination === 'document',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages',
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
    }
  }
];

/* ───────── create the PWA wrapper ───────── */
const withPWA = nextPWA({
  dest: 'public',
  disable: !isProd,
  register: true, // auto-register the service worker for more consistent SW availability
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  fallbacks: { document: '/offline.html' },
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching,
});

/* ───────── base Next config (keep your existing settings) ───────── */
const baseConfig = {
  async redirects() {
    const existing = [];
    return [
      ...existing,
      { source: '/plans', destination: '/pricing', permanent: true },
      { source: '/signin', destination: '/login', permanent: true },
      { source: '/add-skis', destination: '/skis/create', permanent: true },
    ];
  },
};

export default withPWA(baseConfig);
