'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { getUserTeamsWithEvents } from '@/lib/firebase/firestoreFunctions';
import Input from '../ui/Input';
import Card from '@/components/ui/Card';
import { formatDateRange } from '@/helpers/helpers';

export default function ShareWithEventSelector({
  userId,
  isVisible,
  onSelect = () => {},
  initialSelectedEvents = [],
  includePast = false,
  requiredMemberUids = [],
  variant = 'card', // 'card' | 'embedded'
  className = '',
}) {
  const [teams, setTeams] = useState([]);
  const [teamEvents, setTeamEvents] = useState({});
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState('');
  const [openMap, setOpenMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const onSelectRef = useRef(onSelect);
  const today = new Date();

  const requiredUids = useMemo(() => {
    return Array.from(new Set((requiredMemberUids || []).filter(Boolean)));
  }, [requiredMemberUids]);

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
        setLoading(true);
        setLoadError('');
        const { teams, teamEvents } = await getUserTeamsWithEvents(userId, includePast);
        setTeams(teams);
        setTeamEvents(teamEvents);
      } catch (err) {
        console.error('Error loading teams/events:', err);
        setLoadError('Could not load teams and events.');
      } finally {
        setLoading(false);
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

  // `selectedCount` removed from UI but keep calculation available if needed later
  const selectedCount = useMemo(() => {
    return Object.values(selected).reduce((sum, list) => sum + (list?.length || 0), 0);
  }, [selected]);

  if (!isVisible) return null;

  const wrapperClass =
    variant === 'embedded'
      ? `space-y-3 ${className}`.trim()
      : `p-4 md:p-5 space-y-3 ${className}`.trim();

  const showHeader = variant !== 'embedded';

  const emptyOrLoading = (
    <div className={wrapperClass}>
      {showHeader && (
        <div className="text-sm font-medium text-gray-900">
          {includePast ? 'Shared in events' : 'Share with events'}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading events…</div>
      ) : loadError ? (
        <div className="text-sm text-red-600">{loadError}</div>
      ) : (
        <div className="text-sm text-gray-600">No teams/events found.</div>
      )}
    </div>
  );

  if (loading || loadError || teams.length === 0) {
    return variant === 'embedded' ? (
      emptyOrLoading
    ) : (
      <Card padded={false} className={wrapperClass}>
        {emptyOrLoading}
      </Card>
    );
  }

  const content = (
    <>
      {showHeader && (
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-gray-900">
            {includePast ? 'Shared in events' : 'Share with events'}
          </div>
        </div>
      )}

      <div>
        <Input
          type="text"
          name="eventSearch"
          placeholder="Search events"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span className="text-gray-500">Who can see it:</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
          Team members
        </span>
        <span className="text-gray-500">= everyone in the team</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
          Owner/mods
        </span>
        <span className="text-gray-500">= only owners/moderators</span>
      </div>

      {requiredUids.length > 1 && (
        <div className="text-xs text-gray-600">
          <span className="font-medium">Cross-user test:</span> You can only share to events where all involved users are members of the team.
        </div>
      )}

      {filteredTeams.length === 0 && (
        <p className="text-center text-sm text-gray-500">No match found</p>
      )}

      {filteredTeams.map((team) => (
        <details
          key={team.id}
          open={openMap[team.id]}
          onToggle={(e) => setOpenMap((prev) => ({ ...prev, [team.id]: e.target.open }))}
          className="rounded-2xl border border-gray-200 bg-white"
        >
            <summary className="cursor-pointer select-none px-3 py-2 rounded-2xl bg-gray-50 flex items-center gap-3">
            <span className="font-medium text-sm text-gray-900 truncate">
              {team.name || 'Unnamed Team'}
            </span>
          </summary>

          <div className="p-3 pt-2 space-y-2">
            {(() => {
              const teamMemberUids = Array.isArray(team?.members) ? team.members : [];
              const teamEligible = requiredUids.length === 0 || requiredUids.every((uid) => teamMemberUids.includes(uid));

              const eventsAll = (teamEvents[team.id] || [])
                .filter((evt) => evt.startDate <= today)
                .filter((evt) => includePast || evt.endDate >= today)
                .sort((a, b) => b.startDate - a.startDate);

              const term = search.trim().toLowerCase();
              const teamMatches = term ? (team.name || '').toLowerCase().includes(term) : false;
              const events = term && !teamMatches
                ? eventsAll.filter((evt) => (evt.name || '').toLowerCase().includes(term))
                : eventsAll;

              if (events.length === 0) {
                return <div className="text-sm text-gray-600">No matching events.</div>;
              }

              return events.map((evt) => {
                const vis = evt.resultsVisibility || 'team';
                const isStaffOnly = vis === 'staff';
                const checkboxId = `share-${team.id}-${evt.id}`;
                const checkboxName = `shareEvents[${team.id}]`;
                const isChecked = selected[team.id]?.includes(evt.id) || false;
                const isDisabled = !teamEligible && !isChecked;

                return (
                  <label
                    key={evt.id}
                    htmlFor={checkboxId}
                    className={`flex items-start gap-3 rounded-xl px-2 py-2 ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                  >
                    <input
                      id={checkboxId}
                      name={checkboxName}
                      value={evt.id}
                      type="checkbox"
                      className="mt-1"
                      checked={isChecked}
                      disabled={isDisabled}
                      title={isDisabled ? 'Sharing disabled: not all participants are members of this team.' : undefined}
                      onChange={() => {
                        if (isDisabled) return;
                        toggle(team.id, evt.id);
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {evt.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateRange(evt.startDate, evt.endDate)}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isStaffOnly ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                          }`}
                          title={isStaffOnly ? 'Visible to event owners/moderators' : 'Visible to team members'}
                        >
                          {isStaffOnly ? 'Owner/mods' : 'Team members'}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              });
            })()}
          </div>
        </details>
      ))}

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
