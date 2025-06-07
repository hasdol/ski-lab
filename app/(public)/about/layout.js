export const metadata = {
  title: 'About • Ski Lab',
  description: 'Learn more about Ski Lab, your hub for cross-country ski testing and management.',
  alternates: { canonical: 'https://ski-lab.com/about' },
  robots: {
    index: true, // Ensure indexing
    follow: true,
  },
  openGraph: {
    title: 'About Ski Lab',
    url: 'https://ski-lab.com/about',
    images: [{ url: '/og-image-about.png' }],
  },
};

export default function AboutLayout({ children }) {
  return children ;
}