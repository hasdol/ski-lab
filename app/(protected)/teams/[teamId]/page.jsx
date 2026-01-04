'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useSingleTeam from '@/hooks/useSingleTeam';
import Button from '@/components/ui/Button';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import { removeTeamMember, leaveTeam } from '@/lib/firebase/teamFunctions';
import Spinner from '@/components/common/Spinner/Spinner';
import { motion } from 'framer-motion';
import PendingJoinRequests from '@/app/(protected)/teams/[teamId]/components/PendingJoinRequests';
import { MdEvent, MdPublicOff, MdPublic, MdArrowBack } from "react-icons/md";
import { RiTeamLine } from 'react-icons/ri';
import PageHeader from '@/components/layout/PageHeader';

import { getFunctions, httpsCallable } from 'firebase/functions';

// Import Firestore functions to fetch pending join requests count
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { TEAM_PLAN_CAPS } from '@/lib/constants/teamPlanCaps';
import TeamInfo from './components/TeamInfo';
import TeamEventDashboard from '@/components/analytics/TeamEventDashboard';
import Card from '@/components/ui/Card';
import { formatDateRange } from '@/helpers/helpers';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const { team, events, loading, error } = useSingleTeam(teamId);

  const [activeTab, setActiveTab] = useState('events');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [memberCap, setMemberCap] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState([]); // <-- FIX: define state
  const isMod = team?.mods?.includes(user?.uid);
  const isCreator = team?.createdBy === user?.uid;
  const teamAdmin = isCreator || isMod;
  const canManageEvents = teamAdmin; // old: canManage
  // Replace uses of `canManage` for team actions:
  // const canManage = ['coach', 'company'].includes(userData?.plan);

  // Fetch pending join requests count — creator only
  useEffect(() => {
    if (!teamId || !teamAdmin) return;
    const requestsRef = collection(db, 'teams', teamId, 'joinRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRequestCount(snapshot.docs.length);
    });
    return () => unsubscribe();
  }, [teamId, teamAdmin]);

  // Load member profiles when owner/mod views Dashboard OR Members tab
  useEffect(() => {
    if (!teamAdmin) return;
    if (activeTab !== 'dashboard' && activeTab !== 'members') return;

    (async () => {
      try {
        const fn = httpsCallable(getFunctions(), 'getTeamMemberProfiles');
        const res = await fn({ teamId });
        setMemberProfiles(res.data || []);
      } catch (e) {
        console.error('Load member profiles failed', e);
        setMemberProfiles([]);
      }
    })();
  }, [teamAdmin, activeTab, teamId, team?.members?.length]);

  // Fetch owner plan to derive member cap for display
  useEffect(() => {
    // If you are the creator, derive cap from your own userData (no extra reads)
    if (!isCreator) return;

    const capRaw = Number.isFinite(userData?.planMembersCap)
      ? userData.planMembersCap
      : (TEAM_PLAN_CAPS[userData?.plan]?.members ?? null);

    // FIX: treat 0/invalid as "no cap to display" (prevents "members0")
    const cap =
      Number.isFinite(capRaw) && Number(capRaw) > 0 ? Number(capRaw) : null;

    setMemberCap(cap);
  }, [isCreator, userData?.plan, userData?.planMembersCap]);

  const handleBack = () => router.push('/teams');

  const handleKick = async (memberId) => {
    if (memberId === user.uid) {
      alert("You cannot remove yourself from the team. Please use the leave team option.");
      return;
    }
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await removeTeamMember(teamId, memberId); // CF wrapper
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return;
    try {
      await leaveTeam(user.uid, team.id); // use auth uid
      router.push('/teams');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to leave team.');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Spinner size="lg" className="text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-6">
      Error loading team: {error.message}
    </div>
  );

  if (!team && !loading) return (
    <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg p-6">
      No team found
    </div>
  );

  // Categorize events
  const now = new Date();
  const categorized = { live: [], upcoming: [], past: [] };
  events.forEach(evt => {
    const start = evt.startDate?.seconds && new Date(evt.startDate.seconds * 1000);
    const end = evt.endDate?.seconds && new Date(evt.endDate.seconds * 1000);
    if (start && end) {
      if (now >= start && now <= end) categorized.live.push(evt);
      else if (now < start) categorized.upcoming.push(evt);
      else categorized.past.push(evt);
    }
  });

  const headerActions = (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      <Button onClick={handleBack} className='flex items-center' variant="secondary">
        <MdArrowBack className='mr-1'/> Back to Teams
      </Button>
      {teamAdmin && (
        <Button
          onClick={() => router.push(`/teams/${teamId}/edit`)}
          variant="primary"
        >
          Edit Team
        </Button>
      )}
      {user.uid !== team.createdBy && (
        <Button variant="danger" onClick={handleLeaveTeam}>
          Leave Team
        </Button>
      )}
    </div>
  );

  const headerSubtitle = (
    <>
      <span className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
        <span>
          <span className="font-semibold text-gray-700">{team.members.length}</span>
          {memberCap != null ? ` / ${memberCap}` : ''} members
          {memberCap != null && team.members.length >= memberCap && (
            <span className="ml-2 text-red-600 font-semibold">(Full)</span>
          )}
        </span>
        <span>
          <span className="font-semibold text-gray-700">{events.length}</span> events
        </span>
      </span>
    </>
  );

  return (
    <>
      <PageHeader
        icon={<RiTeamLine className="text-blue-600 text-2xl" />}
        title={
          <span className="inline-flex items-center justify-center md:justify-start gap-2">
            {team.name}
            {team.isPublic ? (
              <MdPublic title="Public Team" className="text-blue-600" />
            ) : (
              <MdPublicOff title="Private Team" className="text-gray-700" />
            )}
          </span>
        }
        subtitle={headerSubtitle}
        actions={headerActions}
      />

      {/* Upgrade notice for owners who can't manage events anymore */}
      {isCreator && !canManageEvents && (
        <div className="flex flex-col gap-3 md:flex-row mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-5 items-center justify-between">
          <span>
            Your current plan doesn’t allow team management. Upgrade to manage teams.
          </span>
          <Button variant="primary" onClick={() => router.push('/pricing')}>
            Upgrade
          </Button>
        </div>
      )}

      <Card className="mb-6">
        <div className="flex flex-col items-center text-center gap-3">
          <UploadableImage
            photoURL={team.imageURL}
            variant="team"
            alt="team image"
            clickable={false}
            className="mx-auto w-full max-h-40 object-contain"
          />

          {/*
            Show join code to:
              - team creator (isCreator)
              - users with manage privileges (canManage)
              - or when the team is public
          */}
          {(teamAdmin || team.isPublic) && (
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800 text-center">
              <span className="font-medium">Join code:</span>
              <span className="font-mono ml-2 bg-blue-100 px-2 py-1 rounded-lg">
                {team.joinCode}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'events'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>

        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'info'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('info')}
        >
          Info
        </button>

        {/* NEW: Members tab */}
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'members'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('members')}
        >
          Members
        </button>

        {teamAdmin && (
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTab('dashboard')}
            title="Owner/moderator dashboard"
          >
            <span className="inline-flex items-center gap-2">
              Dashboard
              {pendingRequestCount > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-semibold text-white bg-red-600 rounded-full"
                  aria-label={`${pendingRequestCount} pending join request${pendingRequestCount > 1 ? 's' : ''}`}
                >
                  {pendingRequestCount}
                </span>
              )}
            </span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <div className="space-y-6 w-full">
              {teamAdmin && (
                <Button
                  onClick={() => router.push(`/teams/${teamId}/create`)}
                  variant="primary"
                  className="flex mx-auto"
                >
                  Create New Event
                </Button>
              )}
              {Object.entries(categorized).map(([category, events]) => (
                events.length > 0 && (
                  <div key={category} className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                      {category} Events
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                      {events.map((evt) => {
                        const start = new Date(evt.startDate.seconds * 1000);
                        const end = new Date(evt.endDate.seconds * 1000);
                        const vis = evt.resultsVisibility || 'team';
                        return (
                          <motion.div
                            key={evt.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Card>
                              <div className="flex justify-between items-center space-x-4">
                                <div>
                                  <h3 className="font-semibold text-gray-800">{evt.name}</h3>
                                  <p className="flex items-center text-sm text-gray-500 mt-1">
                                    <MdEvent className="mr-1" />
                                    {formatDateRange(start, end)}
                                  </p>
                                  {/* Visibility badge */}
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold mt-2 ${
                                      vis === 'staff'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}
                                    title={
                                      vis === 'staff'
                                        ? 'Only owner & mods can view event test results'
                                        : 'All team members can view event test results'
                                    }
                                  >
                                    {vis === 'staff' ? 'Sharing: Owner/mods only' : 'Sharing: Team members'}
                                  </span>
                                </div>

                                <Button
                                  onClick={() => router.push(`/teams/${team.id}/${evt.id}`)}
                                  variant="secondary"
                                  className="text-sm"
                                >
                                  View
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="mb-6 w-full">
          <TeamInfo teamId={teamId} canPost={isCreator || isMod} />
        </div>
      )}

      {/* NEW: Members content */}
      {activeTab === 'members' && (
        <div className="mb-6 space-y-6">
          {teamAdmin ? (
            <Card className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">Members</h2>
              <div className="space-y-3 mb-2">
                {memberProfiles.map((m) => (
                  <div
                    key={m.uid}
                    className="flex items-center justify-between space-x-4 border-b border-gray-200 p-2"
                  >
                    <div className="flex items-center">
                      {m.photoURL ? (
                        <img
                          src={m.photoURL}
                          alt={m.displayName || m.uid}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium">
                            {(m.displayName || m.uid).charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="font-medium flex items-center gap-2">
                        {m.displayName || m.uid}
                        {team.mods?.includes(m.uid) && m.uid !== team.createdBy && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">MOD</span>
                        )}
                        {m.uid === team.createdBy && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">OWNER</span>
                        )}
                      </div>
                    </div>

                    {m.uid !== user.uid && (
                      <Button
                        variant="danger"
                        className="text-xs px-3 py-1"
                        onClick={() => handleKick(m.uid)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="text-sm text-gray-600">
              Member list is visible to the team owner and mods.
            </Card>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && teamAdmin && (
        <div className="mb-6 space-y-6">
          {pendingRequestCount > 0 && (
            <Card className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                Join Requests
              </h2>
              <PendingJoinRequests teamId={teamId} />
            </Card>
          )}

          <TeamEventDashboard teamId={teamId} />
          {/* Removed Members card from dashboard (now in Members tab) */}
        </div>
      )}
    </>
  );
}