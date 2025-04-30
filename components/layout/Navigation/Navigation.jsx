'use client';

import React, { useContext, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  RiHome5Line,
  RiTeamLine,
  RiSettings3Line,
  RiUser6Line,
  RiMessage2Line,
  RiLogoutCircleRLine,
  RiLoginCircleLine,
  RiUserAddLine,
} from 'react-icons/ri';
import { TiFlowParallel } from 'react-icons/ti';
import { BiChart } from 'react-icons/bi';
import { VscDebugContinue } from 'react-icons/vsc';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';

import { TournamentContext } from '@/context/TournamentContext';
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Weather from '@/components/Weather';
import Button from '@/components/common/Button';
import useOutsideClick from '@/hooks/useOutsideClick';

const DRAG_THRESHOLD = 100;

// Main navigation items
const navConfig = [
  { key: 'home', labelKey: 'home', icon: <RiHome5Line size={22} />, path: '/' },
  { key: 'skis', labelKey: 'skipark', icon: <TiFlowParallel size={22} />, path: '/skis' },
  { key: 'results', labelKey: 'results', icon: <BiChart size={24} />, path: '/results' },
  { key: 'teams', labelKey: 'teams', icon: <RiTeamLine size={22} />, path: '/teams' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { signOut } = useProfileActions(user);
  const { currentRound } = useContext(TournamentContext);

  const isActive = path => path === pathname;
  const [isSubNavOpen, setIsSubNavOpen] = useState(false);
  const dragY = useMotionValue(0);
  const panelRef = useRef(null);

  // Close when clicking outside (desktop dropdown)
  useOutsideClick(panelRef, () => {
    if (isSubNavOpen) setIsSubNavOpen(false);
  });

  // Build sub-nav items
  const subNavItems = [
    user && { key: 'account', labelKey: 'account', icon: <RiUser6Line size={22} />, path: '/account' },
    user && { key: 'settings', labelKey: 'settings', icon: <RiSettings3Line size={22} />, path: '/settings' },
    user && { key: 'contact', labelKey: 'contact', icon: <RiMessage2Line size={22} />, path: '/contact' },
    user && {
      key: 'signOut',
      labelKey: 'signOut',
      icon: <RiLogoutCircleRLine size={22} />,
      onClick: () => {
        signOut(router.push);
        setIsSubNavOpen(false);
      },
    },
    !user && { key: 'signIn', labelKey: 'signIn', icon: <RiLoginCircleLine size={22} />, path: '/signin' },
    !user && { key: 'signUp', labelKey: 'signUp', icon: <RiUserAddLine size={22} />, path: '/signup' },
  ].filter(Boolean);

  // Continue button logic
  const showContinue =
    user &&
    currentRound.length > 0 &&
    !['/testing', '/testing/summary'].includes(pathname);
  const handleContinue = () => {
    router.push('/testing/summary');
  };

  return (
    <>
      {/* Mobile: bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white shadow z-50">
        <ul className="grid grid-cols-5 items-center">
          {navConfig.map(item => (
            <li key={item.key} className="justify-self-center">
              <button
                onClick={() => router.push(item.path)}
                aria-label={t(item.labelKey)}
                className={`p-4 flex items-center justify-center transition ${
                  isActive(item.path)
                    ? 'text-primary border-t-2 border-primary'
                    : 'text-gray-600'
                } hover:text-primary`}
              >
                {item.icon}
              </button>
            </li>
          ))}
          <li className="justify-self-center">
            <button
              onClick={() => setIsSubNavOpen(o => !o)}
              aria-label={t('more')}
              className={`p-4 flex items-center justify-center transition ${
                isSubNavOpen
                  ? 'text-primary border-t-2 border-primary'
                  : 'text-gray-600'
              } hover:text-primary`}
            >
              <RiSettings3Line size={22} />
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile: backdrop + slide-up subnav */}
      <AnimatePresence>
        {isSubNavOpen && (
          <>
            {/* Backdrop catches clicks to close */}
            <div
              className="fixed inset-0 z-20 backdrop-blur"
              onClick={() => setIsSubNavOpen(false)}
            />
            <motion.div
              ref={panelRef}
              className="md:hidden fixed inset-x-0 bottom-0 z-30 h-2/3 bg-white rounded-t-lg shadow-lg"
              style={{ y: dragY }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragDirectionLock
              dragMomentum={false}
              onDragEnd={(_, info) =>
                info.offset.y > DRAG_THRESHOLD
                  ? setIsSubNavOpen(false)
                  : animate(dragY, 0)
              }
            >
              <div className="px-4 pt-4">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
                {subNavItems.map(item =>
                  item.path ? (
                    <Link
                      key={item.key}
                      href={item.path}
                      onClick={() => setIsSubNavOpen(false)}
                      className="w-full flex justify-between items-center py-4 px-3 hover:bg-gray-100 rounded-md"
                    >
                      <span>{t(item.labelKey)}</span>
                      {item.icon}
                    </Link>
                  ) : (
                    <button
                      key={item.key}
                      onClick={item.onClick}
                      className="w-full flex justify-between items-center py-4 px-3 hover:bg-gray-100 rounded-md"
                    >
                      <span>{t(item.labelKey)}</span>
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
      <header className="hidden md:grid md:grid-cols-3 items-center w-full bg-white shadow z-50 px-8 py-4">
        {/* Logo */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push('/')}
        >
          <h1 className="text-2xl font-semibold italic">SKI-LAB</h1>
          <span className="ml-2 text-sm font-medium">beta</span>
        </div>
        {/* Navigation links */}
        <nav className="flex-1">
          <ul className="flex justify-center space-x-8">
            {navConfig.map(item => (
              <li key={item.key}>
                <Link
                  href={item.path}
                  className={`flex items-center pb-1 transition ${
                    isActive(item.path)
                      ? 'border-b-2 border-primary text-primary font-semibold'
                      : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{t(item.labelKey)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Right widgets */}
        <div className="flex items-center space-x-4 justify-self-end">
          <Weather />
          {showContinue && (
            <Button onClick={handleContinue} variant="primary">
              <VscDebugContinue />
            </Button>
          )}
          <div className="relative">
            <button
              onClick={() => setIsSubNavOpen(o => !o)}
              aria-label={t('more')}
              className="text-gray-700 hover:text-primary transition"
            >
              <RiSettings3Line size={24} />
            </button>
            <AnimatePresence>
              {isSubNavOpen && (
                <motion.div
                  ref={panelRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="py-2">
                    {subNavItems.map(item =>
                      item.path ? (
                        <Link
                          key={item.key}
                          href={item.path}
                          onClick={() => setIsSubNavOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          {item.icon}
                          <span className="ml-2">{t(item.labelKey)}</span>
                        </Link>
                      ) : (
                        <button
                          key={item.key}
                          onClick={item.onClick}
                          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          {item.icon}
                          <span className="ml-2">{t(item.labelKey)}</span>
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
}
