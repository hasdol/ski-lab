/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://ski-lab.com', // Bytt ut med din egen URL
  generateRobotsTxt: true,         // Lager også robots.txt automatisk
  sitemapSize: 7000,               // Maks antall URL-er per sitemap-fil (kan justeres)
  exclude: ['/addSki',
    '/lockedSkis',
    '/settings',
    '/results',
    '/account',
    '/plans',
    '/testing/summary',
    '/resetPassword',
    '/testing',
    '/skis',],
};