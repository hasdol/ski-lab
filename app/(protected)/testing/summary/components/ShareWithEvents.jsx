'use client';

import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { getUserTeamsWithLiveEvents } from '@/lib/firebase/firestoreFunctions';

export default function ShareWithEventSelector({ userId, isVisible, onSelect }) {
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});
  const [selectedEventsMap, setSelectedEventsMap] = useState({});

  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  if (!isVisible) return null;

  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const { teams, teamEvents } = await getUserTeamsWithLiveEvents(userId);
        setTeams(teams);
        setTeamEvents(teamEvents);
      } catch (err) {
        console.error('Failed to fetch teams/events:', err);
      }
    })();
  }, [userId]);

  const toggleEventSelection = (teamId, eventId) => {
    setSelectedEventsMap((prev) => {
      const current = prev[teamId] || [];
      const isSelected = current.includes(eventId);
      return {
        ...prev,
        [teamId]: isSelected
          ? current.filter((id) => id !== eventId)
          : [...current, eventId],
      };
    });
  };

  useEffect(() => {
    const selectedArray = Object.entries(selectedEventsMap)
      .flatMap(([teamId, eventIds]) =>
        eventIds.map((eventId) => ({ teamId, eventId }))
      );
    if (onSelectRef.current) {
      onSelectRef.current(selectedArray);
    }
  }, [selectedEventsMap]);

  return (
    <div className="p-3 border rounded mb-4 font-semibold bg-container text-text">
      <h4 className="mb-2 text-xl">Share with Live Events</h4>
      {teams.map((team) => (
        <div key={team.id} className="mb-4">
          <p className="font-semibold mb-2">{team.name || 'Unnamed Team'}</p>
          {teamEvents[team.id] && teamEvents[team.id].length > 0 ? (
            <div className="space-y-1 border border-gray-300 p-2 rounded w-fit">
              {teamEvents[team.id].map((event) => {
                const start = event.startDate ? new Date(event.startDate) : null;
                const end = event.endDate ? new Date(event.endDate) : null;
                const startDateFormatted = start?.toLocaleDateString();
                const endDateFormatted = end?.toLocaleDateString();

                return (
                  <label key={event.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedEventsMap[team.id]?.includes(event.id) || false}
                      onChange={() => toggleEventSelection(team.id, event.id)}
                    />
                    <span>{event.name}</span>
                    <span className="text-sm">
                      ({startDateFormatted} - {endDateFormatted})
                    </span>
                  </label>
                );
              })}

            </div>
          ) : (
            <p className="text-sm text-gray-500 ml-2">No live events</p>
          )}
        </div>
      ))}
    </div>
  );
}
