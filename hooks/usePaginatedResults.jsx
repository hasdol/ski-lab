'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  startAfter,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

const PAGE = 10;
const MIN_CHARS = 3;

/**
 * Hook for paginated, prefix-searchable test results.
 * @param {object} params
 * @param {string} params.term - search prefix
 * @param {[number,number]} params.temp - temperature range
 * @param {string} params.style - style filter
 * @param {string} params.sortOrder - 'asc' or 'desc'
 */
const usePaginatedResults = ({ term = '', temp = [-100, 100], style = 'all', sortOrder = 'desc' }) => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(false);
  const cursor = useRef(null);

  // Always use English keywords field
  const keywordField = 'keywords_en';

  // Build the base Firestore query
  const baseQuery = useCallback(() => {
    if (!user) return null;
    const col = collection(db, `users/${user.uid}/testResults`);
    if (term && term.length >= MIN_CHARS) {
      return query(
        col,
        where(keywordField, 'array-contains', term),
        orderBy('timestamp', sortOrder),
        limit(PAGE),
      );
    }
    return query(col, orderBy('timestamp', sortOrder), limit(PAGE));
  }, [user, term, sortOrder]);

  // Fetch first page
  const refresh = useCallback(async () => {
    setLoading(true);
    setExhausted(false);
    cursor.current = null;

    const q = baseQuery();
    if (!q) {
      setDocs([]);
      setLoading(false);
      setExhausted(true);
      return;
    }

    try {
      const snap = await getDocs(q);
      const page = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cursor.current = snap.docs.at(-1) || null;

      const filtered = page.filter(d =>
        (style === 'all' || d.style === style) &&
        d.temperature >= temp[0] &&
        d.temperature <= temp[1]
      );

      setDocs(filtered);
      if (snap.docs.length < PAGE) setExhausted(true);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, style, temp]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (exhausted || !cursor.current) return;
    const q = query(baseQuery(), startAfter(cursor.current));
    try {
      const snap = await getDocs(q);
      const page = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cursor.current = snap.docs.at(-1) || cursor.current;

      const filtered = page.filter(d =>
        (style === 'all' || d.style === style) &&
        d.temperature >= temp[0] &&
        d.temperature <= temp[1]
      );

      setDocs(prev => [...prev, ...filtered]);
      if (snap.docs.length < PAGE) setExhausted(true);
    } catch (err) {
      console.error('Error loading more results:', err);
    }
  }, [baseQuery, exhausted, style, temp]);

  useEffect(() => { refresh(); }, [refresh]);

  return { docs, loadMore, exhausted, loading, refresh };
};

export default usePaginatedResults;
