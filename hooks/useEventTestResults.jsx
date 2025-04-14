// src/hooks/useEventTestResults.js
import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Custom hook for subscribing to test results at teams/{teamId}/events/{eventId}/testResults.
 */
export function useEventTestResults(teamId, eventId) {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !eventId) {
      setLoading(false);
      return;
    }

    const testResultsRef = collection(db, 'teams', teamId, 'events', eventId, 'testResults');
    const unsubscribe = onSnapshot(
      testResultsRef,
      (snapshot) => {
        const results = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const timeA = a.timestamp?.seconds || 0;
            const timeB = b.timestamp?.seconds || 0;
            return timeB - timeA;
          });
        setTestResults(results);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to event test results:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [teamId, eventId]);

  return { testResults, loading, error };
}
