'use client'
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
        const resultDocRef = doc(db, `users/${user.uid}/testResults`, resultId);
        const resultSnap = await getDoc(resultDocRef);
        if (resultSnap.exists()) {
          setResult({ id: resultSnap.id, ...resultSnap.data() });
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
