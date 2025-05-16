// app/skis/layout.js

export const metadata = {
  title:       'Skis • Ski Lab',
  description: 'Explore, filter, sort and manage your cross-country skis at Ski Lab.',
  alternates: { canonical: 'https://ski-lab.com/skis' },
  keywords: [
    'cross-country skis', 
    'ski inventory', 
    'ski management', 
    'ski testing', 
    'ski comparison'
  ],
  openGraph: {
    title:       'Skis • Ski Lab',
    description: 'Explore, filter, sort and manage your cross-country skis at Ski Lab.',
    url:         'https://ski-lab.com/skis',
    siteName:    'Ski Lab',
    images: [
      {
        url:    '/og-image-skis.png',
        width:  1200,
        height: 630,
        alt:    'Skis at Ski Lab',
      },
    ],
    type:   'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};
 
export default function SkisLayout({ children }) {
  return children;
}
