module.exports = {
  siteUrl: 'https://ski-lab.com',
  generateRobotsTxt: true,
  changefreq: 'daily',
  priority: 0.7,

  exclude: [
    '/account*',
    '/settings*',
    '/plans*',
    '/skis/create*',
    '/skis/locked*',
    '/results/*/edit*',
    '/testing*',
    '/teams/create*',
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
          '/teams/create*',
          '/teams/*/edit',
          '/teams/*/*/edit',
          '/signin',
          '/signup',
          '/resetPassword'
        ],
      },
    ],
    // REMOVE THIS additionalSitemaps ARRAY COMPLETELY
  },
};