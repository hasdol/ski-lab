// src/hooks/useSkiTests.js
import { useState, useEffect } from 'react';
import { getTestsForSki } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

const useSkiTests = (skiId, ownerUserId) => {
  const { user } = useAuth();
  const effectiveUid = ownerUserId || user?.uid;
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!effectiveUid || !skiId) return;
    setLoading(true);
    const fetchTests = async () => {
      try {
        const fetchedTests = await getTestsForSki(effectiveUid, skiId);
        setTests(fetchedTests);
      } catch (err) {
        console.error('Error fetching ski tests:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [effectiveUid, skiId]);

  return { tests, loading, error };
};

export default useSkiTests;
