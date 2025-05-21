import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

const useTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTeams(fetched);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching teams:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { teams, loading, error };
};

export default useTeams;
