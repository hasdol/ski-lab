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
    '/results/*',
    '/testing',
    '/testing/*',
    '/teams/create',
    '/teams/*/edit',
    '/teams/*/*/edit',
    // Auth pages will not be in the sitemap, but we do NOT disallow them.
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
          // Private app surfaces
          '/account',
          '/account/*',
          '/skis/create',
          '/skis/locked',
          '/skis/*/edit',
          '/results/*',       // detail/edit pages are private
          '/testing',
          '/testing/*',
          '/teams/create',
          '/teams/*/edit',
          '/teams/*/*/edit',
          // DO NOT disallow auth endpoints so Google can see meta noindex:
          // '/login', '/signup', '/resetPassword'
        ],
      },
    ],
  },
};
