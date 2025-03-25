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
      setSki(null);
      setLoading(false);
      return;
    }
    const fetchSki = async () => {
      setLoading(true);
      try {
        const data = await getUserSki(user.uid, skiId);
        if (data) {
          setSki(data);
        } else {
          setError(new Error('Ski not found'));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSki();
  }, [user, skiId]);

  return { ski, loading, error };
};
