import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

export function useEventProductTests(teamId, eventId) {
  const [productTests, setProductTests] = useState([]);
  const [loading, setLoading] = useState(!!(teamId && eventId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !eventId) {
      setProductTests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = collection(db, 'teams', teamId, 'events', eventId, 'productTests');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ta = a.timestamp?.seconds || 0;
            const tb = b.timestamp?.seconds || 0;
            return tb - ta;
          });
        setProductTests(rows);
        setLoading(false);
      },
      (err) => {
        console.error('useEventProductTests error', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId, eventId]);

  return { productTests, loading, error };
}

export default useEventProductTests;
