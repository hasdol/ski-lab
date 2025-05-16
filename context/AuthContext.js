'use client';
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // For Firestore data
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingStatus(false);

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnapshot) => {
          setUserData(docSnapshot.data());
        });
        return unsubscribeUser;
      } else {
        setUserData(null);
      }
    });

    return unsubscribeAuth;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, checkingStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
