// app/layout.js

// ── ❶ Global metadata for all public pages ───────────────
export const metadata = {
  metadataBase: new URL('https://ski-lab.com'),
  title: 'Ski Lab',
  description: 'Cross-country ski testing & organization for athletes, coaches & brands.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Ski Lab',
    description: 'Cross-country ski testing & organization for athletes, coaches & brands.',
    url: 'https://ski-lab.com',
    siteName: 'Ski Lab',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ski Lab Logo',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

import './globals.css';
import React from 'react';
import CookieConsent from '@/components/common/CookieConcent';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import { TournamentProvider } from '@/context/TournamentContext';
import Navigation from '@/components/layout/Navigation';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-text">
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <main className="mb-auto md:flex md:flex-col md:pb-0 md:w-full">
                <Navigation />
                {children}
                <CookieConsent />
              </main>
            </TournamentProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
