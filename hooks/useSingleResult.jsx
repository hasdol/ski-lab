// src/hooks/useSingleResult.js
import { useState, useEffect } from 'react';
import { getTournamentResult } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

export const useSingleResult = (resultId) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !resultId) {
      setResult(null);
      setLoading(false);
      return;
    }
    const fetchResult = async () => {
      setLoading(true);
      try {
        const res = await getTournamentResult(user.uid, resultId);
        if (res) {
          setResult(res);
        } else {
          setError(new Error('Result not found'));
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [user, resultId]);

  return { result, loading, error };
};
