'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'
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
  RiMenuLine,
  RiDownloadLine,
  RiShieldStarLine, // NEW
} from 'react-icons/ri';
import { TiFlowParallel } from 'react-icons/ti';
import { useAuth } from '@/context/AuthContext';
import { useProfileActions } from '@/hooks/useProfileActions';
import Weather from '@/components/Weather/Weather';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import useIsStandalone from '@/hooks/useIsStandalone'; // <--- new import
import { collection, onSnapshot, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore'; // UPDATED
import { db } from '@/lib/firebase/firebaseConfig'; // NEW
import { exportResultsToCSV } from '@/helpers/helpers';

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

  // Helper: fetch all test results for current user (paginated)
  const fetchAllResultsForExport = async (uid) => {
    const PAGE = 200;
    let out = [];
    let cursor = null;
    while (true) {
      const colRef = collection(db, 'users', uid, 'testResults');
      const q = cursor
        ? query(colRef, orderBy('timestamp', 'desc'), startAfter(cursor), limit(PAGE))
        : query(colRef, orderBy('timestamp', 'desc'), limit(PAGE));
      const snap = await getDocs(q);
      if (snap.empty) break;
      out = out.concat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      if (snap.docs.length < PAGE) break;
      cursor = snap.docs[snap.docs.length - 1];
    }
    return out;
  };

  const isActive = path => path === pathname;
  const [isSubNavOpen, setIsSubNavOpen] = useState(false);
  const isStandalone = useIsStandalone(); // centralized hook

  // NEW: detect admin claim
  const [isAdminClaim, setIsAdminClaim] = useState(false);
  const [openFeedbackCount, setOpenFeedbackCount] = useState(0); // NEW

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) {
        if (mounted) {
          setIsAdminClaim(false);
          setOpenFeedbackCount(0);
        }
        return;
      }
      try {
        const token = await user.getIdTokenResult();
        if (mounted) setIsAdminClaim(!!token.claims?.admin);
      } catch {
        if (mounted) setIsAdminClaim(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // NEW: subscribe to open feedback count (admins only)
  useEffect(() => {
    if (!isAdminClaim) { setOpenFeedbackCount(0); return; }
    const q = query(collection(db, 'contact'), where('status', '==', 'open'));
    const unsub = onSnapshot(q, (snap) => setOpenFeedbackCount(snap.size), () => setOpenFeedbackCount(0));
    return () => unsub();
  }, [isAdminClaim]);

  const handleExportCSV = async () => {
    try {
      if (!user?.uid) {
        router.push('/login');
        return;
      }
      const all = await fetchAllResultsForExport(user.uid);
      if (!all.length) {
        alert('No results to export');
        return;
      }
      exportResultsToCSV(all);
    } catch (err) {
      console.error('Error exporting results CSV:', err);
      alert('Failed to export results CSV');
    } finally {
      setIsSubNavOpen(false);
    }
  };

  const subNavItems = [
    // NEW: Admin dashboard (admins only)
    isAdminClaim && { key: 'admin', labelKey: 'Admin', icon: <RiShieldStarLine size={22} />, path: '/admin' },
    user && { key: 'account', labelKey: 'Account', icon: <RiUser6Line size={22} />, path: '/account' },
    user && { key: 'settings', labelKey: 'Settings', icon: <RiSettings3Line size={22} />, path: '/account/settings' },
    !user && { key: 'login', labelKey: 'Login', icon: <RiLoginBoxLine size={22} />, path: '/login' },
    !user && { key: 'signUp', labelKey: 'Sign Up', icon: <RiUserAddLine size={22} />, path: '/signup' },
    { key: 'pricing', labelKey: 'Pricing', icon: <RiShoppingCartLine size={22} />, path: '/pricing' },
    { key: 'contact', labelKey: 'Contact', icon: <RiMessage2Line size={22} />, path: '/contact' },
    { key: 'about', labelKey: 'About', icon: <RiInformationLine size={22} />, path: '/about' },
    // Export CSV: dispatches a global event the Results page listens for
    { key: 'exportCSV', labelKey: 'Export results (CSV)', icon: <RiDownloadLine size={22} />, onClick: handleExportCSV },
    user && { key: 'signOut', labelKey: 'Sign Out', icon: <RiLogoutBoxLine size={22} />, onClick: () => { signOut(router.push); setIsSubNavOpen(false); } },
  ].filter(Boolean);

  return (
    <>
      {/* Mobile: bottom nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full bg-white border-t-1 border-gray-200 z-50 ${isStandalone ? 'pb-6' : ''}`}>
        <div className={`grid grid-cols-5 `}>
          {navConfig.map(item => (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              aria-label={item.labelKey}
              className={`p-4 flex items-center justify-center transition ${isActive(item.path) && !isSubNavOpen ? 'text-blue-600/80 bg-gray-50 rounded-xl' : 'text-gray-600'}`}
            >
              {item.icon}
            </button>
          ))}
          <button
            onClick={() => setIsSubNavOpen(o => !o)}
            aria-label='more'
            className={`p-4 flex items-center justify-center transition ${isSubNavOpen ? 'text-gray-800 bg-gray-100 shadow' : 'text-gray-600'}`}
          >
            <span className="relative">
              {user ? <RiMenuLine size={20} /> : <RiLoginBoxLine size={20} />}
              {isAdminClaim && openFeedbackCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
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
                          className="bg-white flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <span>{item.labelKey}</span>
                          {item.key === 'admin' ? (
                            <span className="relative">
                              {item.icon}
                              {isAdminClaim && openFeedbackCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                              )}
                            </span>
                          ) : item.icon}
                        </Link>
                      </li>
                    ) : (
                      <li key={item.key}>
                        <button onClick={item.onClick}
                          className="bg-white flex items-center justify-between w-full px-4 py-3 rounded-xl  hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200">
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
        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
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
            <span className="relative">
              {user ? <RiMenuLine size={20} /> : <RiLoginBoxLine size={20} />}
              {isAdminClaim && openFeedbackCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
          </button>

          {isSubNavOpen && (
            <>
              {/* Desktop overlay for subnav */}
              <div className="hidden md:block fixed inset-0 z-40 bg-black/20" onClick={() => setIsSubNavOpen(false)} />
              <div className="absolute right-0 top-14 w-80 mt-2 bg-gray-50 backdrop-blur-lg border border-gray-100 rounded-xl shadow overflow-hidden z-50 animate-fade-down animate-duration-300">
                <div className="px-7 py-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-semibold text-xl text-gray-900 tracking-tight">Menu</span>
                  </div>
                  <div className="border-b border-gray-200 mb-4" />
                  <ul className="space-y-3">
                    {subNavItems.map(item =>
                      item.path ? (
                        <li key={item.key}>
                          <Link href={item.path} onClick={() => setIsSubNavOpen(false)}
                            className="bg-white flex items-center justify-between w-full px-4 py-3 rounded-xl  hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <span>{item.labelKey}</span>
                            {item.key === 'admin' ? (
                              <span className="relative">
                                {item.icon}
                                {isAdminClaim && openFeedbackCount > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                              </span>
                            ) : item.icon}
                          </Link>
                        </li>
                      ) : (
                        <li key={item.key}>
                          <button onClick={item.onClick}
                            className="bg-white flex items-center justify-between w-full px-4 py-3 rounded-xl  hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200">
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