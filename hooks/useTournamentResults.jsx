// src/hooks/useTournamentResults.js
import { useState, useEffect } from 'react';
import { subscribeToTournamentResults, addTestResult, updateTournamentResult, deleteTournamentAndRelatedRankings } from '@/lib/firebase/firestoreFunctions';
import { useAuth } from '@/context/AuthContext';

const useTournamentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToTournamentResults(
      user.uid,
      (fetchedResults) => {
        setResults(fetchedResults);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tournament results:', err);
        setError(err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  return { results, loading, error };
};

export default useTournamentResults;
