// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://ski-lab.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,
  
  // Fix: Use regex patterns for proper exclusion
  exclude: [
    '/account*',
    '/settings*',
    '/plans*',
    '/skis/create*',
    '/skis/locked*',
    '/results/*/edit*',
    '/testing*',
    '/teams/*/edit*',
    '/teams/*/*/edit*',
    '/signin*',
    '/signup*',
    '/resetPassword*'
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/settings',
          '/plans',
          '/skis/create',
          '/skis/locked',
          '/results/*/edit',
          '/testing',
          '/teams/*/edit',
          '/teams/*/*/edit',
          '/signin',
          '/signup',
          '/resetPassword'
        ],
      },
    ],
    additionalSitemaps: [
      'https://ski-lab.com/sitemap.xml'
    ],
  },
};