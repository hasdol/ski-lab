'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { RiVipCrownLine } from 'react-icons/ri';
import { MdPublicOff, MdPublic } from 'react-icons/md';
import Card from '@/components/ui/Card';
import { TEAM_PLAN_CAPS } from '@/lib/constants/teamPlanCaps';

const TeamCard = ({ team, isCreator, isMod, memberCap, onView }) => {
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 1)
      .join('')
      .toUpperCase();

  const initials = getInitials(team.name || 'T');
  const membersCount = Array.isArray(team.members) ? team.members.length : 0;
  const capKnown = Number.isFinite(memberCap);
  const isFull = capKnown && memberCap > 0 && membersCount >= memberCap;
  const isOverCap = capKnown && ((memberCap === 0 && membersCount > 0) || (memberCap > 0 && membersCount > memberCap));

  return (
    <Card
      className={`flex justify-between`}
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
                <MdPublicOff />
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
            {!isCreator && isMod && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                MOD
              </span>
            )}

            {/* Member cap badge (only meaningful for the owner) */}
            {isCreator && capKnown && (isFull || isOverCap) && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${isOverCap ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                {isOverCap ? 'Over cap' : 'Full'}
              </span>
            )}

            <span className="text-xs text-gray-500">
              {membersCount} member{membersCount !== 1 && 's'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto">
        <Button onClick={onView} variant="secondary" className="text-sm w-full sm:w-auto">
          View
        </Button>
      </div>
      </Card>
    );
};

export default function UserTeamsList({ teams, onTeamUpdate }) {
  const router = useRouter();
  const { user, userData } = useAuth();

  const memberCap = Number.isFinite(userData?.planMembersCap)
    ? Number(userData.planMembersCap)
    : (TEAM_PLAN_CAPS[userData?.plan]?.members ?? null);

  return (
    <div className="grid gap-4 my-4">
      {teams.length === 0 && (
        <div className="text-gray-400 text-sm">No teams available</div>
      )}
      {teams.map((team) => {
        const isCreator = team.createdBy === user?.uid;
        const isMod = !isCreator && (team.mods || []).includes(user?.uid);
        return (
          <TeamCard
            key={team.id}
            team={team}
            isCreator={isCreator}
            isMod={isMod}
            memberCap={isCreator ? memberCap : null}
            onView={() => router.push(`/teams/${team.id}`)}
          />
        );
      })}
    </div>
  );
}