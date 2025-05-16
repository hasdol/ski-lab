// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://ski-lab.com',
  generateRobotsTxt: true,

  // no splitting or manual additions
  changefreq: 'daily',
  priority: 0.7,

  // your protected routes
  exclude: [
    '/account',
    '/account/**',
    '/settings',
    '/settings/**',
    '/plans',
    '/plans/**',
    '/skis/add',
    '/skis/add/**',
    '/skis/locked',
    '/skis/locked/**',
    '/results/*/edit',
    '/testing',
    '/testing/**',
    '/create-event',
    '/create-event/**',
    '/edit',
    '/edit/**',
    '/teams/create-team',
    '/teams/create-team/**',
    '/signin',
    '/signin/**',
    '/signup',
    '/signup/**',
    '/resetPassword',
    '/resetPassword/**',
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: [
          '/account',
          '/settings',
          '/plans',
          '/skis/add',
          '/skis/locked',
          '/results/*/edit',
          '/testing',
          '/create-event',
          '/edit',
        ],
        allow: ['/'],
      },
    ],
    // no additionalSitemaps
  },
};
