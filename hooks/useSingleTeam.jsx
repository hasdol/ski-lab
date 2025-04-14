// src/hooks/useSingleTeam.js
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

const useSingleTeam = (teamId) => {
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;

    setLoading(true);

    // Fetch team data once
    const teamRef = doc(db, 'teams', teamId);
    getDoc(teamRef)
      .then((snap) => {
        if (snap.exists()) {
          setTeam({ id: snap.id, ...snap.data() });
        }
      })
      .catch((err) => {
        console.error('Error fetching team data:', err);
        setError(err);
      });

    // Subscribe to events
    const eventsRef = collection(db, 'teams', teamId, 'events');
    const unsub = onSnapshot(
      eventsRef,
      (snapshot) => {
        const evts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEvents(evts);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching events:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId]);

  return { team, events, loading, error };
};

export default useSingleTeam;
