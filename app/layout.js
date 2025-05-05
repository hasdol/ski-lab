'use client'
import './globals.css'
import React from 'react'
import { usePathname } from 'next/navigation'
import CookieConsent from '@/components/common/CookieConcent'
import { AuthProvider } from '@/context/AuthContext'
import { UserPreferencesProvider } from '@/context/UserPreferencesContext'
import { TournamentProvider } from '@/context/TournamentContext'
import Navigation from '@/components/layout/Navigation'


export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text font-page">
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <main className={`mb-auto ${!isHomePage ? 'pb-12' : ''} md:flex md:flex-col md:pb-0 md:w-full`}>
                <Navigation />
                <div className={`${isHomePage ? 'w-full' : 'md:w-3/5 mx-auto md:mt-5'}`}>
                  {children}
                  <CookieConsent />
                </div>
              </main>
            </TournamentProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
