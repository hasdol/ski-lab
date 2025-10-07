// src/hooks/useSingleTeam.js
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

const useSingleTeam = (teamId) => {
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    const teamRef = doc(db, 'teams', teamId);

    let unsubEvents = null;

    const unsubTeam = onSnapshot(
      teamRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setTeam(data);
          // (Re)attach events listener only after team confirmed existing
          if (!unsubEvents) {
            const eventsRef = collection(db, 'teams', teamId, 'events');
            unsubEvents = onSnapshot(
              eventsRef,
              (snapshot) => {
                const evts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setEvents(evts);
                setLoading(false);
              },
              (err) => {
                console.error('Error fetching events:', err);
                setError(err);
                setLoading(false);
              }
            );
          }
        } else {
          // Team deleted: clean up events listener (rules would now fail)
          setTeam(null);
          setEvents([]);
          setLoading(false);
          if (unsubEvents) {
            unsubEvents();
            unsubEvents = null;
          }
        }
      },
      (err) => {
        console.error('Error fetching team data:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubTeam();
      if (unsubEvents) unsubEvents();
    };
  }, [teamId]);

  return { team, events, loading, error };
};

export default useSingleTeam;
