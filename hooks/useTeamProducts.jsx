import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

export function useTeamProducts(teamId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = collection(db, 'teams', teamId, 'products');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const ab = `${a.brand || ''} ${a.name || ''}`.trim();
            const bb = `${b.brand || ''} ${b.name || ''}`.trim();
            return ab.localeCompare(bb);
          });
        setProducts(rows);
        setLoading(false);
      },
      (err) => {
        console.error('useTeamProducts error', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId]);

  return { products, loading, error };
}

export default useTeamProducts;
