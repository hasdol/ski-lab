'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const iphonePreview = '/ski-lab-testing-iphone.png';

// SIMPLE_ANIM: consistent, simple, safe animation for mount
const SIMPLE_ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
};

const InstallCard = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || '';
    const isi = /iphone|ipad|ipod/i.test(ua) && !window.matchMedia('(display-mode: standalone)').matches;
    setIsIos(isi);
    const dismissed = localStorage.getItem('skiLabHideIosInstallHint') === '1';
    setShowIosHint(isi && !dismissed);
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        // @ts-ignore
        window.navigator.standalone;
      setIsStandalone(!!standalone);
    };
    checkStandalone();
    window.addEventListener('resize', checkStandalone);
    return () => window.removeEventListener('resize', checkStandalone);
  }, []);

  useEffect(() => {
    const onBefore = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (isStandalone) return null;
  if (!canInstall && !isIos) return null;

  const toggleHint = () => {
    if (showIosHint) {
      localStorage.setItem('skiLabHideIosInstallHint', '1');
      setShowIosHint(false);
    } else {
      setShowIosHint(true);
    }
  };

  return (
    <motion.div
      {...SIMPLE_ANIM}
      className="w-full flex justify-center mt-4"
    >
      <div className="mt-4">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-3 py-2 text-sm">
          <img src="/ski-lab-icon.png" alt="Ski-Lab" width={28} height={28} className="rounded-full" />
          <div className="leading-tight">
            <div className="font-medium text-sm">Ski‑Lab</div>
            <div className="text-xs text-gray-500">Add to Home Screen</div>
          </div>

          <button
            onClick={toggleHint}
            className="ml-3 text-xs bg-gray-100 text-gray-800 rounded-full px-3 py-1 hover:bg-gray-200"
            aria-expanded={showIosHint}
          >
            {showIosHint ? 'Close' : 'How'}
          </button>
        </div>

        {isIos && showIosHint && (
          <div className="mt-2 bg-white text-xs text-gray-700 rounded-md px-3 py-2 shadow-sm border border-gray-100 max-w-xs">
            In Safari: tap Share → Add to Home Screen.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InstallCard;