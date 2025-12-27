'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const SIMPLE_ANIM = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
};

const InstallCard = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Holds the deferred install prompt event (Chrome/Edge/Android etc.)
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const ua = window.navigator.userAgent || '';
    const isi =
      /iphone|ipad|ipod/i.test(ua) &&
      !window.matchMedia('(display-mode: standalone)').matches;

    setIsIos(isi);
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
    window.addEventListener('visibilitychange', checkStandalone);

    return () => {
      window.removeEventListener('resize', checkStandalone);
      window.removeEventListener('visibilitychange', checkStandalone);
    };
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e) => {
      // Needed so we can trigger it from our own button
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const shouldRender = useMemo(() => {
    if (installed) return false;
    if (isStandalone) return false;
    // Render always when not installed:
    // - iOS: show how-to text
    // - Desktop/Android: show Install button (disabled until prompt exists)
    return true;
  }, [installed, isStandalone]);

  if (!shouldRender) return null;

  const onInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      const dp = deferredPrompt;
      setDeferredPrompt(null);
      await dp.prompt();
      await dp.userChoice?.catch?.(() => null);
      // If the user installs, appinstalled will hide the card.
      // If they dismiss, the next eligible `beforeinstallprompt` will re-enable it.
    } catch {
      // no-op (button will remain disabled until event is available again)
    }
  };

  return (
    <motion.div {...SIMPLE_ANIM} className="w-full flex justify-center">
      <div className="">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-3 py-2 text-sm">
          <img
            src="/ski-lab-icon.png"
            alt="Ski-Lab"
            width={28}
            height={28}
            className="rounded-full"
          />
          <div className="leading-tight">
            <div className="font-medium text-sm">Ski‑Lab</div>
            <div className="text-xs text-gray-500">Add to Home Screen</div>
          </div>

          {!isIos && (
            <button
              onClick={onInstallClick}
              disabled={!deferredPrompt}
              className={`ml-3 text-xs rounded-full px-3 py-1 ${
                deferredPrompt
                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
              title={deferredPrompt ? 'Install' : 'Install not available yet'}
            >
              Install
            </button>
          )}
        </div>

        {isIos && (
          <div className="mt-2 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-full px-3 py-2 text-xs text-gray-600 max-w-xs">
              In Safari: tap Share → Add to Home Screen.
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InstallCard;