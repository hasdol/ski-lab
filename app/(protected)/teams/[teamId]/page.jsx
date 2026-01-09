'use client';
import React, { useRef, useState, useEffect } from 'react';
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
import { RiTeamLine, RiVerifiedBadgeFill } from 'react-icons/ri';
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
import TeamTestInventory from './components/TeamTestInventory';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const { team, events, loading, error } = useSingleTeam(teamId);

  const [activeTab, setActiveTab] = useState('events');
  const tabPanelRef = useRef(null);

  const setActiveTabAndFocus = (nextTab) => {
    setActiveTab(nextTab);
    requestAnimationFrame(() => {
      tabPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      tabPanelRef.current?.focus({ preventScroll: true });
    });
  };
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [memberCap, setMemberCap] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState([]); // <-- FIX: define state
  const isMod = team?.mods?.includes(user?.uid);
  const isCreator = team?.createdBy === user?.uid;
  const teamAdmin = isCreator || isMod;

  const creatorPlanAllowsTeams = ['coach', 'company', 'admin'].includes(userData?.plan);
  const canCreateNewEvents = teamAdmin && (!isCreator || creatorPlanAllowsTeams);

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

    // Keep explicit caps, even 0 (downgraded teams). Treat non-finite as unknown.
    const cap = Number.isFinite(capRaw) ? Number(capRaw) : null;
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

  const [copied, setCopied] = useState(false);
  const copyJoinCode = async () => {
    try {
      const code = team?.joinCode || '';
      if (!code) return;

      // Clipboard API may be unavailable outside secure contexts.
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        window.prompt('Copy join code:', code);
        return;
      }

      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
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

  const toMillis = (v) => {
    if (!v) return null;
    if (typeof v.toMillis === 'function') return v.toMillis(); // Firestore Timestamp
    if (typeof v.seconds === 'number') return v.seconds * 1000; // Timestamp-like
    if (v instanceof Date) return v.getTime();
    const parsed = Date.parse(v);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getStartMs = (evt) => toMillis(evt?.startDate) ?? 0;
  events.forEach(evt => {
    const startMs = toMillis(evt.startDate);
    const endMs = toMillis(evt.endDate);
    const start = startMs ? new Date(startMs) : null;
    const end = endMs ? new Date(endMs) : null;
    if (start && end) {
      if (now >= start && now <= end) categorized.live.push(evt);
      else if (now < start) categorized.upcoming.push(evt);
      else categorized.past.push(evt);
    }
  });

  // Sort events by date (instead of implicit Firestore order, which can look like name order)
  categorized.live.sort((a, b) => getStartMs(a) - getStartMs(b));
  categorized.upcoming.sort((a, b) => getStartMs(a) - getStartMs(b));
  categorized.past.sort((a, b) => getStartMs(b) - getStartMs(a));

  const headerActions = (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      <Button onClick={handleBack} className='flex items-center' variant="secondary">
        <MdArrowBack className='mr-1' /> Back to Teams
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
          {memberCap != null && memberCap > 0 ? ` / ${memberCap}` : ''} members
          {memberCap != null && (
            (memberCap > 0 && team.members.length >= memberCap) ||
            (memberCap === 0 && team.members.length > 0)
          ) && (
              <span className="ml-2 text-red-600 font-semibold">
                {memberCap === 0 || team.members.length > memberCap ? '(Over cap)' : '(Full)'}
              </span>
            )}
        </span>
        <span>
          <span className="font-semibold text-gray-700">{events.length}</span> events
        </span>

        {team.isPublic ? (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
            <MdPublic />
            Public
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-semibold">
            <MdPublicOff />
            Private
          </span>
        )}
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
            {team.verified && (
              <span className="inline-flex items-center text-blue-700 font-semibold">
                <RiVerifiedBadgeFill className="text-blue-600" aria-hidden="true" />
                <span className="sr-only">Verified</span>
              </span>
            )}
          </span>
        }
        subtitle={headerSubtitle}
        actions={headerActions}
      />

      {/* Plan/cap warnings */}
      {isCreator && !creatorPlanAllowsTeams && (
        <div className="flex flex-col gap-3 md:flex-row mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-5 items-center justify-between">
          <span>
            Your current plan doesn’t include team management. You can view existing content, but can’t create new team events.
          </span>
          <Button variant="primary" onClick={() => router.push('/pricing')}>
            Upgrade
          </Button>
        </div>
      )}

      {isCreator && memberCap != null && (
        (memberCap > 0 && team.members.length >= memberCap) ||
        (memberCap === 0 && team.members.length > 0)
      ) && (
          <div className="flex flex-col gap-3 md:flex-row mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-5 items-center justify-between">
            <span>
              Team member limit reached for your current plan. New members can’t join until you upgrade or remove members.
            </span>
            <Button variant="primary" onClick={() => router.push('/pricing')}>
              Upgrade
            </Button>
          </div>
        )}

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-stretch md:items-start">
          {/* Image: no fixed box; scales naturally with a max-height */}
          <div className="w-full md:w-5/12 lg:w-1/3 flex justify-center md:justify-start">
            <UploadableImage
              photoURL={team.imageURL}
              variant="team"
              alt="team image"
              clickable={false}
              className="w-full max-w-xs md:max-w-none h-auto max-h-24 md:max-h-32 object-contain"
            />
          </div>

          {/* Content */}
          <div className="flex-1 w-full space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">About</div>
              {team.description ? (
                <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                  {team.description}
                </div>
              ) : (
                <div className="text-gray-500">No team description provided.</div>
              )}
            </div>

            {(teamAdmin || team.isPublic) && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Join code</div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-semibold bg-blue-50 ring-1 ring-blue-200 text-blue-800 px-4 py-2 rounded-2xl">{team.joinCode}</span>
                  <Button onClick={copyJoinCode} variant="secondary" className="text-sm"> 
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'events'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTabAndFocus('events')}
        >
          Events
        </button>

        <button
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'info'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTabAndFocus('info')}
        >
          Info
        </button>

        {/* NEW: Members tab */}
        <button
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'members'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTabAndFocus('members')}
        >
          Members
        </button>

        {teamAdmin && (
          <button
            className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'dashboard'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
            onClick={() => setActiveTabAndFocus('dashboard')}
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
      <div ref={tabPanelRef} tabIndex={-1} className="outline-none scroll-mt-24 md:scroll-mt-8">
        {activeTab === 'events' && (
          <div className="space-y-6 w-full">
            {teamAdmin && (
              <Button
                onClick={() => router.push(`/teams/${teamId}/create`)}
                variant="primary"
                className="flex mx-auto"
                disabled={!canCreateNewEvents}
                title={!canCreateNewEvents ? (isCreator ? 'Upgrade required to create new team events' : 'Team owner must have a team plan to create events') : 'Create a new event'}
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
                      const start = new Date(toMillis(evt.startDate));
                      const end = new Date(toMillis(evt.endDate));
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
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold mt-2 ${vis === 'staff'
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

        {/* Members content */}
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
      </div>

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

          <TeamTestInventory teamId={teamId} />

          <TeamEventDashboard teamId={teamId} />
          {/* Removed Members card from dashboard (now in Members tab) */}
        </div>
      )}
    </>
  );
}