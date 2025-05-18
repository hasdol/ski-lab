// app/layout.js
// ── Global metadata for all public pages (single-language: EN) ───────────────

import './globals.css';
import React from 'react';
import CookieConsent from '@/components/common/CookieConcent';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import { TournamentProvider } from '@/context/TournamentContext';
import Navigation from '@/components/layout/Navigation';

/**
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-text">
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <Navigation />
              <main className="mb-auto pb-20 md:flex md:flex-col md:pb-0 md:w-full">
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