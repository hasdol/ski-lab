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

const PAGE_SIZE = 32; // Change this value to test different page limits (e.g. 3)
const MIN_CHARS = 2;

/**
 * Hook for paginated, prefix-searchable skis list.
 * Server-side filtering:
 *   - Archived status and keyword (if term is long enough)
 * Client-side filtering:
 *   - style and skiType
 *
 * @param {object} params
 * @param {string} params.term - search prefix
 * @param {string} params.style - style filter (client-side)
 * @param {string} params.skiType - skiType filter (client-side)
 * @param {string} params.archived - 'all'|'archived'|'notArchived' (server-side, default notArchived)
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

  const keywordField = 'keywords_en';

  // Build a Firestore query that applies the server-side filters: keyword and archived.
  const buildBaseQuery = useCallback(() => {
    if (!user) return null;
    const colRef = collection(db, `users/${user.uid}/skis`);
    let baseQuery = term.length >= MIN_CHARS
      ? query(colRef, where(keywordField, 'array-contains', term))
      : query(colRef);
    if (archived !== 'all') {
      const archivedValue = archived === 'archived';
      baseQuery = query(baseQuery, where('archived', '==', archivedValue));
    }
    return query(baseQuery, orderBy(sortField, sortDirection), limit(PAGE_SIZE));
  }, [user, term, archived, sortField, sortDirection]);

  // Helper: Fetch documents until we accumulate at least PAGE_SIZE visible docs (after client filtering) or run out.
  const fetchPage = useCallback(async (startAfterDoc = null) => {
    let accumulated = [];
    let localCursor = startAfterDoc;
    let localExhausted = false;

    while (accumulated.length < PAGE_SIZE && !localExhausted) {
      const baseQuery = buildBaseQuery();
      if (!baseQuery) break;
      const paginatedQuery = localCursor ? query(baseQuery, startAfter(localCursor)) : baseQuery;
      const snap = await getDocs(paginatedQuery);
      if (snap.empty) {
        localExhausted = true;
        break;
      }
      localCursor = snap.docs[snap.docs.length - 1] || localCursor;
      const docsPage = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side filter: locked, style and skiType
      const visible = docsPage.filter(doc =>
        (doc.locked !== true) && // exclude locked skis
        (style === 'all' || doc.style === style) &&
        (skiType === 'all' || doc.skiType === skiType)
      );
      accumulated = accumulated.concat(visible);
      if (snap.docs.length < PAGE_SIZE) {
        localExhausted = true;
      }
    }

    // Extra check: if we fetched PAGE_SIZE docs and we have a valid cursor, see if there's an extra document.
    if (!localExhausted && localCursor) {
      const baseQuery = buildBaseQuery();
      if (baseQuery) {
        const extraQuery = query(baseQuery, startAfter(localCursor), limit(1));
        const extraSnap = await getDocs(extraQuery);
        if (extraSnap.empty) {
          localExhausted = true;
        }
      }
    }

    return { docs: accumulated, cursor: localCursor, exhausted: localExhausted };
  }, [buildBaseQuery, style, skiType]);

  // Fetch first page
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExhausted(false);
    cursor.current = null;
    try {
      const { docs: newDocs, cursor: newCursor, exhausted: isExhausted } = await fetchPage(null);
      setDocs(newDocs);
      cursor.current = newCursor;
      setExhausted(isExhausted);
    } catch (err) {
      console.error('Error fetching skis:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  // Fetch next page
  const loadMore = useCallback(async () => {
    if (exhausted || !cursor.current) return;
    try {
      const { docs: newDocs, cursor: newCursor, exhausted: isExhausted } = await fetchPage(cursor.current);
      setDocs(prev => [...prev, ...newDocs]);
      cursor.current = newCursor;
      setExhausted(isExhausted);
    } catch (err) {
      console.error('Error loading more skis:', err);
    }
  }, [exhausted, fetchPage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { docs, loading, error, exhausted, refresh, loadMore };
}