'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import useTeams from '@/hooks/useTeams';
import JoinTeamForm from './components/JoinTeamForm';
import TeamList from './components/TeamList';
import { useTranslation } from 'react-i18next';
import { RiAddLargeLine } from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner/Spinner';


export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useTeams();
  const canCreateTeam = userData?.plan === 'coach' || userData?.plan === 'company';
  const { t } = useTranslation();
  const router = useRouter();


  if (error) {
    return <div>Error loading teams: {error.message}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {canCreateTeam && (
        <Button onClick={() => router.push('/teams/create-team')} variant="primary">
          {t('create_team')}
        </Button>
      )}
      <JoinTeamForm />

      {loading && <div className='flex justify-center'><Spinner /></div> }
      <TeamList teams={teams} />
    </div>
  );
}
