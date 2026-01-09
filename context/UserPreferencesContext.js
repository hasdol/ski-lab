'use client';
import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

export const UserPreferencesContext = createContext();

/**
 * User preferences stored locally and synced to Firestore when signed in.
 */
export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [gloveMode, setGloveMode] = useState(false);

  /* Light-theme enforcement stays */
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const storedGlove = localStorage.getItem('gloveMode');
    if (storedGlove) setGloveMode(storedGlove === 'true');

    // Clean up legacy language preference storage.
    localStorage.removeItem('language');
    document.documentElement.lang = 'en';
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
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          'preferences.gloveModePreference': next,
        });
      } catch (err) {
        // If rules deny the write, keep local state and don't break the UI.
        if (err?.code !== 'permission-denied') throw err;
        console.warn('Preference write denied (gloveModePreference). Using local-only.');
      }
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        gloveMode,
        setGloveMode: toggleGloveMode,
        colormode: 'light',
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};
