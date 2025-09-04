'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import useUserTeams from '@/hooks/useUserTeams';
import usePublicTeams from '@/hooks/usePublicTeams';
import JoinTeamModal from './components/JoinTeamModal';
import UserTeamsList from './components/UserTeamsList';
import PublicTeamsList from './components/PublicTeamsList';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import {
  RiInformationLine,
  RiTeamLine,
  RiAddLine,
  RiSearchLine
} from 'react-icons/ri';
import { AnimatePresence, motion } from 'framer-motion';

export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useUserTeams();
  const {
    teams: publicTeams,
    loading: publicLoading,
    error: publicError,
    hasMore,
    fetchMore,
    refresh: refreshPublic
  } = usePublicTeams();
  const canCreateTeam = ['coach', 'company', 'admin'].includes(userData?.plan);
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [pendingTeams, setPendingTeams] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [currentPendingTeamId, setCurrentPendingTeamId] = useState(null);
  const [activeTab, setActiveTab] = useState('myTeams'); // 'myTeams' or 'publicTeams'
  const [preFilledCode, setPreFilledCode] = useState('');

  // When a join is initiated, store the team ID and open the modal
  const handleJoinTeam = (team) => {
    setPreFilledCode(team.joinCode);
    setCurrentPendingTeamId(team.id);
    setShowJoinModal(true);
    setPendingTeams(prev => [...prev, team.id]);
  };

  // When closing the modal (e.g., cancel), remove the pending team ID if not joined
  const handleModalClose = () => {
    setShowJoinModal(false);
    setPreFilledCode('');
    // Remove the pending team ID from pendingTeams
    setPendingTeams(prev => prev.filter(id => id !== currentPendingTeamId));
    setCurrentPendingTeamId(null);
  };

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <RiTeamLine className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            <div className="text-xs text-gray-600 mt-1 flex flex-col gap-2">
              <span>View and manage your teams</span>
            </div>

          </div>
          <Button
            onClick={() => setShowInfo(prev => !prev)}
            variant="secondary"
            className="flex items-center gap-2 ml-auto"
            aria-label={showInfo ? 'Hide information' : 'Show information'}
            aria-expanded={showInfo}
          >
            <RiInformationLine size={18} />
          </Button>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-3">
          {canCreateTeam && (
            <Button
              onClick={() => router.push('/teams/create')}
              variant="primary"
              className="flex items-center gap-2"
            >
              <RiAddLine size={18} />
              Create Team
            </Button>
          )}

          {user &&
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <RiSearchLine size={18} />
              Join a Team
            </Button>
          }

        </div>
      </div>

      {/* Info Box */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}

          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <RiInformationLine className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-blue-800">
                  Join a team to collaborate on ski testing, share results, and view
                  insights with your teammates. Coaches and brands can create and
                  manage multiple teams and events.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'myTeams'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('myTeams')}
        >
          My Teams
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'publicTeams'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('publicTeams')}
        >
          Public Teams
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'myTeams' && (
        <>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" className="text-indigo-600" />
              <p className="mt-4 text-gray-600 font-medium">
                Loading your teams...
              </p>
            </div>
          )}
          {error && (
            <div
              className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-lg mb-6"
              role="alert"
            >
              <strong className="font-medium">Failed to load teams</strong>
              <p className="mt-1">
                Please try refreshing the page or contact support if the problem
                persists.
              </p>
            </div>
          )}
          {!loading && !error && teams.length > 0 && (
            <UserTeamsList teams={teams} />
          )}
          {!loading && !error && teams.length === 0 && user && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiTeamLine className="text-gray-500 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Teams Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You haven't joined any teams. Join an existing team or create your own
                to get started.
              </p>
            </div>
          )}
          {!user && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <RiTeamLine className="text-gray-500 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Please sign in to view and manage your teams.
              </p>
              <Button onClick={() => router.push('/login')} variant="primary">
                Sign In
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'publicTeams' && (
        <>
          {/* Public Teams List */}
          <PublicTeamsList
            teams={publicTeams}
            loading={publicLoading}
            error={publicError}
            hasMore={hasMore}
            onLoadMore={fetchMore}
            onRefresh={refreshPublic}
            onJoin={handleJoinTeam}
            pendingTeams={pendingTeams}
          />
        </>
      )}

      <JoinTeamModal
        isOpen={showJoinModal}
        onClose={handleModalClose}
        preFilledCode={preFilledCode}
        onJoinSuccess={() => {
          // On success, you can leave the pending state (or update it if needed)
          setShowJoinModal(false);
          setPreFilledCode('');
          setCurrentPendingTeamId(null);
        }}
      />
    </div>
  );
}