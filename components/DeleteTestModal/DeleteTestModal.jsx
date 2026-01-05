'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import Button from '../ui/Button';
import Spinner from '../common/Spinner/Spinner';
import { db } from '@/lib/firebase/firebaseConfig';

function keyFor(teamId, eventId) {
  return `${teamId}::${eventId}`;
}

export default function DeleteTestModal({
  isOpen,
  onClose,
  onConfirm,
  userId,
  testId,
  currentTeamId,
  currentEventId,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPrivate, setHasPrivate] = useState(false);
  const [eventLocations, setEventLocations] = useState([]); // [{ teamId, eventId, teamName?, eventName?, isCurrent? }]

  const [deletePrivate, setDeletePrivate] = useState(false);
  const [selectedEventKeys, setSelectedEventKeys] = useState(() => new Set());

  const hasCurrentEventContext = !!(currentTeamId && currentEventId);

  useEffect(() => {
    if (!isOpen) return;
    if (!testId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        let privateExists = false;
        let sharedIn = [];

        if (userId) {
          const privateRef = doc(db, `users/${userId}/testResults/${testId}`);
          const privateSnap = await getDoc(privateRef);
          if (privateSnap.exists()) {
            privateExists = true;
            const data = privateSnap.data() || {};
            sharedIn = Array.isArray(data.sharedIn) ? data.sharedIn : [];
          }
        }

        const map = new Map();
        for (const loc of sharedIn) {
          if (!loc?.teamId || !loc?.eventId) continue;
          const k = keyFor(loc.teamId, loc.eventId);
          map.set(k, { teamId: loc.teamId, eventId: loc.eventId, isCurrent: false });
        }

        if (hasCurrentEventContext) {
          const k = keyFor(currentTeamId, currentEventId);
          const existing = map.get(k);
          map.set(k, { ...(existing || { teamId: currentTeamId, eventId: currentEventId }), isCurrent: true });
        }

        const locs = Array.from(map.values());

        // Try to hydrate names (best-effort; fall back to ids)
        const withNames = await Promise.all(
          locs.map(async (loc) => {
            try {
              const [teamSnap, eventSnap] = await Promise.all([
                getDoc(doc(db, 'teams', loc.teamId)),
                getDoc(doc(db, 'teams', loc.teamId, 'events', loc.eventId)),
              ]);
              return {
                ...loc,
                teamName: teamSnap.exists() ? (teamSnap.data()?.name || null) : null,
                eventName: eventSnap.exists() ? (eventSnap.data()?.name || null) : null,
              };
            } catch {
              return loc;
            }
          })
        );

        if (cancelled) return;
        setHasPrivate(privateExists);
        setEventLocations(withNames);

        // Defaults: preserve the old behavior (delete from current location only)
        if (hasCurrentEventContext) {
          setDeletePrivate(false);
          setSelectedEventKeys(new Set([keyFor(currentTeamId, currentEventId)]));
        } else {
          setDeletePrivate(privateExists);
          setSelectedEventKeys(new Set());
        }
      } catch (e) {
        if (cancelled) return;
        setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, testId, currentTeamId, currentEventId, hasCurrentEventContext]);

  const canConfirm = useMemo(() => {
    return deletePrivate || selectedEventKeys.size > 0;
  }, [deletePrivate, selectedEventKeys]);

  const toggleEvent = (teamId, eventId) => {
    const k = keyFor(teamId, eventId);
    setSelectedEventKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const onDelete = () => {
    const deleteEvents = eventLocations
      .filter((loc) => selectedEventKeys.has(keyFor(loc.teamId, loc.eventId)))
      .map(({ teamId, eventId }) => ({ teamId, eventId }));

    onConfirm({ deletePrivate, deleteEvents });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 mx-2 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-2">Delete Test Result</h2>
        <p className="text-sm text-gray-600 mb-4">
          This result may be stored in your library and/or shared into team events. Choose exactly where to remove it.
        </p>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 text-sm text-red-600">
            Could not load where this result is stored. You can still close and try again.
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase">Locations</div>

              {hasPrivate && (
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={deletePrivate}
                    onChange={(e) => setDeletePrivate(e.target.checked)}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-sm">My results library</div>
                    <div className="text-xs text-gray-500">
                      Deletes your main copy.
                    </div>
                  </div>
                </label>
              )}

              {eventLocations.length > 0 && (
                <div className="space-y-2">
                  {eventLocations.map((loc) => {
                    const k = keyFor(loc.teamId, loc.eventId);
                    const label = `${loc.teamName || loc.teamId} / ${loc.eventName || loc.eventId}`;
                    return (
                      <label
                        key={k}
                        className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedEventKeys.has(k)}
                          onChange={() => toggleEvent(loc.teamId, loc.eventId)}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {loc.isCurrent ? 'Current event: ' : ''}{label}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {!hasPrivate && eventLocations.length === 0 && (
                <div className="text-sm text-gray-600">No stored locations found.</div>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Tip: If you remove it from an event only, your library copy remains. If you delete your library copy but keep event copies, the result can still be visible in those events.
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={!canConfirm || loading}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
