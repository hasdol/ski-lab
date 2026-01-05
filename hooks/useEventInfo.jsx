'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

export const useEventInfo = (teamId, eventId) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !eventId) return;
    setLoading(true);
    setError(null);

    const colRef = collection(db, 'teams', teamId, 'events', eventId, 'timeline');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setEntries(items);
        setLoading(false);
      },
      (err) => {
        console.error('Event timeline subscribe error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId, eventId]);

  return { entries, loading, error };
};

export default useEventInfo;
