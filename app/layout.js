'use client'
import './globals.css'
import React from 'react'
import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Navigation from '@/components/layout/Navigation'
import CookieConsent from '@/components/common/CookieConcent'
import { AuthProvider } from '@/context/AuthContext'
import { UserPreferencesProvider } from '@/context/UserPreferencesContext'
import { TournamentProvider } from '@/context/TournamentContext'
import { useRouter } from 'next/navigation'


export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const router = useRouter();

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text font-page">
        <AuthProvider>
          <UserPreferencesProvider>
            <TournamentProvider>
              <main className={`mb-auto ${!isHomePage ? 'pb-12' : ''} md:flex md:flex-col md:pb-0 md:w-full`}>
                <div className="md:hidden w-full cursor-pointer " onClick={() => router.push('/')}>

                  <div className={`flex items-center justify-self-center relative ${isHomePage && 'hidden'}` }>
                    <h1 className="text-4xl font-semibold italic p-4">SKI-LAB</h1>
                    <h1 className="absolute -right-6 top-4 font-semibold italic pt-4">beta</h1>
                  </div>

                </div>
                <Navigation />
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
