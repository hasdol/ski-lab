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
import { FaSlideshare } from "react-icons/fa";

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

  // NEW: pending share requests count (inbound + outbound)
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0);
  const [pendingOutgoingCount, setPendingOutgoingCount] = useState(0);
  // const pendingShareCount = pendingIncomingCount + pendingOutgoingCount; // remove usage
  const actionableShareCount = pendingIncomingCount; // only requests you need to act on

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

  // NEW: subscribe to pending share requests for current user
  useEffect(() => {
    if (!user?.uid) {
      setPendingIncomingCount(0);
      setPendingOutgoingCount(0);
      return;
    }
    const inQ = query(collection(db, 'shareRequests'), where('toUid', '==', user.uid), where('status', '==', 'pending'));
    const outQ = query(collection(db, 'shareRequests'), where('fromUid', '==', user.uid), where('status', '==', 'pending'));
    const unsubIn = onSnapshot(inQ, (snap) => setPendingIncomingCount(snap.size), () => setPendingIncomingCount(0));
    const unsubOut = onSnapshot(outQ, (snap) => setPendingOutgoingCount(snap.size), () => setPendingOutgoingCount(0));
    return () => { unsubIn(); unsubOut(); };
  }, [user?.uid]);

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
    user && { key: 'sharing', labelKey: 'Sharing', icon: <FaSlideshare size={22} />, path: '/sharing' },
    !user && { key: 'login', labelKey: 'Login', icon: <RiLoginBoxLine size={22} />, path: '/login' },
    !user && { key: 'signUp', labelKey: 'Sign Up', icon: <RiUserAddLine size={22} />, path: '/signup' },
    { key: 'pricing', labelKey: 'Pricing', icon: <RiShoppingCartLine size={22} />, path: '/pricing' },
    { key: 'contact', labelKey: 'Contact', icon: <RiMessage2Line size={22} />, path: '/contact' },
    { key: 'about', labelKey: 'About', icon: <RiInformationLine size={22} />, path: '/about' },
    // Export CSV: dispatches a global event the Results page listens for
    { key: 'exportCSV', labelKey: 'Export results (CSV)', icon: <RiDownloadLine size={22} />, onClick: handleExportCSV },
    user && { key: 'signOut', labelKey: 'Sign Out', icon: <RiLogoutBoxLine size={22} />, onClick: () => { signOut(router.push); setIsSubNavOpen(false); } },
  ].filter(Boolean);

  useEffect(() => {
    if (isSubNavOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    // Clean up on unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isSubNavOpen]);

  return (
    <>
      {/* Mobile: bottom nav */}
      <nav className={`md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 ${isStandalone ? 'pb-6' : ''}`}>
        <div className={`grid grid-cols-5 `}>
          {navConfig.map(item => (
            <button
              key={item.key}
              onClick={() => router.push(item.path)}
              aria-label={item.labelKey}
              className={`p-4 flex items-center justify-center transition ${isActive(item.path) && !isSubNavOpen ? 'text-blue-600/80 bg-gray-50 rounded-2xl' : 'text-gray-600'}`}
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
            {/* Full-screen subnav */}
            <motion.div
              className="md:hidden fixed inset-0 z-30 bg-white/90 backdrop-blur-lg shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              style={{ paddingBottom: '4.5rem' }} // height of bottom nav
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <span className="font-semibold text-lg text-gray-900 tracking-tight">Menu</span>
                <button
                  onClick={() => setIsSubNavOpen(false)}
                  aria-label="Close menu"
                  className="p-2 rounded-full hover:bg-gray-200 transition"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="border-b border-gray-200 mb-2" />
              <div className="flex-1 overflow-y-auto px-2 pb-6">
                <ul className="space-y-2">
                  {/* Auth Section (always on top) */}
                  {!user ? (
                    <>
                      <li className="text-xs text-gray-400 font-semibold px-2 pt-2 pb-1">Auth</li>
                      <li>
                        <Link
                          href="/login"
                          onClick={() => setIsSubNavOpen(false)}
                          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <span>Login</span>
                          <RiLoginBoxLine size={22} />
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/signup"
                          onClick={() => setIsSubNavOpen(false)}
                          className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <span>Sign Up</span>
                          <RiUserAddLine size={22} />
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="text-xs text-gray-400 font-semibold px-2 pt-2 pb-1">Auth</li>
                      <li>
                        <button
                          onClick={() => { signOut(router.push); setIsSubNavOpen(false); }}
                          className="text-red-800/80 flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-red-50 hover:text-red-800 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                        >
                          <span>Sign Out</span>
                          <RiLogoutBoxLine size={22} />
                        </button>
                      </li>
                    </>
                  )}

                  {/* Account/User Section */}
                  {(user || isAdminClaim) && (
                    <>
                      <li className="text-xs text-gray-400 font-semibold px-2 pt-4 pb-1">Account</li>
                      {isAdminClaim && (
                        <li>
                          <Link
                            href="/admin"
                            onClick={() => setIsSubNavOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <span>Admin</span>
                            <span className="relative">
                              <RiShieldStarLine size={22} />
                              {openFeedbackCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                              )}
                            </span>
                          </Link>
                        </li>
                      )}
                      {user && (
                        <>
                          <li>
                            <Link
                              href="/account"
                              onClick={() => setIsSubNavOpen(false)}
                              className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 "
                            >
                              <span>Account</span>
                              <RiUser6Line size={22} />
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/account/settings"
                              onClick={() => setIsSubNavOpen(false)}
                              className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <span>Settings</span>
                              <RiSettings3Line size={22} />
                            </Link>
                          </li>
                          <li>
                          <Link
                            href="/sharing"
                            onClick={() => setIsSubNavOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <span>Sharing</span>
                            <span className="relative">
                              <FaSlideshare size={22} />
                              {actionableShareCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                              )}
                            </span>
                          </Link>
                        </li>
                        </>
                      )}
                    </>
                  )}

                  {/* General Section */}
                  <li className="text-xs text-gray-400 font-semibold px-2 pt-4 pb-1">General</li>
                  
                  <li>
                    <Link
                      href="/pricing"
                      onClick={() => setIsSubNavOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <span>Pricing</span>
                      <RiShoppingCartLine size={22} />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      onClick={() => setIsSubNavOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <span>Contact</span>
                      <RiMessage2Line size={22} />
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      onClick={() => setIsSubNavOpen(false)}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <span>About</span>
                      <RiInformationLine size={22} />
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <span>Export results (CSV)</span>
                      <RiDownloadLine size={22} />
                    </button>
                  </li>
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: header */}
      <header className="hidden md:flex md:justify-between items-center w-full bg-white z-50 px-5 p-3">
        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <h1 className="text-2xl font-semibold bg-gradient-to-b from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
            Ski-Lab
          </h1>
        </div>

        <nav className="flex-1">
          <ul className="grid grid-cols-4 gap-1">
            {navConfig.map(item => (
              <li key={item.key}>
                <Link href={item.path} className={`flex items-center justify-center transition py-1 hover:bg-gray-100 rounded-2xl  ${isActive(item.path) ? 'bg-blue-100  text-blue-600/80' : 'text-gray-700'}`}>
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
              <div
                className="hidden md:block fixed inset-0 z-40 bg-black/10 backdrop-blur"
                onClick={() => setIsSubNavOpen(false)}
              />
              {/* Right-side subnav drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="hidden md:flex fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white/90 backdrop-blur-lg shadow-2xl flex-col rounded-l-2xl"
                style={{ maxHeight: '100vh' }}
              >
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                  <span className="font-semibold text-lg text-gray-900 tracking-tight">Menu</span>
                  <button
                    onClick={() => setIsSubNavOpen(false)}
                    aria-label="Close menu"
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="border-b border-gray-200 mb-2" />
                <div className="flex-1 overflow-y-auto px-2 pb-6">
                  <ul className="space-y-2">
                    {/* Auth Section (always on top) */}
                    {!user ? (
                      <>
                        <li className="text-xs text-gray-400 font-semibold px-2 pt-2 pb-1">Auth</li>
                        <li>
                          <Link
                            href="/login"
                            onClick={() => setIsSubNavOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <span>Login</span>
                            <RiLoginBoxLine size={22} />
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/signup"
                            onClick={() => setIsSubNavOpen(false)}
                            className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <span>Sign Up</span>
                            <RiUserAddLine size={22} />
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="text-xs text-gray-400 font-semibold px-2 pt-2 pb-1">Auth</li>
                        <li>
                          <button
                            onClick={() => { signOut(router.push); setIsSubNavOpen(false); }}
                            className=" text-red-800/80 flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-red-50 hover:text-red-800 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            <span>Sign Out</span>
                            <RiLogoutBoxLine size={22} />
                          </button>
                        </li>
                      </>
                    )}

                    {/* Account/User Section */}
                    {(user || isAdminClaim) && (
                      <>
                        <li className="text-xs text-gray-400 font-semibold px-2 pt-4 pb-1">Account</li>
                        {isAdminClaim && (
                          <li>
                            <Link
                              href="/admin"
                              onClick={() => setIsSubNavOpen(false)}
                              className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <span>Admin</span>
                              <span className="relative">
                                <RiShieldStarLine size={22} />
                                {openFeedbackCount > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                              </span>
                            </Link>
                          </li>
                        )}
                        {user && (
                          <>
                            <li>
                              <Link
                                href="/account"
                                onClick={() => setIsSubNavOpen(false)}
                                className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 "
                              >
                                <span>Account</span>
                                <RiUser6Line size={22} />
                              </Link>
                            </li>
                            <li>
                              <Link
                                href="/account/settings"
                                onClick={() => setIsSubNavOpen(false)}
                                className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                              >
                                <span>Settings</span>
                                <RiSettings3Line size={22} />
                              </Link>
                            </li>
                            <li>
                            <Link
                              href="/sharing"
                              onClick={() => setIsSubNavOpen(false)}
                              className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                              <span>Sharing</span>
                              <span className="relative">
                                <FaSlideshare size={22} />
                                {actionableShareCount > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                                )}
                              </span>
                            </Link>
                          </li>
                          </>
                        )}
                      </>
                    )}

                    {/* General Section */}
                    <li className="text-xs text-gray-400 font-semibold px-2 pt-4 pb-1">General</li>
                    
                    <li>
                      <Link
                        href="/pricing"
                        onClick={() => setIsSubNavOpen(false)}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <span>Pricing</span>
                        <RiShoppingCartLine size={22} />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        onClick={() => setIsSubNavOpen(false)}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <span>Contact</span>
                        <RiMessage2Line size={22} />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/about"
                        onClick={() => setIsSubNavOpen(false)}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <span>About</span>
                        <RiInformationLine size={22} />
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <span>Export results (CSV)</span>
                        <RiDownloadLine size={22} />
                      </button>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </header>
    </>
  );
}