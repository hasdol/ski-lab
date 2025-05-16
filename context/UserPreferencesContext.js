'use client';
import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const UserPreferencesContext = createContext();

/**
 * Only gloveMode is left.  The language toggle & i18n changes are gone.
 */
export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [gloveMode, setGloveMode] = useState(false);

  /* Light-theme enforcement stays */
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const storedGlove = localStorage.getItem('gloveMode');
    if (storedGlove) setGloveMode(storedGlove === 'true');
  }, []);

  /* Keep syncing gloveMode with Firestore */
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, snap => {
      const pref = snap.data()?.preferences?.gloveModePreference ?? false;
      setGloveMode(pref);
      localStorage.setItem('gloveMode', pref);
    });
    return () => unsub();
  }, [user]);

  const toggleGloveMode = async () => {
    const next = !gloveMode;
    setGloveMode(next);
    localStorage.setItem('gloveMode', next);
    if (user) {
      await setDoc(
        doc(db, 'users', user.uid),
        { preferences: { gloveModePreference: next } },
        { merge: true }
      );
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{ gloveMode, setGloveMode: toggleGloveMode, colormode: 'light' }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};
