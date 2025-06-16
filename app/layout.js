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
  title: 'Ski-Lab',
  description: 'Cross-country ski testing & organisation for athletes, coaches & brands.',
  keywords: [
    'ski testing',
    'cross-country skis',
    'ski inventory',
    'ski lab',
    'ski equipment management',
    'athlete tools',
    'sports technology'
  ],
  authors: [{ name: 'Ski-Lab', url: 'https://ski-lab.com',}],
  creator: 'Ski Lab',
  metadataBase: new URL('https://ski-lab.com'),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen text-gray-600 bg-[#fcfcfc] ">
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
