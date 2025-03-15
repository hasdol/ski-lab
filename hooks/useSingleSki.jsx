// hooks/useSingleSki.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

export const useSingleSki = (skiId) => {
    const [ski, setSki] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !skiId) {
            setSki(null);
            setLoading(false);
            return;
        }

        const fetchSki = async () => {
            setLoading(true);
            try {
                const skiDocRef = doc(db, `users/${user.uid}/skis`, skiId);
                const skiSnap = await getDoc(skiDocRef);
                if (skiSnap.exists()) {
                    setSki({ id: skiSnap.id, ...skiSnap.data() });
                } else {
                    setError(new Error('Ski not found'));
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSki();
    }, [user, skiId]);

    return { ski, loading, error };
};
