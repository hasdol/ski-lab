// app/results/layout.js

export const metadata = {
  title:       'Results • Ski Lab',
  description: 'View and analyze cross-country ski test results on Ski Lab.',
  robots: {
    index: true, // ← ENSURE INDEXING
    follow: true,
  },
  alternates: { canonical: 'https://ski-lab.com/results' },
  keywords: [
    'ski test results',
    'cross-country ski performance',
    'ski lab results',
    'ski testing analysis'
  ],
  openGraph: {
    title:       'Results • Ski Lab',
    description: 'View and analyze cross-country ski test results on Ski Lab.',
    url:         'https://ski-lab.com/results',
    siteName:    'Ski Lab',
    images: [
      {
        url:    '/og-image-results.png',
        width:  1200,
        height: 630,
        alt:    'Ski Lab Results',
      },
    ],
    type:   'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function ResultsLayout({ children }) {
  return children;
}
