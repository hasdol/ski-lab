import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase/config'; 
import i18n from '../lib/i18n/i18n';

export const UserPreferencesContext = createContext();

export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [english, setEnglish] = useState(true);
  const [colormode, setColormode] = useState('light'); // Default to light mode
  const [gloveMode, setGloveMode] = useState(false); // Initialize gloveMode

  // Check for stored theme preference on load
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const storedGloveMode = localStorage.getItem('gloveMode');
    if (storedTheme) {
      setColormode(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      // If no user is logged in, apply light mode by default
      document.documentElement.classList.remove('dark');
      setColormode('light');
    }

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
          const { languagePreference, themePreference, gloveModePreference } = data.preferences;
          
          setEnglish(languagePreference === 'en');
          i18n.changeLanguage(languagePreference);

          // Apply the theme preference from Firestore
          const newTheme = themePreference || 'light';
          setColormode(newTheme);
          document.documentElement.classList.toggle('dark', newTheme === 'dark');

          // Update localStorage if it doesn't match Firestore preference
          const storedTheme = localStorage.getItem('theme');
          if (storedTheme !== newTheme) {
            localStorage.setItem('theme', newTheme); // Update localStorage
          }

          // Apply gloveMode preference from Firestore
          const newGloveMode = gloveModePreference || false;
          setGloveMode(newGloveMode);
          localStorage.setItem('gloveMode', newGloveMode); // Update localStorage
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

  const toggleColormode = async () => {
    const newTheme = colormode === 'light' ? 'dark' : 'light';
    setColormode(newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  
    localStorage.setItem('theme', newTheme); // Store preference locally
  
    if (user) {
      try {
        const userPreferencesRef = doc(db, 'users', user.uid);
        await setDoc(userPreferencesRef, {
          preferences: {
            themePreference: newTheme
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error setting theme preference: ", error);
        // Display a user-friendly message
        alert("Failed to update theme preference. Please try again.");
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
      colormode, 
      setColormode: toggleColormode,
      gloveMode,
      setGloveMode: toggleGloveMode
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
