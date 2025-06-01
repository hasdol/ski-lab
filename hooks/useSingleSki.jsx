// src/hooks/useSingleSki.js
import { useState, useEffect } from 'react';
import { getUserSki } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

export const useSingleSki = (skiId) => {
  const [ski, setSki] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !skiId) {
      setLoading(false);
      return;
    }
    
    const fetchSki = async () => {
      setLoading(true);
      try {
        const data = await getUserSki(user.uid, skiId);
        setSki(data || null); // Set to null if not found
        setError(null);
      } catch (err) {
        setError(err);
        setSki(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSki();
  }, [user, skiId]);

  return { ski, loading, error };
};