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
    '/skis/create',
    '/skis/locked',
    '/skis/*/edit',
    '/testing',
    '/testing/*',
    '/teams/create',
    '/teams/*/edit',
    '/teams/*/*/edit',
    '/login',
    '/signup',
    '/resetPassword',
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/account/*',
          '/skis/create',
          '/skis/locked',
          '/skis/*/edit',
          '/testing',
          '/testing/*',
          '/teams/create',
          '/teams/*/edit',
          '/teams/*/*/edit',
        ],
      },
    ],
  },

  // Add any dynamic / extra urls from public/dynamic-urls.json (see README comment)
  additionalPaths: async (config) => {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), 'public', 'dynamic-urls.json');
    if (!fs.existsSync(file)) return [];
    try {
      const list = JSON.parse(fs.readFileSync(file, 'utf8'));
      // list should be array of strings like ["/skis/abc123","/results/xyz456"]
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
