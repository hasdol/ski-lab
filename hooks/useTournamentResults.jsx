// src/hooks/useTournamentResults.js
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';
import { updateTournamentResult, deleteTournamentAndRelatedRankings } from '@/lib/firebase/firestoreFunctions';


const useTournamentResults = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const resultsCollectionRef = collection(db, `users/${user.uid}/testResults`);
        const q = query(resultsCollectionRef, orderBy("timestamp", "desc"));

        // Set up the real-time listener
        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const fetchedResults = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Sort rankings by score before setting the state
                    if (data.rankings && data.rankings.length) {
                        data.rankings.sort((a, b) => a.score - b.score);
                    }
                    return { id: doc.id, ...data };
                });
                setResults(fetchedResults);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching tournament results:', err);
                setError(err);
                setLoading(false);
            }
        );

        // Clean up the listener on unmount or when user changes
        return () => unsubscribe();
    }, [user]);

    const addTournamentResult = async (tournamentData) => {
        if (!user) {
            console.error('User not authenticated');
            return;
        }

        try {
            await addDoc(collection(db, `users/${user.uid}/testResults`), {
                ...tournamentData,
                timestamp: new Date()
            });
            // No need to manually update `results` since the listener will handle it
        } catch (error) {
            console.error("Error adding tournament result: ", error);
            setError(error);
        }
    };

    const deleteResult = async (userId, resultId) => {
        setLoading(true);
        try {
            await deleteTournamentAndRelatedRankings(userId, resultId);
            // No need to manually update `results` since the listener will handle it
        } catch (error) {
            console.error("Error deleting tournament result:", error);
            setError(error);
        } finally {
            setLoading(false);
        }
    };

    const updateResult = async (resultId, updatedData) => {
        try {
            await updateTournamentResult(user.uid, resultId, updatedData);
            // No need to manually update `results` since the listener will handle it
        } catch (error) {
            console.error("Error updating tournament result:", error);
            setError(error);
        }
    };

    return { results, loading, error, addTournamentResult, deleteResult, updateResult };
};

export default useTournamentResults;
