import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

export function useTeamAggregatedResults(teamId) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(!!teamId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    const eventsRef = collection(db, 'teams', teamId, 'events');
    const unsubEvents = onSnapshot(
      eventsRef,
      (eventsSnap) => {
        // NEW: handle teams with no events → no analytics
        if (eventsSnap.empty) {
          setResults([]);
          setLoading(false);
          return;
        }

        const unsubs = [];
        const all = [];
        eventsSnap.docs.forEach((evtDoc) => {
          const evtId = evtDoc.id;
          const trRef = collection(db, 'teams', teamId, 'events', evtId, 'testResults');
          const unsub = onSnapshot(
            trRef,
            (trSnap) => {
              const combined = trSnap.docs.map((d) => ({
                id: d.id,
                eventId: evtId,
                ...d.data(),
              }));
              // Merge by event each callback; we accumulate per eventId
              // Simplest approach: re-collect across all current listeners
              // We push into a temp store and debounce by microtask
              all.push({ evtId, data: combined });
              Promise.resolve().then(() => {
                // latest snapshot of all listeners: flatten last data for each evtId
                const byEvent = new Map();
                all.forEach(({ evtId, data }) => byEvent.set(evtId, data));
                const merged = Array.from(byEvent.values()).flat();
                setResults(
                  merged.sort((a, b) => {
                    const ta = a.timestamp?.seconds || 0;
                    const tb = b.timestamp?.seconds || 0;
                    return tb - ta;
                  })
                );
                setLoading(false);
              });
            },
            (err) => {
              console.error('team aggregated results err', err);
              setError(err);
              setLoading(false);
            }
          );
          unsubs.push(unsub);
        });

        return () => unsubs.forEach((u) => u && u());
      },
      (err) => {
        console.error('team events listener err', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubEvents();
  }, [teamId]);

  return { results, loading, error };
}

export default useTeamAggregatedResults;