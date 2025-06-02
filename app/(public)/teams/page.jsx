'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import useTeams from '@/hooks/useTeams';
import JoinTeamForm from './components/TeamsJoinForm';
import TeamList from './components/TeamsList';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { RiInformationLine, } from "react-icons/ri";
import { AnimatePresence, motion } from 'framer-motion';

export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useTeams();
  const canCreateTeam = ['coach', 'company'].includes(userData?.plan);
  const router = useRouter();

  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="p-3 md:w-2/3 mx-auto">
      {/* Header */}
      <div className="flex flex-col items-start justify-between">
        <div className='flex w-full justify-between items-center'>
          <h1 className="text-3xl font-bold text-gray-900 my-6">
            Teams
          </h1>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowInfo(prev => !prev)}
            className='h-fit'
          >
            <RiInformationLine />
          </Button>
        </div>


        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1}}
              transition={{ duration: 0.3 }}
              className="relative p-5 mb-6 rounded-md max-w-2xl bg-gray-50 border border-gray-200"
            >
              <div className="flex items-start space-x-3">
                <RiInformationLine size={24} className="absolute -top-3 -left-3" />
                <p className="text-gray-700">
                  Join a team to collaborate on ski testing, share results, and view insights from your teammates.
                  Coaches and brands can create and manage multiple teams and events.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-col md:flex-row w-full space-x-3 gap-4 md:items-end justify-between">
          {canCreateTeam && (
            <Button
              onClick={() => router.push('/teams/create')}
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
      <section className="space-y-6 mt-8">
        {loading && (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 border border-red-200 px-4 py-3 rounded-md">
            <strong>Error loading teams:</strong> {error.message}
          </div>
        )}

        {!loading && !error && (
          <TeamList teams={teams} />
        )}

        {!user && <span className='mt-4 italic'>You are not signed in</span>}

        {(!loading && !error && teams.length === 0 && user) && (
          <p className="mt-4 text-gray-600">You haven’t joined any teams yet.</p>
        )}
      </section>
    </div>
  );
}
