// src/hooks/useLockedSkis.js
import { useState, useEffect } from 'react';
import { subscribeToLockedSkis, deleteUserSki } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

export const useLockedSkis = () => {
  const [lockedSkis, setLockedSkis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLockedSkis([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToLockedSkis(
      user.uid,
      (data) => {
        setLockedSkis(data);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const deleteLockedSki = async (skiId) => {
    if (!user) return;
    try {
      await deleteUserSki(user.uid, skiId);
    } catch (err) {
      setError(err);
    }
  };

  return { lockedSkis, loading, error, deleteLockedSki };
};
