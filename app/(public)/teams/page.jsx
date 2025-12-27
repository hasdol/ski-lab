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
import { RiInformationLine, RiTeamLine, RiAddLine, RiSearchLine } from 'react-icons/ri';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import Search from '@/components/Search/Search';
import { useDebounce } from 'use-debounce';
import { TEAM_PLAN_CAPS } from '@/lib/constants/teamPlanCaps';
import Input from '@/components/ui/Input';
import { getFunctions, httpsCallable } from 'firebase/functions';
import JoinByCodePreviewModal from './components/JoinByCodePreviewModal';

export default function TeamsPage() {
  const { user, userData } = useAuth();
  const { teams, loading, error } = useUserTeams();

  // Public Teams search (server-side via hook) — keep only this
  const [publicSearchRaw, setPublicSearchRaw] = useState('');
  const [debouncedPublicSearch] = useDebounce(publicSearchRaw.toLowerCase(), 300);
  const {
    teams: publicTeams,
    loading: publicLoading,
    error: publicError,
    hasMore,
    fetchMore,
    refresh: refreshPublic
  } = usePublicTeams({ term: debouncedPublicSearch });

  const canCreateTeam = ['coach', 'company', 'admin'].includes(userData?.plan);
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(false);
  const [pendingTeams, setPendingTeams] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [currentPendingTeamId, setCurrentPendingTeamId] = useState(null);
  const [activeTab, setActiveTab] = useState('myTeams'); // 'myTeams' or 'publicTeams'
  const [preFilledCode, setPreFilledCode] = useState('');
  // NEW: inline join-by-code state
  const [codeInput, setCodeInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  // NEW: compute owned team count and cap to showcase in header and disable create
  const ownedTeamsCount =
    (teams || []).filter((t) => t.createdBy === user?.uid).length;
  const maxTeams = userData?.planTeamsCap ?? TEAM_PLAN_CAPS[userData?.plan]?.teams ?? 0;
  const atTeamCap = canCreateTeam && maxTeams > 0 && ownedTeamsCount >= maxTeams;

  // NEW: preview a team by code (no side effects)
  const handleFindTeamByCode = async (e) => {
    e.preventDefault();
    const code = (codeInput || '').trim();
    if (!code) return;
    setPreviewError('');
    setPreview(null);
    setPreviewLoading(true);
    try {
      const fn = httpsCallable(getFunctions(), 'previewTeamByCode');
      const res = await fn({ code });
      setPreview(res.data);
      setShowPreviewModal(true);
    } catch (err) {
      setPreviewError(err.message || 'Team not found for this code.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // NEW: header actions (removed the join-by-code button)
  const headerActions = (
    <div className="flex sm:flex-row gap-2 items-end sm:items-end">
      {canCreateTeam && (
        <Button
          onClick={() => router.push('/teams/create')}
          variant="primary"
          className="flex items-center gap-2"
          disabled={atTeamCap}
          title={atTeamCap ? 'Team limit reached for your plan' : 'Create team'}
        >
          <RiAddLine />
          <span>Create Team</span>
        </Button>
      )}
      <Button
        onClick={() => setShowInfo((o) => !o)}
        variant="secondary"
        className="flex items-center gap-2"
      >
        <RiInformationLine />
        {showInfo ? 'Hide Info' : 'Show Info'}
      </Button>
      {/* removed: header Join by Code button */}
    </div>
  );

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiTeamLine className="text-blue-600 text-2xl" />}
        title="Teams"
        subtitle={
          <>
            <span>
              <span className="font-semibold text-gray-700">{ownedTeamsCount}</span> / {maxTeams} teams created
              <span className="ml-2">({userData?.plan?.charAt(0).toUpperCase() + userData?.plan?.slice(1)} plan)</span>
            </span>
          </>
        }
        actions={headerActions}
      />

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
                <div className="text-blue-800">
                  <strong className="block mb-1">How the Teams page works:</strong>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Join a team to collaborate on ski testing and share results with teammates.</li>
                    <li>Browse public teams or search for teams to join using their team code.</li>
                    <li>Coaches and brands can create and manage multiple teams and events.</li>
                    <li>View team members, shared results, and team insights on the team detail page.</li>
                  </ul>
                </div>
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
          {/* NEW: Join by code (mobile-friendly) */}
          {user && (
            <div 
                            className={`p-6 rounded-2xl relative overflow-hidden flex flex-col bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs transition-colors duration-200`}
                              
            >
              <form onSubmit={handleFindTeamByCode} className="flex sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="Enter team code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.trim().toUpperCase())}
                  className="sm:flex-1"
                />
                <Button type="submit" variant="primary" loading={previewLoading} className="mt-auto">
                  Find
                </Button>
              </form>
              {previewError && (
                <div className="mt-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2">
                  {previewError}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Paste a team’s join code. You’ll preview the team before sending a request.
              </p>
            </div>
          )}

          {user ? (
            loading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Failed to load your teams.</p>
                <Button onClick={() => window.location.reload()} variant="primary">
                  Retry
                </Button>
              </div>
            ) : (
              <UserTeamsList teams={teams} />
            )
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mt-4">
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
          <div className="mb-4">
            <Search onSearch={setPublicSearchRaw} placeholder="Search public teams" />
          </div>

          {publicLoading && publicTeams.length === 0 ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
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
          )}
        </>
      )}

      {/* Existing join modal for public team "Join" buttons */}
      <JoinTeamModal
        isOpen={showJoinModal}
        onClose={handleModalClose}
        preFilledCode={preFilledCode}
        onJoinSuccess={() => {
          setShowJoinModal(false);
          setPreFilledCode('');
          setCurrentPendingTeamId(null);
        }}
      />

      {/* NEW: Preview modal (opens after Find) */}
      <JoinByCodePreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreview(null);
        }}
        team={preview}
        code={codeInput}
        onJoined={() => {
          setShowPreviewModal(false);
          setPreview(null);
          setCodeInput('');
        }}
      />
    </div>
  );
}