'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getUserTeamsWithEvents } from '@/lib/firebase/firestoreFunctions';
import { useTranslation } from 'react-i18next';

export default function ShareWithEventSelector({
  userId,
  isVisible,
  onSelect,
  initialSelectedEvents = [],
  includePast = false,
}) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');
  const [openMap, setOpenMap] = useState({});
  const onSelectRef = useRef(onSelect);
  const today = new Date();

  // Keep onSelect up to date
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Pre-select when editing past
  useEffect(() => {
    if (includePast && initialSelectedEvents.length) {
      const map = {};
      initialSelectedEvents.forEach(({ teamId, eventId }) => {
        map[teamId] = map[teamId] || [];
        map[teamId].push(eventId);
      });
      setSelected(map);
    }
  }, [includePast, initialSelectedEvents]);

  // Fetch teams + events
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { teams, teamEvents } = await getUserTeamsWithEvents(userId, includePast);
        setTeams(teams);
        setTeamEvents(teamEvents);
      } catch (err) {
        console.error('Error loading teams/events:', err);
      }
    })();
  }, [userId, includePast]);

  // Initialize open state once
  useEffect(() => {
    if (teams.length === 0) return;
    setOpenMap(prev => {
      if (Object.keys(prev).length > 0) return prev;
      const map = {};
      teams.forEach(team => {
        const hasSelected = (selected[team.id] || []).length > 0;
        map[team.id] = includePast ? hasSelected : true;
      });
      return map;
    });
  }, [teams, includePast, selected]);

  // Notify parent when selection changes
  useEffect(() => {
    const arr = Object.entries(selected).flatMap(([teamId, evIds]) =>
      evIds.map(eventId => ({ teamId, eventId }))
    );
    onSelectRef.current(arr);
  }, [selected]);

  // Toggle selection
  const toggle = (teamId, eventId) => {
    setSelected(prev => {
      const list = prev[teamId] || [];
      const next = list.includes(eventId)
        ? list.filter(id => id !== eventId)
        : [...list, eventId];
      return { ...prev, [teamId]: next };
    });
  };

  // Filter teams by search term
  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams;
    const term = search.toLowerCase();
    return teams.filter(team => {
      if (team.name?.toLowerCase().includes(term)) return true;
      return (teamEvents[team.id] || []).some(evt =>
        evt.name.toLowerCase().includes(term)
      );
    });
  }, [search, teams, teamEvents]);

  // Highlight helper
  const highlight = (text = '', term = '') => {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-yellow-200">{part}</mark>
        : part
    );
  };

  if (!isVisible || teams.length === 0) return null;

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h2 className='font-semibold text-lg mb-5'>{includePast?t('shared_in_events'):t('share_with_live_events')}</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('search_teams_events')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring"
        />
      </div>

      {filteredTeams.length === 0 && (
        <p className="text-center text-sm text-gray-500">{t('no_matches_found')}</p>
      )}

      {filteredTeams.map(team => (
        <details
          key={team.id}
          open={openMap[team.id]}
          onToggle={e => setOpenMap(prev => ({ ...prev, [team.id]: e.target.open }))}
          className="mb-3"
        >
          <summary className="cursor-pointer p-2 bg-gray-100 rounded">
            {highlight(team.name, search) || t('unnamed_team')}
          </summary>
          <div className="mt-2 pl-4 space-y-1">
            {(
              teamEvents[team.id] || []
            )
              // only include events that have started
              .filter(evt => evt.startDate <= today)
              // if not includePast, also require still live
              .filter(evt => includePast || (evt.endDate >= today))
              // sort most recent start first
              .sort((a, b) => b.startDate - a.startDate)
              .map(evt => (
                <label key={evt.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selected[team.id]?.includes(evt.id) || false}
                    onChange={() => toggle(team.id, evt.id)}
                  />
                  <div>
                    <div className="font-medium">{highlight(evt.name, search)}</div>
                    <div className="text-xs text-gray-500">
                      {evt.startDate.toLocaleDateString()} – {evt.endDate.toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
          </div>
        </details>
      ))}
    </div>
  );
}
