'use client';
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { RiCloseLine } from 'react-icons/ri';
import { MdPublic, MdPublicOff } from 'react-icons/md';
import { getFunctions, httpsCallable } from 'firebase/functions';

function TeamAvatar({ team }) {
  const initial = (team?.name || 'T').slice(0, 1).toUpperCase();
  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-blue-700 font-semibold">
      {team?.imageURL ? (
        <img src={team.imageURL} alt={team.name || 'Team'} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export default function JoinByCodePreviewModal({ isOpen, onClose, team, code, onJoined }) {
  const [joining, setJoining] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const handleJoin = async () => {
    setJoining(true);
    setMsg('');
    setErr('');
    try {
      const fn = httpsCallable(getFunctions(), 'joinTeamByCode');
      const res = await fn({ code });
      if (res.data?.pending) {
        setMsg('Join request sent! Pending approval.');
      } else {
        setMsg('Joined the team successfully.');
      }
      setTimeout(() => {
        onJoined?.();
      }, 1500);
    } catch (e) {
      setErr(e.message || 'Failed to join team.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4">
              <h2 className="text-xl font-semibold">Confirm Team</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
                <RiCloseLine size={24} />
              </button>
            </div>

            <div className="p-4">
              {!team ? (
                <div className="text-sm text-gray-600">No team found.</div>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <TeamAvatar team={team} />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{team.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                      {team.isPublic ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-2xl">
                          <MdPublic /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-2xl">
                          <MdPublicOff /> Private
                        </span>
                      )}
                      <span>
                        {team.memberCount ?? 0}
                        {team.memberCap ? ` / ${team.memberCap}` : ''} members
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {err && <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-3 py-2 text-sm mb-3">{err}</div>}
              {msg && <div className="bg-green-50 text-green-700 border border-green-200 rounded-2xl px-3 py-2 text-sm mb-3">{msg}</div>}

              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose} disabled={joining}>Cancel</Button>
                <Button variant="primary" onClick={handleJoin} loading={joining} disabled={!team}>
                  {team?.isPublic ? 'Send Request' : 'Join Team'}
                </Button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                {team?.isPublic
                  ? 'Public team: your request must be approved by the owner or a moderator.'
                  : 'Private team: you’ll join immediately if the team has capacity.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}