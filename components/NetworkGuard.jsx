import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { UserPreferencesProvider } from '@/components/UserPreferencesProvider';
import { TournamentProvider } from '@/components/TournamentProvider';
import PWARegister from '@/components/PWARegister';
import Navigation from '@/components/Navigation';
import CookieConsent from '@/components/CookieConsent';
import NetworkGuard from '@/components/NetworkGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Ski Lab',
  description: 'Ski Lab - Your ultimate skiing companion',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/ski-lab-logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body className="min-h-screen text-gray-600 bg-[#fcfcfc] ">
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