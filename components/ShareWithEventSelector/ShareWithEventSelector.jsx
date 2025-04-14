'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Props:
 *  - userId: string (the current user's uid)
 *  - isVisible: boolean (whether to render or not)
 *  - onSelect(selectedEvents): callback when the user picks events for teams.
 *      selectedEvents is an array of objects, each containing { teamId, eventId }.
 *
 * Example usage:
 *   <ShareWithEventSelector
 *     userId={user.uid}
 *     isVisible={shareWithEvent}
 *     onSelect={(selectedEvents) => {
 *       setSelectedEvents(selectedEvents);
 *     }}
 *   />
 */
export default function ShareWithEventSelector({ userId, isVisible, onSelect }) {
  // 1) The user’s teams
  const [teams, setTeams] = useState([]);
  // 2) For each team, store an array of "live" events in a map: { [teamId]: ArrayOfEvents }
  const [teamEvents, setTeamEvents] = useState({});
  // 3) Mapping of selected events: { [teamId]: eventId }
  const [selectedEventsMap, setSelectedEventsMap] = useState({});

  // Use a ref to store the onSelect callback, so that changes in its reference don't trigger our effect.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  if (!isVisible) return null;

  // Fetch user's teams and their live events
  useEffect(() => {
    if (!userId) return;
    
    (async () => {
      try {
        // Query all teams where userId is in members
        const teamsRef = collection(db, 'teams');
        const qTeams = query(teamsRef, where('members', 'array-contains', userId));
        const teamsSnap = await getDocs(qTeams);

        const fetchedTeams = [];
        for (const docSnap of teamsSnap.docs) {
          const data = docSnap.data();
          fetchedTeams.push({ id: docSnap.id, ...data });
        }
        setTeams(fetchedTeams);

        // For each team, fetch events and filter for "live" events based on current date
        const newTeamEvents = {};
        for (const team of fetchedTeams) {
          const teamId = team.id;
          const eventsRef = collection(db, 'teams', teamId, 'events');
          const eventsSnap = await getDocs(eventsRef);

          const liveEvents = [];
          const now = new Date();

          eventsSnap.forEach((evtDoc) => {
            const evtData = evtDoc.data();
            // Convert Firestore Timestamps to JS Date objects
            const start = evtData.startDate?.toDate?.() || new Date(0); 
            const end = evtData.endDate?.toDate?.() || new Date(0);
            // "live" if the current time is between the start and end dates
            if (now >= start && now <= end) {
              liveEvents.push({
                id: evtDoc.id,
                name: evtData.name || 'Unnamed Event',
                startDate: start,
                endDate: end
              });
            }
          });
          newTeamEvents[teamId] = liveEvents;
        }

        setTeamEvents(newTeamEvents);
      } catch (err) {
        console.error('Failed to fetch teams/events:', err);
      }
    })();
  }, [userId]);

  // Update the selected event for a given team
  const handleEventChange = (teamId, eventId) => {
    setSelectedEventsMap((prev) => ({
      ...prev,
      [teamId]: eventId
    }));
  };

  // Use an effect to notify the parent about changes in selected events.
  useEffect(() => {
    const selectedArray = Object.entries(selectedEventsMap)
      .filter(([_, evId]) => evId)
      .map(([teamId, eventId]) => ({ teamId, eventId }));
    if (onSelectRef.current) {
      onSelectRef.current(selectedArray);
    }
  }, [selectedEventsMap]);

  return (
    <div className="p-3 border rounded mb-4 bg-gray-50">
      <h4 className="font-semibold mb-2">Share with Live Event</h4>
      {teams.map((team) => (
        <div key={team.id} className="flex items-center space-x-4 mb-3">
          <span className="w-1/3">{team.name || 'Unnamed Team'}</span>
          {teamEvents[team.id] && teamEvents[team.id].length > 0 ? (
            <select
              className="border p-2 w-full rounded"
              value={selectedEventsMap[team.id] || ""}
              onChange={(e) => handleEventChange(team.id, e.target.value)}
            >
              <option value="">-- Select Live Event --</option>
              {teamEvents[team.id].map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-gray-500">No live events</span>
          )}
        </div>
      ))}
    </div>
  );
}
