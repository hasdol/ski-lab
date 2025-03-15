// hooks/useLockedSkis.js
import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const useLockedSkis = () => {
    const [lockedSkis, setLockedSkis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setLockedSkis([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const skisRef = collection(db, `users/${user.uid}/skis`);
        const lockedSkisQuery = query(skisRef, where("locked", "==", true), orderBy("dateAdded", "desc"));

        const unsubscribe = onSnapshot(lockedSkisQuery, (snapshot) => {
            const fetchedLockedSkis = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLockedSkis(fetchedLockedSkis);
            setLoading(false);
        }, (err) => {
            setError(err);
            setLoading(false);
        });

        // Cleanup listener on unmount or when dependencies change
        return () => unsubscribe();
    }, [user]);

    const deleteLockedSki = async (skiId) => {
        if (!user) return;
        try {
            const skiDocRef = doc(db, `users/${user.uid}/skis`, skiId);
            await deleteDoc(skiDocRef);
        } catch (err) {
            setError(err);
        }
    };

    return { lockedSkis, loading, error, deleteLockedSki };
};
