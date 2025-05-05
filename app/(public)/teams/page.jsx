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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          {t('teams')}
        </h1>
        
        <div className="flex space-x-3">
          <JoinTeamForm />
          {canCreateTeam && (
            <Button
              onClick={() => router.push('/teams/create-team')}
              variant="primary"
              className="px-5 py-2"
            >
              {t('create_team')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <section className="bg-white rounded-md p-5 space-y-6">
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

        {/* Login Prompt */}
        {!user && (
          <div className="text-center pt-4">
            <Button
              variant="primary"
              onClick={() => router.push('/signin')}
              className="px-6 py-2"
            >
              {t('signIn')}
            </Button>
          </div>
        )}

        {/* No Teams Fallback */}
        {(!loading && !error && teams.length === 0) && (
          <p className="text-gray-600 text-center">
            {t('no_teams_found')}
          </p>
        )}
      </section>
    </div>
  );
}
