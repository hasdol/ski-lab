'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import useTeams from '@/hooks/useTeams';
import JoinTeamForm from './components/TeamsJoinForm';
import TeamList from './components/TeamsList';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Spinner from '@/components/common/Spinner/Spinner';

export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useTeams();
  const canCreateTeam = ['coach', 'company'].includes(userData?.plan);
  const router = useRouter();

  return (
    <div className='p-3 md:w-2/3 mx-auto'>

      {/* Header */}
      <div className="flex flex-col items-start  justify-between">
        <h1 className="text-3xl font-bold text-gray-900 my-4">
          Teams
        </h1>

        <div className="flex flex-col md:flex-row w-full space-x-3 gap-4 md:items-end justify-between">
          {canCreateTeam && (
            <Button
              onClick={() => router.push('/teams/create-team')}
              variant="primary"
              className="h-fit"
            >
              Create Team
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
            <strong>Error loading teams:</strong> {error.message}
          </div>
        )}

        {/* Team List */}
        {!loading && !error && (
          <TeamList teams={teams} />
        )}

        {!user && <span className='mt-4 italic'>You are not signed in</span>}


        {/* No Teams Fallback */}
        {(!loading && !error && teams.length === 0 && user) && (
          <p className="mt-4">
            No teams joined
          </p>
        )}
      </section>
    </div>
  );
}
