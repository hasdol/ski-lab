'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useSingleTeam from '@/hooks/useSingleTeam';
import Button from '@/components/common/Button';
import UploadableImage from '@/components/common/UploadableImage';
import MemberListItem from './components/MemberListItem';
import { removeTeamMember } from '@/lib/firebase/teamFunctions';
import Spinner from '@/components/common/Spinner/Spinner';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const { team, events, loading, error } = useSingleTeam(teamId);

  const [activeTab, setActiveTab] = useState('events');
  const canManage = ['coach', 'company'].includes(userData?.plan);

  const handleBack = () => router.push('/teams');
  const handleKick = async (memberId) => {
    if (!confirm(t('confirm_kick_member'))) return;
    try { await removeTeamMember(team.id, memberId); }
    catch (e) { console.error(e); alert(t('kick_failed')); }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (error) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-red-50 text-red-700 rounded-md p-6">
        Error loading team: {error.message}
      </div>
    </div>
  );
  if (!team) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-yellow-50 text-yellow-800 rounded-md p-6">
        No team found
      </div>
    </div>
  );

  // categorize events
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
  ['live', 'upcoming', 'past'].forEach(cat =>
    categorized[cat].sort((a, b) => cat === 'past'
      ? b.endDate.seconds - a.endDate.seconds
      : a.startDate.seconds - b.startDate.seconds
    )
  );
  const badge = {
    live: { dot: 'bg-red-500', label: 'Live' },
    upcoming: { dot: 'bg-yellow-400', label: 'Upcoming' },
    past: { dot: 'bg-gray-400', label: 'Past' }
  };

  return (
    <div className='p-3 md:w-2/3 mx-auto'>
      {/* Back & Manage */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={handleBack} variant="secondary" >Back</Button>
        {canManage && (
          <div className="flex space-x-2">
            <Button onClick={() => router.push(`/teams/${teamId}/edit`)} variant="primary" >Edit Team</Button>
          </div>
        )}
      </div>

      <div className="">
        {/* Team Header */}
        <div className="flex flex-col items-center">
          <UploadableImage
            photoURL={team.imageURL}
            variant="team"
            alt='team image'
            clickable={false}
            className="w-auto mx-auto mb-4 md:h-52 h-40 object-contain"
          />
          <h1 className="text-2xl font-semibold mb-1 text-center">{team.name}</h1>
          <div className="flex space-x-4 text-sm text-gray-600 mb-6">
            <span>Members: {team.members.length}</span>
            <span>Events: {events.length}</span>
          </div>

          {canManage && (
            <div className="mb-6 px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-800 text-center">
              Join code <span className="font-mono">{team.joinCode}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-6 border-b mb-6">
            <button
              className={`pb-2 ${activeTab === 'events' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-600'}`}
              onClick={() => setActiveTab('events')}
            >
              Events
            </button>
            {canManage && (
              <button
                className={`pb-2 ${activeTab === 'members' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-600'}`}
                onClick={() => setActiveTab('members')}
              >
                Members
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'members' && canManage && (
            <ul className="space-y-2 w-full mb-6">
              {team.members.map(id => (
                <li key={id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                  <MemberListItem userId={id} />
                  {id !== userData.uid && (
                    <Button variant="danger" className="text-xs" onClick={() => handleKick(id)}>Kick</Button>
                  )}
                </li>
              ))}
            </ul>
          )}




          {activeTab === 'events' && (
            <div className="space-y-6 w-full">
              {canManage && <Button onClick={() => router.push(`/teams/${teamId}/create-event`)} variant="primary" className='w-full md:w-fit'>Create Event</Button>}
              {['live', 'upcoming', 'past'].map(cat => (
                categorized[cat].length > 0 && (
                  <div key={cat}>
                    <h2 className="text-lg font-semibold text-gray-800 mb-2 uppercase">{cat}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categorized[cat].map(evt => {
                        const start = new Date(evt.startDate.seconds * 1000);
                        const end = new Date(evt.endDate.seconds * 1000);
                        const b = badge[cat];
                        return (
                          <div
                            key={evt.id}
                            className="border border-gray-300 rounded-md cursor-pointer relative text-left p-4 overflow-hidden w-full"

                          >
                            <div className='flex justify-between'>
                              <div>
                                <h3 className="font-semibold text-base text-gray-800 break-words">{evt.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{start.toLocaleDateString()} - {end.toLocaleDateString()}</p>
                              </div>
                              <Button onClick={() => router.push(`/teams/${team.id}/${evt.id}`)} variant='secondary' className='text-sm mt-2'>View</Button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
