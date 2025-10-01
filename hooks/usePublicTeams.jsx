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

const MIN_CHARS = 3;

const usePublicTeams = ({ pageSize = 10, term = '' } = {}) => {
  const [teams, setTeams] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeams = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const col = collection(db, 'teams');

      const searchComponents =
        term && term.length >= MIN_CHARS
          ? term
              .toLowerCase()
              .split(/[\s_]+/)
              .filter((t) => t.length >= MIN_CHARS)
          : [];

      let q = query(
        col,
        where('isPublic', '==', true),
        orderBy('memberCount', 'desc'),
        limit(pageSize)
      );

      if (searchComponents.length > 0) {
        q = query(
          col,
          where('isPublic', '==', true),
          where('keywords_en', 'array-contains-any', searchComponents),
          orderBy('memberCount', 'desc'),
          limit(pageSize)
        );
      }

      if (lastDoc && !reset) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTeams((prev) => (reset ? fetched : [...prev, ...fetched]));
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(fetched.length === pageSize);
    } catch (err) {
      console.error('Error fetching public teams:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset on first load and whenever term changes
    fetchTeams(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return {
    teams,
    loading,
    error,
    hasMore,
    fetchMore: () => fetchTeams(),
    refresh: () => fetchTeams(true),
  };
};

export default usePublicTeams;