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
    user && { key: 'plans', labelKey: 'Plans', icon: <RiShoppingCartLine size={22} />, path: '/plans' },
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
            {/* Drop-up subnav with slide and drag-to-close */}
            <motion.div
              className="md:hidden fixed inset-x-0 bottom-0 z-30 h-fit pb-20 bg-white rounded-t-xl shadow-lg"
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
              <div className="p-5 space-y-3">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
                {subNavItems.map(item =>
                  item.path ? (
                    <Link
                      key={item.key}
                      href={item.path}
                      onClick={() => setIsSubNavOpen(false)}
                      className="border rounded-lg flex justify-between items-center w-full px-4 py-3 border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <span>{item.labelKey}</span>
                      {item.icon}
                    </Link>
                  ) : (
                    <button
                      key={item.key}
                      onClick={item.onClick}
                      className="border rounded-lg flex justify-between items-center w-full px-4 py-3 border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <span>{item.labelKey}</span>
                      {item.icon}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: header */}
      <header className="hidden md:flex md:justify-between items-center w-full bg-white shadow z-50 px-5 p-3">
        <div className="flex-1 flex items-baseline cursor-pointer" onClick={() => router.push('/')}>
          <h1 className="text-2xl font-semibold">Ski-Lab</h1>
          <h5 className="ml-2 text-sm">beta</h5>

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
          <Button onClick={() => setIsSubNavOpen(o => !o)} variant='secondary' className="ml-4 p-2!">
            {user ? <RiMenuLine size={20} /> : <RiLoginBoxLine size={20} />}

          </Button>

          {isSubNavOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsSubNavOpen(false)} />
              <div className="absolute right-0 top-10 w-58 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-50 animate-fade-down animate-duration-300">
                <div className="space-y-3 p-5  ">
                  {subNavItems.map(item =>
                    item.path ? (
                      <Link key={item.key} href={item.path} onClick={() => setIsSubNavOpen(false)} className="border rounded-lg flex items-center w-full px-4 py-2  border-gray-300 text-gray-700 hover:bg-gray-100">
                        {item.icon}
                        <span className="ml-2">{item.labelKey}</span>
                      </Link>
                    ) : (
                      <button key={item.key} onClick={item.onClick} className="border rounded-lg flex items-center w-full px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-100">
                        {item.icon}
                        <span className="ml-2">{item.labelKey}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}