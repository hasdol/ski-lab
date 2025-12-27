/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://ski-lab.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,

  // Exclude private/utility pages from the sitemap
  exclude: [
    '/account',
    '/account/*',

    // Block private subroutes but keep the top-level pages indexable:
    // /skis is OK, but /skis/* (create/edit/locked/future) should not be indexed
    '/skis/*',
    '/results/*',
    '/teams/*',

    '/testing',
    '/testing/*',

    // auth
    '/login',
    '/signup',
    '/resetPassword',

    '/admin',
    '/admin/*',

    // Protected routes
    '/sharing',
    '/sharing/*',

    // Utility pages
    '/offline',
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/account/*',

          '/skis/*',
          '/results/*',
          '/teams/*',

          '/testing',
          '/testing/*',

          '/login',
          '/signup',
          '/resetPassword',

          '/admin',
          '/admin/*',

          // Protected routes
          '/sharing',
          '/sharing/*',

          // Utility pages
          '/offline',

          // utility/PWA files (prevents crawl noise)
          '/offline.html',
          '/sw.js',
          '/workbox-*',
          '/fallback-*',
          '/manifest.json',
        ],
      },
    ],
  },

  // Add any dynamic / extra urls from public/dynamic-urls.json
  additionalPaths: async () => {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), 'public', 'dynamic-urls.json');
    if (!fs.existsSync(file)) return [];
    try {
      const list = JSON.parse(fs.readFileSync(file, 'utf8'));
      // list must be ONLY public, indexable routes (avoid protected/private URLs)
      return list.map((loc) => ({
        loc,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date().toISOString(),
      }));
    } catch (err) {
      console.error('Error reading dynamic-urls.json for sitemap:', err);
      return [];
    }
  },
};
