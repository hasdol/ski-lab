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
import { db } from '@/lib/firebase/firebaseConfig';
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
export default function usePaginatedResults({
  term = '',
  temp = [-100, 100],
  style = 'all',
  sortOrder = 'desc',
  ownerUserId = null,
}) {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(false);
  const cursor = useRef(null);

  // Use the primitive userId instead of the whole user object to keep deps stable
  const effectiveUid = ownerUserId || user?.uid || null;

  // Always use English keywords field
  const keywordField = 'keywords_en';

  // Build the base Firestore query
  const baseQuery = useCallback(() => {
    if (!effectiveUid) return null;
    const col = collection(db, `users/${effectiveUid}/testResults`);
    // Inside baseQuery construction logic:
    if (term && term.length >= MIN_CHARS) {
      // Split search term into components
      const searchComponents = term
        .toLowerCase()
        .split(/[\s_]+/) // Split on both spaces and underscores
        .filter(t => t.length >= MIN_CHARS);

      if (searchComponents.length > 0) {
        return query(
          col,
          where(keywordField, 'array-contains-any', searchComponents),
          orderBy('timestamp', sortOrder),
          limit(PAGE),
        );
      }
    }
    return query(col, orderBy('timestamp', sortOrder), limit(PAGE));
  }, [effectiveUid, term, sortOrder]);

  // Break temp into primitives so deps are stable
  const temp0 = temp?.[0];
  const temp1 = temp?.[1];

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
        d.temperature >= temp0 &&
        d.temperature <= temp1
      );

      setDocs(filtered);
      if (snap.docs.length < PAGE) setExhausted(true);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, style, temp0, temp1]);

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
        d.temperature >= temp0 &&
        d.temperature <= temp1
      );

      setDocs(prev => [...prev, ...filtered]);
      if (snap.docs.length < PAGE) setExhausted(true);
    } catch (err) {
      console.error('Error loading more results:', err);
    }
  }, [baseQuery, exhausted, style, temp0, temp1]);

  useEffect(() => { refresh(); }, [baseQuery, style, temp0, temp1]);

  return { docs, loadMore, exhausted, loading, refresh };
};
