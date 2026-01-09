import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

export function useTeamTestSkis(teamId) {
  const [testSkis, setTestSkis] = useState([]);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) {
      setTestSkis([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = collection(db, 'teams', teamId, 'testSkis');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.serialNumber || '').localeCompare(b.serialNumber || ''));
        setTestSkis(rows);
        setLoading(false);
      },
      (err) => {
        console.error('useTeamTestSkis error', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId]);

  return { testSkis, loading, error };
}

export default useTeamTestSkis;
