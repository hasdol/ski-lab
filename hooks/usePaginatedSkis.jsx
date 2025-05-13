// src/hooks/usePaginatedSkis.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';
import i18n from '@/lib/i18n/i18n';

const PAGE_SIZE = 32;
const MIN_CHARS = 2;

/**
 * Hook for paginated, prefix-searchable skis list.
 * @param {object} params
 * @param {string} params.term - search prefix
 * @param {string} params.style - style filter
 * @param {string} params.skiType - skiType filter
 * @param {string} params.archived - 'all'|'archived'|'notArchived'
 * @param {string} params.sortField
 * @param {string} params.sortDirection
 */
export default function usePaginatedSkis({
  term = '',
  style = 'all',
  skiType = 'all',
  archived = 'notArchived',
  sortField = 'serialNumber',
  sortDirection = 'asc',
}) {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const cursor = useRef(null);

  // determine keyword field based on locale
  const keywordField = i18n.language.startsWith('no') ? 'keywords_no' : 'keywords_en';

  // build the base Firestore query
  const buildBaseQuery = useCallback(() => {
    if (!user) return null;
    const colRef = collection(db, `users/${user.uid}/skis`);
    let q = term.length >= MIN_CHARS
      ? query(colRef, where(keywordField, 'array-contains', term))
      : query(colRef);
    q = query(q, orderBy(sortField, sortDirection), limit(PAGE_SIZE));
    return q;
  }, [user, term, keywordField, sortField, sortDirection]);

  // fetch first page
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExhausted(false);
    cursor.current = null;

    const q = buildBaseQuery();
    if (!q) {
      setDocs([]);
      setLoading(false);
      return;
    }

    try {
      const snap = await getDocs(q);
      const page = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cursor.current = snap.docs[snap.docs.length - 1] || null;

      // apply client-side filters
      const filtered = page.filter(d =>
        (style === 'all' || d.style === style) &&
        (skiType === 'all' || d.skiType === skiType) &&
        (
          archived === 'all' ||
          (archived === 'archived' && d.archived) ||
          (archived === 'notArchived' && !d.archived)
        )
      );
      setDocs(filtered);
      if (snap.docs.length < PAGE_SIZE) setExhausted(true);
    } catch (err) {
      console.error('Error fetching skis:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buildBaseQuery, style, skiType, archived]);

  // fetch next page
  const loadMore = useCallback(async () => {
    if (exhausted || !cursor.current) return;
    const nextQ = query(buildBaseQuery(), startAfter(cursor.current));
    try {
      const snap = await getDocs(nextQ);
      const page = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cursor.current = snap.docs[snap.docs.length - 1] || cursor.current;

      const filtered = page.filter(d =>
        (style === 'all' || d.style === style) &&
        (skiType === 'all' || d.skiType === skiType) &&
        (
          archived === 'all' ||
          (archived === 'archived' && d.archived) ||
          (archived === 'notArchived' && !d.archived)
        )
      );
      setDocs(prev => [...prev, ...filtered]);
      if (snap.docs.length < PAGE_SIZE) setExhausted(true);
    } catch (err) {
      console.error('Error loading more skis:', err);
    }
  }, [buildBaseQuery, exhausted, style, skiType, archived]);

  // auto-refresh on dependency changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { docs, loading, error, exhausted, refresh, loadMore };
}
