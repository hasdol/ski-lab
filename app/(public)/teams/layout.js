// app/teams/layout.js

export const metadata = {
  title:       'Teams • Ski Lab',
  description: 'Manage and collaborate with your cross-country ski teams on Ski Lab.',
  alternates: { canonical: 'https://ski-lab.com/teams' },
  keywords: [
    'cross-country ski teams',
    'ski team collaboration',
    'ski team management',
    'ski lab teams'
  ],
  openGraph: {
    title:       'Teams • Ski Lab',
    description: 'Manage and collaborate with your cross-country ski teams on Ski Lab.',
    url:         'https://ski-lab.com/teams',
    siteName:    'Ski Lab',
    images: [
      {
        url:    '/og-image-teams.png',
        width:  1200,
        height: 630,
        alt:    'Teams at Ski Lab',
      },
    ],
    type:   'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function TeamsLayout({ children }) {
  return children;
}
