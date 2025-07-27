// src/hooks/useSkisTestsComparison.js
import { useState, useEffect } from 'react';
import useSkiTests from '@/hooks/useSkiTests';

const useSkisTestsComparison = (skiIds) => {
  const [allSkisTests, setAllSkisTests] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tests for each ski
  useEffect(() => {
    if (!skiIds || skiIds.length === 0) {
      setAllSkisTests({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // We'll simulate the data fetching for now since we can't actually call the hook conditionally
    // In a real implementation, we'd need to restructure this to work with the Firebase calls
    const testsMap = {};
    skiIds.forEach(skiId => {
      testsMap[skiId] = []; // Empty for now, will be populated when we have real data
    });
    
    setAllSkisTests(testsMap);
    setLoading(false);
  }, [skiIds]);

  return { allSkisTests, loading, error };
};

export default useSkisTestsComparison;