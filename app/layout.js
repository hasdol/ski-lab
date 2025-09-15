import './globals.css';
import React from 'react';
import CookieConsent from '@/components/CookieConcent/CookieConcent';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import { TournamentProvider } from '@/context/TournamentContext';
import Navigation from '@/components/layout/Navigation';
import PWARegister from '@/components/PWARegister';

/**
 * Global metadata applied to all public pages (default, EN).
 * Override or extend in child layouts/pages as needed.
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: 'Ski Lab',
  description: 'Ski-management for cross-country skiing and biathlon',
  keywords: [
    'ski testing',
    'cross-country skis',
    'ski inventory',
    'ski lab',
    'ski equipment management',
    'athlete tools',
    'sports technology'
  ],
  authors: [{ name: 'Ski-Lab', url: 'https://ski-lab.com' }],
  creator: 'Ski Lab',
  metadataBase: new URL('https://ski-lab.com'),
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192' },
      { url: '/icons/icon-512.png', sizes: '512x512' }
    ],
    apple: [{ url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' }]
  }
};

// Add viewport generator that also supplies themeColor (light/dark variants)
export function generateViewport() {
  return {
    // standard viewport string
    viewport: 'width=device-width, initial-scale=1',
    // themeColor can be a single string or an array with media queries
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
      { media: '(prefers-color-scheme: dark)', color: '#0b1220' }
    ]
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen text-gray-600 bg-[#fcfcfc] ">
        <PWARegister />
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
