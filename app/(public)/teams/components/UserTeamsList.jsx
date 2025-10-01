'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { RiVipCrownLine } from 'react-icons/ri';
import { MdLock, MdPublic } from 'react-icons/md';

const TeamCard = ({ team, isCreator, onView }) => {
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 1)
      .join('')
      .toUpperCase();

  const initials = getInitials(team.name || 'T');

  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col sm:flex-row items-center sm:items-start justify-between bg-white shadow rounded-lg p-4"
    >
      <div className="flex items-center space-x-4 w-full sm:w-auto">
        {/* Avatar: team image or initial */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-blue-700 font-semibold">
          {team.imageURL ? (
            <img
              src={team.imageURL}
              alt={team.name ? `${team.name} logo` : 'Team logo'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{team.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {/* Visibility badge */}
            {team.isPublic ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                <MdPublic />
                Public
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-semibold">
                <MdLock />
                Private
              </span>
            )}
            {/* Owner badge */}
            {isCreator && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
                <RiVipCrownLine className="text-yellow-500" />
                Owner
              </span>
            )}
            <span className="text-xs text-gray-500">
              {team.members.length} member{team.members.length !== 1 && 's'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto">
        <Button onClick={onView} variant="secondary" className="text-sm w-full sm:w-auto">
          View
        </Button>
      </div>
    </motion.div>
  );
};

export default function UserTeamsList({ teams, onTeamUpdate }) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="grid gap-4 my-4">
      {teams.length === 0 && (
        <div className="text-gray-400 text-sm">No teams available</div>
      )}
      {teams.map((team) => {
        const isCreator = team.createdBy === user?.uid;
        return (
          <TeamCard
            key={team.id}
            team={team}
            isCreator={isCreator}
            onView={() => router.push(`/teams/${team.id}`)}
          />
        );
      })}
    </div>
  );
}