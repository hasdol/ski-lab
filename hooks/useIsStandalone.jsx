import { useState, useEffect } from 'react';

export default function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const mm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const navStandalone = window.navigator && window.navigator.standalone === true; // iOS
      setIsStandalone(!!(mm || navStandalone));
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('visibilitychange', check);

    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('visibilitychange', check);
    };
  }, []);

  return isStandalone;
}