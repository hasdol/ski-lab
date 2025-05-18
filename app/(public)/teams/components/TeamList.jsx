'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { IoExitOutline } from "react-icons/io5";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

const leaveTeamCallable = httpsCallable(functions, 'leaveTeamById');


export default function TeamList({ teams }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingTeamId, setLoadingTeamId] = useState(null);


  const handleLeaveTeam = async (teamId) => {
    const confirmLeave = window.confirm('Are you sure you want to leave this team?');
    if (!confirmLeave) return;

    setLoadingTeamId(teamId);
    try {
      await leaveTeamCallable({ teamId });
    } catch (error) {
      alert(error.message || 'Failed to leave team.');
    } finally {
      setLoadingTeamId(null);
    }
  };


  return (
    <div className="grid md:grid-cols-2 gap-3 my-4 animate-fade-down animate-duration-300">
      {teams.map((team) => (
        <div
          key={team.id}
          className="flex justify-between border-l-2 border-gray-300  text-gray-800  cursor-pointer p-2.5"
          
        >
          <div>
            <h3 className='font-semibold'>{team.name}</h3>
            <p className='text-xs'>Members: {team.members.length}</p>
          </div>
          <div className='self-center justify-self-end'>
            {user.uid !== team.createdBy && (
              <Button
                variant="secondary"
                loading={loadingTeamId === team.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveTeam(team.id);
                }}
              >
                <IoExitOutline />
              </Button>
            )}

            <Button onClick={() => router.push(`/teams/${team.id}`)} variant='secondary' className='text-sm'>View</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
