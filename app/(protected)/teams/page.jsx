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
  const { userData } = useAuth();
  const { teams, loading, error } = useTeams();
  const canCreateTeam = userData?.plan === 'coach' || userData?.plan === 'company';
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-up animate-duration-300">
      <div className='flex items-end justify-between mb-6'>
        <JoinTeamForm />
        {canCreateTeam && (
          
          <Button
            onClick={() => router.push('/teams/create-team')}
            variant="primary"
            className="flex h-fit items-center"
          >
            {t('create_team')}
          </Button>
        )}
      </div>

      <div className="bg-white rounded-md shadow p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">{t('teams')}</h1>

        </div>

        <div className="space-y-6">
          <div>

          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md">
              {t('error_loading_teams')}: {error.message}
            </div>
          )}

          <div>
            <TeamList teams={teams} />
          </div>
        </div>
      </div>
    </div>
  );
}