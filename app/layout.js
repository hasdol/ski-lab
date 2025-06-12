import './globals.css';
import React from 'react';
import CookieConsent from '@/components/CookieConcent/CookieConcent';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import { TournamentProvider } from '@/context/TournamentContext';
import Navigation from '@/components/layout/Navigation';

/**
 * Global metadata applied to all public pages (default, EN).
 * Override or extend in child layouts/pages as needed.
 * @type {import('next').Metadata}
 */
export const metadata = {
  metadataBase: new URL('https://ski-lab.com'),
  title: {
    default: 'Ski Lab',
  },
  description:
    'Cross-country ski testing & organisation for athletes, coaches & brands.',
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@skilab',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ski Lab',
    images: ['/og-image.png'],
    locale: 'en_US',
  },
  alternates: {
    canonical: 'https://ski-lab.com', // Override in pages with dynamic content
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-gray-600 bg-white">
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <Navigation />
              <main className="mb-auto pb-14 md:flex md:flex-col md:pb-0 md:w-full">
                {children}
              </main>
              <CookieConsent />
            </TournamentProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
