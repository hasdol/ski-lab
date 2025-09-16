'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiChevronRight } from 'react-icons/fi';

const formatDate = (d) => {
  if (!d) return '';
  if (typeof d?.toDate === 'function') d = d.toDate();
  if (typeof d === 'string') d = new Date(d);
  return d instanceof Date && !isNaN(d) ? d.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }) : '';
};

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const ActiveEventCard = ({ event = {}, team = {}, onClick = () => {} }) => {
  const start = formatDate(event.startDate);
  const end = formatDate(event.endDate);
  const dateRange = start && end ? `${start} — ${end}` : start || end || '';
  const initials = getInitials(team.name || event.name || 'SL');
  const participantCount = event.participants?.length ?? event.participantCount ?? null;
  const isLive = !!event.live || !!event.isLive;

  // Prefer definitive team.imageURL (used elsewhere when uploading team images),
  // fall back to legacy icon url or initials.
  const imageSrc = team.imageURL || team.iconUrl || null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl text-left transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      aria-label={`Open event ${event.name}`}
      aria-describedby={event.id ? `event-desc-${event.id}` : undefined}
    >
      <div
        className="flex-shrink-0 w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-blue-700 font-semibold text-sm overflow-hidden"
        aria-hidden="true"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={team.name ? `${team.name} logo` : `${event.name} logo`}
            className="max-w-full max-h-full object-contain"
            style={{ display: 'block' }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-gray-900 truncate">{event.name || 'Untitled Event'}</div>
              {isLive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-2" />
                  LIVE
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="truncate">{team.name || 'Unknown team'}</span>
              {dateRange && (
                <span className="hidden sm:inline-flex items-center">
                  <FiClock className="w-4 h-4 mr-1 text-gray-400" />
                  <span>{dateRange}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 ml-2 flex flex-col items-end">
            {participantCount != null && (
              <div className="text-xs text-gray-500">{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</div>
            )}
            <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" aria-hidden="true" />
          </div>
        </div>

        {/* small-screen date row */}
        {dateRange && (
          <div id={event.id ? `event-desc-${event.id}` : undefined} className="mt-2 flex items-center text-xs text-gray-500 sm:hidden">
            <FiClock className="w-4 h-4 mr-1 text-gray-400" />
            <span className="truncate">{dateRange}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default ActiveEventCard;