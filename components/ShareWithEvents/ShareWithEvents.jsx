'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getUserTeamsWithEvents } from '@/lib/firebase/firestoreFunctions';
import Input from '../ui/Input';
import Card from '@/components/ui/Card';

export default function ShareWithEventSelector({
  userId,
  isVisible,
  onSelect = () => {},
  initialSelectedEvents = [],
  includePast = false,
  variant = 'card', // 'card' | 'embedded'
  className = '',
}) {
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');
  const [openMap, setOpenMap] = useState({});
  const onSelectRef = useRef(onSelect);
  const today = new Date();

  // Keep onSelect up to date (and always callable)
  useEffect(() => {
    onSelectRef.current = typeof onSelect === 'function' ? onSelect : () => {};
  }, [onSelect]);

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

    // ✅ guard (extra safety)
    if (typeof onSelectRef.current === 'function') onSelectRef.current(arr);
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

  const wrapperClass =
    variant === 'embedded'
      ? `space-y-3 ${className}`.trim()
      : `p-4 md:p-5 space-y-3 ${className}`.trim();

  const content = (
    <>
      <h2 className="font-semibold text-base text-gray-900">
        {includePast ? 'Shared in events' : 'Share with live events'}
      </h2>

      <div>
        <Input
          type="text"
          name="eventSearch"
          placeholder="Search team events"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      {filteredTeams.length === 0 && (
        <p className="text-center text-sm text-gray-500">No match found</p>
      )}

      {filteredTeams.map((team) => (
        <details
          key={team.id}
          open={openMap[team.id]}
          onToggle={(e) => setOpenMap((prev) => ({ ...prev, [team.id]: e.target.open }))}
          className="mb-3"
        >
          <summary className="cursor-pointer p-2 bg-gray-100 rounded-2xl">
            {highlight(team.name, search) || 'Unnamed Team'}
          </summary>

          <div className="mt-2 pl-4 space-y-1">
            {(teamEvents[team.id] || [])
              .filter((evt) => evt.startDate <= today)
              .filter((evt) => includePast || evt.endDate >= today)
              .sort((a, b) => b.startDate - a.startDate)
              .map((evt) => {
                const vis = evt.resultsVisibility || 'team';
                const isStaffOnly = vis === 'staff';
                const checkboxId = `share-${team.id}-${evt.id}`;
                const checkboxName = `shareEvents[${team.id}]`;

                return (
                  <label key={evt.id} className="flex items-center space-x-2">
                    <input
                      id={checkboxId}
                      name={checkboxName}
                      value={evt.id}
                      type="checkbox"
                      checked={selected[team.id]?.includes(evt.id) || false}
                      onChange={() => toggle(team.id, evt.id)}
                    />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {highlight(evt.name, search)}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            isStaffOnly ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {isStaffOnly ? 'Owner/mods' : 'Team members'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {evt.startDate.toLocaleDateString('nb-NO')} – {evt.endDate.toLocaleDateString('nb-NO')}
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>
        </details>
      ))}

      <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
          Team members
        </span>
        <span className="text-gray-600">Everyone sees</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
          Owner/mods
        </span>
      </div>
    </>
  );

  return variant === 'embedded' ? (
    <div className={wrapperClass}>{content}</div>
  ) : (
    <Card padded={false} className={wrapperClass}>
      {content}
    </Card>
  );
}
