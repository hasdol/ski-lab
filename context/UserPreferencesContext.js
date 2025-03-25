import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config'; 
import i18n from '../lib/i18n/i18n';

export const UserPreferencesContext = createContext();

export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [english, setEnglish] = useState(true);
  // Remove colormode state – always use light theme.
  const colormode = 'light';
  const [gloveMode, setGloveMode] = useState(false);

  // On load, ensure we use the light theme.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    const storedGloveMode = localStorage.getItem('gloveMode');
    if (storedGloveMode) {
      setGloveMode(storedGloveMode === 'true');
    }
  }, []);

  // Fetch preferences from Firestore if user is logged in
  useEffect(() => {
    if (user) {
      const userPreferencesRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userPreferencesRef, (doc) => {
        const data = doc.data();
        if (data && data.preferences) {
          const { languagePreference, gloveModePreference } = data.preferences;
          
          setEnglish(languagePreference === 'en');
          i18n.changeLanguage(languagePreference);

          const newGloveMode = gloveModePreference || false;
          setGloveMode(newGloveMode);
          localStorage.setItem('gloveMode', newGloveMode);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const toggleEnglish = async () => {
    const newLanguage = english ? 'no' : 'en';
    setEnglish(!english);
    i18n.changeLanguage(newLanguage);
    if (user) {
      try {
        const userPreferencesRef = doc(db, 'users', user.uid);
        await setDoc(userPreferencesRef, {
          preferences: {
            languagePreference: newLanguage
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error setting language preference: ", error);
        alert("Failed to update language preference. Please try again.");
      }
    }
  };

  const toggleGloveMode = async () => {
    const newGloveMode = !gloveMode;
    setGloveMode(newGloveMode);
    localStorage.setItem('gloveMode', newGloveMode);
    if (user) {
      try {
        const userPreferencesRef = doc(db, 'users', user.uid);
        await setDoc(userPreferencesRef, {
          preferences: {
            gloveModePreference: newGloveMode
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error setting glove mode preference: ", error);
        alert("Failed to update glove mode. Please try again.");
      }
    }
  };

  return (
    <UserPreferencesContext.Provider value={{ 
      english, 
      setEnglish: toggleEnglish, 
      colormode, // Always light.
      gloveMode,
      setGloveMode: toggleGloveMode
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
