'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import useTeams from '@/hooks/useTeams';
import JoinTeamForm from './components/JoinTeamForm';
import TeamList from './components/TeamList';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner/Spinner';

export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useTeams();
  const canCreateTeam = ['coach', 'company'].includes(userData?.plan);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="container mx-auto animate-fade-up animate-duration-300">
      {/* Header */}
      <div className="flex flex-col items-start  justify-between">
        <h1 className="text-3xl font-bold text-gray-900 my-4">
          {t('teams')}
        </h1>
        
        <div className="flex flex-col md:flex-row w-full space-x-3 gap-4 md:items-end justify-between">
          {canCreateTeam && (
            <Button
              onClick={() => router.push('/teams/create-team')}
              variant="primary"
              className="h-fit"
            >
              {t('create_team')}
            </Button>
          )}
          <JoinTeamForm />
          
        </div>
      </div>

      {/* Main Content */}
      <section className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 text-red-800 border border-red-200 px-4 py-3 rounded-md">
            <strong>{t('error_loading_teams')}:</strong> {error.message}
          </div>
        )}

        {/* Team List */}
        {!loading && !error && (
          <TeamList teams={teams} />
        )}

        {!user && <span className='mt-4 italic'>{t('you_are_not_signed_in')}</span>}


        {/* No Teams Fallback */}
        {(!loading && !error && teams.length === 0 && user) && (
          <p className="mt-4">
            {t('no_teams_joined')}
          </p>
        )}
      </section>
    </div>
  );
}
