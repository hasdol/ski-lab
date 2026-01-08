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

export default function usePaginatedSkis({
  term = '',
  style = 'all',
  skiType = 'all',
  archived = 'notArchived',
  sortField = 'serialNumber',
  sortDirection = 'asc',
  ownerUserId = null,
  includeLocked = false, // NEW (defaults to secure behavior)
}) {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const cursor = useRef(null);

  const keywordField = 'keywords_en';
  const effectiveUid = ownerUserId || user?.uid || null; // NEW
  const isRemoteView = !!effectiveUid && !!user?.uid && effectiveUid !== user.uid;

  const buildBaseQuery = useCallback(() => {
    if (!effectiveUid) return null;

    const colRef = collection(db, `users/${effectiveUid}/skis`);

    // Start query (optionally with keyword search)
    let baseQuery =
      term.length >= MIN_CHARS
        ? query(colRef, where(keywordField, 'array-contains', term))
        : query(colRef);

    // NOTE:
    // - For remote/shared views: Firestore rules deny reading locked skis, so we must
    //   constrain the query to `locked == false` to avoid permission-denied.
    // - For own inventory: allow docs that don't yet have `locked` set (treat as unlocked)
    //   and filter out `locked === true` client-side.
    if (!includeLocked && isRemoteView) {
      baseQuery = query(baseQuery, where('locked', '==', false));
    }

    // apply style and skiType filters
    if (style !== 'all') {
      baseQuery = query(baseQuery, where('style', '==', style));
    }
    if (skiType !== 'all') {
      baseQuery = query(baseQuery, where('skiType', '==', skiType));
    }

    // archived filter
    if (archived !== 'all') {
      const archivedValue = archived === 'archived';
      baseQuery = query(baseQuery, where('archived', '==', archivedValue));
    }

    return query(baseQuery, orderBy(sortField, sortDirection), limit(PAGE_SIZE));
  }, [
    effectiveUid,
    term,
    style,
    skiType,
    archived,
    sortField,
    sortDirection,
    includeLocked,
    isRemoteView,
  ]);

  const fetchPage = useCallback(async (startAfterDoc = null) => {
    let accumulated = [];
    let localCursor = startAfterDoc;
    let localExhausted = false;

    while (accumulated.length < PAGE_SIZE && !localExhausted) {
      const baseQuery = buildBaseQuery();
      if (!baseQuery) break;

      const q = localCursor ? query(baseQuery, startAfter(localCursor)) : baseQuery;
      const snap = await getDocs(q);
      if (snap.empty) {
        localExhausted = true;
        break;
      }

      let pageDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // For own inventory, treat missing `locked` as unlocked.
      if (!includeLocked && !isRemoteView) {
        pageDocs = pageDocs.filter(d => d.locked !== true);
      }
      accumulated = accumulated.concat(pageDocs);
      if (snap.docs.length < PAGE_SIZE) localExhausted = true;
      localCursor = snap.docs[snap.docs.length - 1];
    }

    return { docs: accumulated, cursor: localCursor, exhausted: localExhausted };
  }, [buildBaseQuery]);

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

  const loadMore = useCallback(async () => {
    if (exhausted || !cursor.current) return;
    try {
      const { docs: newDocs, cursor: newCursor, exhausted: isExhausted } = await fetchPage(cursor.current);
      setDocs(prev => prev.concat(newDocs));
      cursor.current = newCursor;
      setExhausted(isExhausted);
    } catch (err) {
      console.error('Error fetching skis:', err);
      setError(err);
    }
  }, [exhausted, fetchPage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // client-side filters maintained (...existing code...) remain unchanged

  return { docs, loading, error, exhausted, refresh, loadMore };
}