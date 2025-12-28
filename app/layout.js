import './globals.css';
import React from 'react';
import CookieConsent from '@/components/CookieConcent/CookieConcent';
import { AuthProvider } from '@/context/AuthContext';
import { UserPreferencesProvider } from '@/context/UserPreferencesContext';
import { TournamentProvider } from '@/context/TournamentContext';
import Navigation from '@/components/layout/Navigation';
import PWARegister from '@/components/PWARegister';
import NetworkGuard from '@/components/NetworkGuard';

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
  manifest: '/manifest.json',
  // Remove the icons property — let manifest.json handle it
};

// Add explicit viewport (prevents double-tap / input zoom on iOS)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Remove this; Next will generate it from `export const viewport` */}
        {/* <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: dark)" />
      </head>
      <body className="min-h-screen text-gray-600 bg-gray-50 ">
        <PWARegister />
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <Navigation />
              <NetworkGuard />
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
