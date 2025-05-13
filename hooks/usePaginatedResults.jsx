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
import i18n from '@/lib/i18n/i18n';

const PAGE = 10;
const MIN_CHARS = 3;

const usePaginatedResults = ({ term = '', temp = [-100, 100], style = 'all', sortOrder = 'desc' }) => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(false);
  const cursor = useRef(null);

  // decide which keyword array to search in
  const keywordField = i18n.language.startsWith('no') ? 'keywords_no' : 'keywords_en';

  /**
   * Build the Firestore query: keyword search via `array-contains`.
   */
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
  }, [user, term, sortOrder, keywordField]);

  /** Fetch first page */
  const refresh = useCallback(async () => {
    setLoading(true);
    setExhausted(false);
    cursor.current = null;

    const q = baseQuery();
    if (!q) return setDocs([]);

    const snap = await getDocs(q);
    const page = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cursor.current = snap.docs.at(-1) ?? null;

    setDocs(page.filter((d) =>
      (style === 'all' || d.style === style) &&
      d.temperature >= temp[0] &&
      d.temperature <= temp[1],
    ));
    setLoading(false);
    if (snap.docs.length < PAGE) setExhausted(true);
  }, [baseQuery, style, temp]);

  /** Load next page */
  const loadMore = useCallback(async () => {
    if (exhausted || !cursor.current) return;
    const q = query(baseQuery(), startAfter(cursor.current));
    const snap = await getDocs(q);
    const page = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cursor.current = snap.docs.at(-1) ?? cursor.current;

    setDocs((prev) => [
      ...prev,
      ...page.filter((d) =>
        (style === 'all' || d.style === style) &&
        d.temperature >= temp[0] &&
        d.temperature <= temp[1],
      ),
    ]);
    if (snap.docs.length < PAGE) setExhausted(true);
  }, [baseQuery, exhausted, style, temp]);

  useEffect(() => { refresh(); }, [refresh]);

  return { docs, loadMore, exhausted, loading, refresh };
};

export default usePaginatedResults;