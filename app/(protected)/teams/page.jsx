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


export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useTeams();
  const canCreateTeam = userData?.plan === 'coach' || userData?.plan === 'company';
  const { t } = useTranslation();
  const router = useRouter();

  if (loading) {
    return <div>Loading teams...</div>;
  }

  if (error) {
    return <div>Error loading teams: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-semibold mb-5">{t('teams')}</h1>
      <div className='flex justify-between items-end my-4'>
        <JoinTeamForm />
        {canCreateTeam && (
          <Button onClick={() => router.push('/teams/create-team')} variant="primary">
            <RiAddLargeLine />
          </Button>
        )}
      </div>

      <TeamList teams={teams} />
    </div>
  );
}
