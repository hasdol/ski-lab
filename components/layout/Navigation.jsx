'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  RiHome5Line,
  RiTeamLine,
  RiSettings3Line,
  RiUser6Line,
  RiMessage2Line,
  RiUserAddLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiShoppingCartLine,
  RiBarChart2Line,
  RiInformationLine,
  RiMenuLine
} from 'react-icons/ri';
import { TiFlowParallel } from 'react-icons/ti';
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Weather from '@/components/Weather/Weather';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const navConfig = [
  { key: 'home', labelKey: 'Home', icon: <RiHome5Line size={22} />, path: '/' },
  { key: 'skis', labelKey: 'Skis', icon: <TiFlowParallel size={22} />, path: '/skis' },
  { key: 'results', labelKey: 'Results', icon: <RiBarChart2Line size={22} />, path: '/results' },
  { key: 'teams', labelKey: 'Teams', icon: <RiTeamLine size={22} />, path: '/teams' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { signOut } = useProfileActions(user);

  const isActive = path => path === pathname;
  const [isSubNavOpen, setIsSubNavOpen] = useState(false);
  

  const subNavItems = [
    user && { key: 'account', labelKey: 'Account', icon: <RiUser6Line size={22} />, path: '/account' },
    user && { key: 'settings', labelKey: 'Settings', icon: <RiSettings3Line size={22} />, path: '/account/settings' },
    { key: 'pricing', labelKey: 'Pricing', icon: <RiShoppingCartLine size={22} />, path: '/pricing' },
    !user && { key: 'login', labelKey: 'Login', icon: <RiLoginBoxLine size={22} />, path: '/login' },
    !user && { key: 'signUp', labelKey: 'Sign Up', icon: <RiUserAddLine size={22} />, path: '/signup' },
    { key: 'contact', labelKey: 'Contact', icon: <RiMessage2Line size={22} />, path: '/contact' },
    { key: 'about', labelKey: 'About', icon: <RiInformationLine size={22} />, path: '/about' },
    user && { key: 'signOut', labelKey: 'Sign Out', icon: <RiLogoutBoxLine size={22} />, onClick: () => { signOut(router.push); setIsSubNavOpen(false); } },
  ].filter(Boolean);

  return (
    <>
      {/* Mobile: bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-1 border-gray-300 z-50">
        <div className="grid grid-cols-5 ">
          {navConfig.map(item => (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              aria-label={item.labelKey}
              className={`p-4 flex items-center justify-center transition ${isActive(item.path) && !isSubNavOpen ? 'text-blue-600/80 bg-blue-100' : 'text-gray-600'}`}
            >
              {item.icon}
            </button>
          ))}
          <button
            onClick={() => setIsSubNavOpen(o => !o)}
            aria-label='more'
            className={`p-4 flex items-center justify-center transition ${isSubNavOpen ? 'text-gray-800 bg-gray-100 shadow' : 'text-gray-600'}`}
          >
            {user ? <RiMenuLine size={20} /> : <RiLoginBoxLine size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile: backdrop + draggable drop-up subnav */}
      <AnimatePresence>
        {isSubNavOpen && (
          <>
            {/* Overlay with fade-in */}
            <motion.div
              className="md:hidden fixed inset-0 z-20 backdrop-blur bg-black/10"
              onClick={() => setIsSubNavOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            {/* Drop-up subnav with glassmorphism, header, divider, and improved styling */}
            <motion.div
              className="md:hidden fixed inset-x-0 bottom-0 z-30 h-fit pb-20 bg-white/80 backdrop-blur-lg rounded-t-2xl shadow-2xl"
              style={{ touchAction: 'none' }}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => {
                if (info.point.y > 100) setIsSubNavOpen(false);
              }}
            >
              <div className="px-6 pt-4 pb-6">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
                <div className="mb-3 flex items-center gap-2 justify-center">
                  <span className="font-semibold text-lg text-gray-900 tracking-tight">Menu</span>
                </div>
                <div className="border-b border-gray-200 mb-4" />
                <ul className="space-y-2">
                  {subNavItems.map(item =>
                    item.path ? (
                      <li key={item.key}>
                        <Link
                          href={item.path}
                          onClick={() => setIsSubNavOpen(false)}
                          className="flex items-center justify-between w-full bg-white/50 px-4 py-3 rounded-xl border border-transparent hover:bg-blue-50  hover:text-blue-600 hover:scale-[1.03] transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <span>{item.labelKey}</span>
                          {item.icon}
                        </Link>
                      </li>
                    ) : (
                      <li key={item.key}>
                        <button
                          onClick={item.onClick}
                          className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-transparent hover:bg-blue-50 hover:text-blue-600  hover:scale-[1.03] transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <span>{item.labelKey}</span>
                          {item.icon}
                        </button>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: header */}
      <header className="hidden md:flex md:justify-between items-center w-full bg-white shadow z-50 px-5 p-3">
        <div className="flex-1 flex items-baseline cursor-pointer" onClick={() => router.push('/')}>
          <h1 className="text-2xl font-semibold">Ski-Lab</h1>

        </div>

        <nav className="flex-1">
          <ul className="grid grid-cols-4 gap-1">
            {navConfig.map(item => (
              <li key={item.key}>
                <Link href={item.path} className={`flex items-center justify-center transition py-1 hover:bg-gray-100 rounded-lg  ${isActive(item.path) ? 'bg-blue-100  text-blue-600/80' : 'text-gray-700'}`}>
                  {item.icon}
                  <span className="ml-2">{item.labelKey}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 flex items-center justify-end justify-self-end relative">
          <Weather />
          <button onClick={() => setIsSubNavOpen(o => !o)} variant='secondary' className="ml-4 p-2! hover:bg-gray-100 rounded-xl">
            {user ? <RiMenuLine size={20} /> : <RiLoginBoxLine size={20} />}

          </button>

          {isSubNavOpen && (
            <>
              {/* Desktop overlay for subnav (no blur) */}
              <div className="hidden md:block fixed inset-0 z-40 bg-black/10" onClick={() => setIsSubNavOpen(false)} />
              <div className="absolute right-0 top-14 w-80 mt-2 bg-white/80 backdrop-blur-lg border border-gray-100 rounded-xl shadow overflow-hidden z-50 animate-fade-down animate-duration-300">
                <div className="px-7 py-6">
                  <div className="mb-3 flex items-center gap-2">
                    <RiMenuLine size={22} />
                    <span className="font-semibold text-xl text-gray-900 tracking-tight">Menu</span>
                  </div>
                  <div className="border-b border-gray-200 mb-4" />
                  <ul className="space-y-2">
                    {subNavItems.map(item =>
                      item.path ? (
                        <li key={item.key}>
                          <Link href={item.path} onClick={() => setIsSubNavOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-transparent hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <span>{item.labelKey}</span>
                            {item.icon}
                          </Link>
                        </li>
                      ) : (
                        <li key={item.key}>
                          <button onClick={item.onClick}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-transparent hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <span>{item.labelKey}</span>
                            {item.icon}
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}