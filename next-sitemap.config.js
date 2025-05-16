/** next-sitemap.config.js */
module.exports = {
  siteUrl: 'https://ski-lab.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,

  // ONLY your protected/auth-only routes go here.
  // We use ** to recurse into all child paths.
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
    '/skis/**/edit',
    '/skis/**/edit/**',
    '/results/**/edit',
    '/testing',
    '/testing/**',
    '/create-event',
    '/create-event/**',
    '/edit',
    '/edit/**',
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
          '/skis/*/edit',
          '/results/*/edit',
          '/testing',
          '/create-event',
          '/edit',
        ],
        allow: ['/'],            // everything else is crawlable
      },
    ],
    additionalSitemaps: [
      'https://ski-lab.com/sitemap-0.xml',
    ],
  },
}
