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

  const addTournamentResult = async (tournamentData, additionalData = {}) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }
    try {
      await addTestResult(user.uid, tournamentData, additionalData);
    } catch (error) {
      console.error("Error adding tournament result: ", error);
      setError(error);
    }
  };

  const deleteResult = async (resultId) => {
    if (!user) return;
    setLoading(true);
    try {
      await deleteTournamentAndRelatedRankings(user.uid, resultId);
    } catch (error) {
      console.error("Error deleting tournament result:", error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateResult = async (resultId, updatedData) => {
    if (!user) return;
    try {
      await updateTournamentResult(user.uid, resultId, updatedData);
    } catch (error) {
      console.error("Error updating tournament result:", error);
      setError(error);
    }
  };

  return { results, loading, error, addTournamentResult, deleteResult, updateResult };
};

export default useTournamentResults;
