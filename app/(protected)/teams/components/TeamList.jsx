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
  const [loadingTeamId, setLoadingTeamId] = useState(null);



  if (!teams || !teams.length) {
    return <div>No teams joined yet.</div>;
  }

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
    <div className="grid md:grid-cols-3 gap-4">
      {teams.map((team) => (
        <Button
          key={team.id}
          variant="secondary"
          onClick={() => router.push(`/teams/${team.id}`)}
        >
          <div>
            <h3 className="text-xl font-semibold">{team.name}</h3>
            <p>{t('members')}: {team.members.length}</p>
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


          </div>
        </Button>
      ))}
    </div>
  );
}
