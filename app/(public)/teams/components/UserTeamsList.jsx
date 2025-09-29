'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { RiVipCrownLine } from 'react-icons/ri';
import { MdLock, MdPublic } from "react-icons/md";


const TeamCard = ({ team, isCreator, onView }) => {
  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className=" relative flex items-center justify-between bg-white shadow rounded-lg p-4"
    >
      <div className=" flex items-center space-x-4">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-full">
          {team.isPublic ? (
            <MdPublic className="text-blue-600 text-xl" />
          ) : (
            <MdLock className="text-gray-700 text-xl" />
          )}
          {isCreator && (
            <RiVipCrownLine className="text-gray-800 absolute left-8  -top-1"  title="Team Creator" />
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-1">
            {team.name}
          </h3>
          <p className="text-xs text-gray-500">
            {team.members.length} member{team.members.length !== 1 && 's'}
          </p>
        </div>
      </div>
      <Button onClick={onView} variant="secondary" className="text-sm">
        View
      </Button>
    </motion.div>
  );
};

export default function UserTeamsList({ teams, onTeamUpdate }) {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="grid gap-4 my-4">
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