/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://ski-lab.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,

  exclude: [
    // Private/protected routes
    '/account',
    '/account/*',
    '/settings',
    '/settings/*',
    '/plans',
    '/plans/*',
    '/skis/create',
    '/skis/locked',
    '/skis/*/edit',
    '/results/*/edit',
    '/testing',
    '/testing/*',
    '/teams/create',
    '/teams/*/edit',
    '/teams/*/*/edit',

    // Auth and reset
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
          '/settings',
          '/settings/*',
          '/plans',
          '/plans/*',
          '/skis/create',
          '/skis/locked',
          '/skis/*/edit',
          '/results/*/edit',
          '/testing',
          '/testing/*',
          '/teams/create',
          '/teams/*/edit',
          '/teams/*/*/edit',
          '/login',
          '/signup',
          '/resetPassword',
        ],
      },
    ],
  },
};
