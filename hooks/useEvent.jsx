import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const useEvent = (teamId, eventId) => {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId || !eventId) {
      setLoading(false);
      return;
    }

    const eventRef = doc(db, 'teams', teamId, 'events', eventId);
    const unsub = onSnapshot(
      eventRef,
      (snap) => {
        if (snap.exists()) {
          setEventData({ id: snap.id, ...snap.data() });
        } else {
          setEventData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching event:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId, eventId]);

  return { eventData, loading, error };
};

export default useEvent;
