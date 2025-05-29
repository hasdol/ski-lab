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
import { db } from '@/lib/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';

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

  // Always use English keywords field
  const keywordField = 'keywords_en';

  // Build base Firestore query with archived filter
  const buildBaseQuery = useCallback(() => {
    if (!user) return null;
    const colRef = collection(db, `users/${user.uid}/skis`);
    
    // Base conditions
    let conditions = [];
    
    // Add archived filter
    if (archived !== 'all') {
      conditions.push(where('archived', '==', archived === 'archived'));
    }
    
    // Add search term condition
    if (term.length >= MIN_CHARS) {
      conditions.push(where(keywordField, 'array-contains', term));
    }
    
    // Start with base query
    let q = query(colRef);
    
    // Add conditions if any
    if (conditions.length) {
      q = query(q, ...conditions);
    }
    
    // Add sorting and limit
    return query(q, orderBy(sortField, sortDirection), limit(PAGE_SIZE));
  }, [user, term, archived, sortField, sortDirection]);

  // Fetch first page - NO CLIENT-SIDE FILTERING
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

      setDocs(page);
      setExhausted(snap.docs.length < PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching skis:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buildBaseQuery]);

  // Fetch next page - NO CLIENT-SIDE FILTERING
  const loadMore = useCallback(async () => {
    if (exhausted || !cursor.current) return;
    const nextQ = query(buildBaseQuery(), startAfter(cursor.current));
    try {
      const snap = await getDocs(nextQ);
      const page = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      cursor.current = snap.docs[snap.docs.length - 1] || cursor.current;

      setDocs(prev => [...prev, ...page]);
      setExhausted(snap.docs.length < PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more skis:', err);
    }
  }, [buildBaseQuery, exhausted]);

  // Auto-refresh on dependency changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { docs, loading, error, exhausted, refresh, loadMore };
}
