'use client'
import './globals.css'
import React from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Navigation from '@/components/layout/Navigation'
import CookieConsent from '@/components/common/CookieConcent/CookieConcent'
import { AuthProvider } from '@/context/AuthContext'
import { UserPreferencesProvider } from '@/context/UserPreferencesContext'
import { TournamentProvider } from '@/context/TournamentContext'

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text font-page">
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <Navigation />
              <main className={`mb-auto ${!isHomePage ? 'pb-12' : ''} md:flex md:flex-col md:pb-0 md:w-full`}>
                {!isHomePage && <Header />}
                <div className={`${isHomePage ? 'w-full' : 'md:w-3/5 mx-auto'}`}>
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
