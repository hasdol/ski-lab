// src/hooks/useSingleTeam.js
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';

const useSingleTeam = (teamId) => {
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

// src/hooks/useSingleTeam.js
useEffect(() => {
  if (!teamId) return;

  setLoading(true);
  setError(null);

  // Subscribe to team data
  const teamRef = doc(db, 'teams', teamId);
  const unsubTeam = onSnapshot(
    teamRef,
    (snap) => {
      if (snap.exists()) {
        setTeam({ id: snap.id, ...snap.data() });
      } else {
        setTeam(null);
      }
    },
    (err) => {
      console.error('Error fetching team data:', err);
      setError(err);
      setLoading(false);
    }
  );


  // Subscribe to events
  const eventsRef = collection(db, 'teams', teamId, 'events');
  const unsubEvents = onSnapshot(
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

  return () => {
    unsubTeam();
    unsubEvents();
  };
}, [teamId]);

  return { team, events, loading, error };
};

export default useSingleTeam;
