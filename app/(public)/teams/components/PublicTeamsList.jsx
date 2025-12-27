// src/app/teams/components/PublicTeamsList.jsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { motion } from 'framer-motion';
import { MdPublic } from 'react-icons/md';
import { RiVipCrownLine } from 'react-icons/ri';
import { useAuth } from '@/context/AuthContext';

const PublicTeamCard = ({ team, isJoined, onJoin }) => {
  const { user } = useAuth();
  const router = useRouter();

  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 1)
      .join('')
      .toUpperCase();

  const initials = getInitials(team.name || 'T');
  const isCreator = team.createdBy === user?.uid;
  const isMod = !isCreator && (team.mods || []).includes(user?.uid);

  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl relative overflow-hidden flex justify-between bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs transition-colors duration-200 `}
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
            {/* Public badge */}
            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
              <MdPublic />
              Public
            </span>
            {/* Owner badge */}
            {isCreator && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">
                <RiVipCrownLine className="text-yellow-500" />
                Owner
              </span>
            )}
            {!isCreator && isMod && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                MOD
              </span>
            )}
            <span className="text-xs text-gray-500">
              {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto">
        <Button
          onClick={() => {
            if (isJoined) {
              router.push(`/teams/${team.id}`);
            } else if (onJoin) {
              onJoin(team);
            }
          }}
          variant={isJoined ? 'secondary' : 'primary'}
          className="text-sm w-full sm:w-auto"
        >
          {isJoined ? 'View' : 'Join'}
        </Button>
      </div>
    </motion.div>
  );
};

const PublicTeamsList = ({ teams, loading, error, hasMore, onLoadMore, onRefresh, onJoin }) => {
  const { user } = useAuth();
  const router = useRouter();

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load teams. Please try again.</p>
        <Button onClick={onRefresh} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  if (!loading && teams.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <MdPublic className="text-gray-500 text-2xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Public Teams Yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          There are no public teams available at the moment.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 my-4">
        {teams.map((team) => {
          const isJoined = team.members?.includes(user?.uid);
          return (
            <PublicTeamCard
              key={team.id}
              team={team}
              isJoined={isJoined}
              onJoin={onJoin}
            />
          );
        })}
      </div>
      {loading && (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      )}
      {!loading && hasMore && (
        <div className="flex justify-center mt-4">
          <Button onClick={onLoadMore} variant="primary" className="px-6 py-2">
            Load More Teams
          </Button>
        </div>
      )}
    </>
  );
};

export default PublicTeamsList;