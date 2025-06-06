import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

const usePublicTeams = (pageSize = 10) => {
  const [teams, setTeams] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeams = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      let q = query(
        collection(db, 'teams'),
        where('isPublic', '==', true),
        orderBy('memberCount', 'desc'),
        limit(pageSize)
      );
      if (lastDoc && !reset) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const fetchedTeams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTeams(prev => (reset ? fetchedTeams : [...prev, ...fetchedTeams]));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(fetchedTeams.length === pageSize);
    } catch (err) {
      console.error('Error fetching public teams:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    teams,
    loading,
    error,
    hasMore,
    fetchMore: () => fetchTeams(),
    refresh: () => fetchTeams(true)
  };
};

export default usePublicTeams;