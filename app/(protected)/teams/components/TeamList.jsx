'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import { IoExitOutline } from "react-icons/io5";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { useAuth } from '@/context/AuthContext';

const leaveTeamCallable = httpsCallable(functions, 'leaveTeamById');


export default function TeamList({ teams }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setIsLoading] = useState(false)


  if (!teams || !teams.length) {
    return <div>No teams joined yet.</div>;
  }

  const handleLeaveTeam = async (teamId) => {
    const confirmLeave = window.confirm('Are you sure you want to leave this team?');
    setIsLoading(true)
    if (!confirmLeave) return;

    try {
      await leaveTeamCallable({ teamId });
      // UI will auto-update due to your useTeams hook
    } catch (error) {
      alert(error.message || 'Failed to leave team.');
    }
    finally {
      setIsLoading(false)
    }
  };


  return (
    <div className="grid md:grid-cols-2 gap-4">
      {teams.map((team) => (
        <div
          key={team.id}
          className="grid grid-cols-2 justify-between shadow bg-container p-4 rounded cursor-pointer hover:bg-sbtn"
          onClick={() => router.push(`/teams/${team.id}`)}
        >
          <div>
            <h3 className="text-xl font-semibold">{team.name}</h3>
            <p>{t('members')}: {team.members.length}</p>
          </div>
          <div className='self-center justify-self-end'>
            {user.uid !== team.createdBy && (
              <Button
                variant='secondary'
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveTeam(team.id);
                }}
                loading={loading}
              >
                <IoExitOutline />
              </Button>
            )}


          </div>
        </div>
      ))}
    </div>
  );
}
