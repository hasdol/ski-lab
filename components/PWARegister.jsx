// filepath: /home/haakon/Documents/GitHub/ski-lab/components/PWARegister.jsx
'use client';
import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[PWA] SW registered', reg.scope);
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New version available. Refresh to update.');
            }
          });
        });
      } catch (err) {
        console.error('SW registration failed', err);
      }
    })();
  }, []);

  return null;
}