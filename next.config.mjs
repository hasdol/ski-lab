// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

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
const withPWA = withPWAInit({
  dest: 'public',
  // Disable PWA only in local development (npm run dev)
  // It will be ENABLED for both 'npm run build' and your production deployments
  disable: process.env.NODE_ENV === 'development',
  
  register: false, // You use your own PWARegister component
  skipWaiting: true,
  fallbacks: { document: '/offline.html' },
  
  // Pass workbox options here
  workboxOptions: {
    runtimeCaching,
    // Exclude build manifest to avoid some Next 15 caching issues
    exclude: [/app-build-manifest\.json$/],
  },
});

// Base Next config
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
