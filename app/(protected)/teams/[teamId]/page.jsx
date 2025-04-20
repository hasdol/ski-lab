'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useSingleTeam from '@/hooks/useSingleTeam';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import UploadableImage from '@/components/common/UploadableImage';
import MemberListItem from './components/MemberListItem';
import { removeTeamMember } from '@/lib/firebase/teamFunctions';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const { team, events, loading, error } = useSingleTeam(teamId);
  const { t } = useTranslation();

  const [viewMembers, setViewMembers] = useState(false)

  const canManage = userData?.plan === 'coach' || userData?.plan === 'company';

  const handleBackClick = () => {
    router.push(`/teams`);
  };

  if (loading) return <div>Loading Team...</div>;
  if (error) return <div>Error loading team: {error.message}</div>;
  if (!team) return <div>No team found.</div>;

  const now = new Date();

  const categorizedEvents = {
    live: [],
    upcoming: [],
    past: [],
  };

  events.forEach(evt => {
    const start = evt.startDate?.seconds ? new Date(evt.startDate.seconds * 1000) : null;
    const end = evt.endDate?.seconds ? new Date(evt.endDate.seconds * 1000) : null;

    if (start && end) {
      if (now >= start && now <= end) {
        categorizedEvents.live.push(evt);
      } else if (now < start) {
        categorizedEvents.upcoming.push(evt);
      } else if (now > end) {
        categorizedEvents.past.push(evt);
      }
    }
  });

  categorizedEvents.live.sort((a, b) => a.startDate.seconds - b.startDate.seconds);
  categorizedEvents.upcoming.sort((a, b) => a.startDate.seconds - b.startDate.seconds);
  categorizedEvents.past.sort((a, b) => b.endDate.seconds - a.endDate.seconds);

  const badgeStyles = {
    live: { color: 'text-red-500', dot: 'bg-red-500', label: 'Live' },
    upcoming: { color: 'text-yellow-500', dot: 'bg-yellow-400', label: 'Upcoming' },
    past: { color: 'text-gray-500', dot: 'bg-gray-400', label: 'Past' }
  };

  const handleKickMember = async (memberId) => {
    if (!confirm(t('confirm_kick_member'))) return;
    try {
      await removeTeamMember(team.id, memberId);
    } catch (err) {
      console.error(err);
      alert(t('kick_failed'));
    }
  };

  return (
    <div className="p-4">
      <Button onClick={handleBackClick} variant="secondary" className='text-xs'>
        {t('back')}
      </Button>

      <div className="text-center flex flex-col items-center">
        <UploadableImage
          photoURL={team.imageURL}
          variant="team"
          alt="Team"
          clickable={false}
        />
        <h1 className='font-semibold text-lg'>{team.name}</h1>
        {canManage ? <Button variant={`${viewMembers?'tab':'secondary'}`} className='text-xs my-2' onClick={() => setViewMembers(prev => !prev)}>{t('members')}: {team.members.length}</Button> :
          <span className='text-sm'>{t('members')}: {team.members.length}</span>
        }

        {canManage && viewMembers && (
          <div className="my-4 w-full animate-fade-down animate-duration-300">
            <h5 className="font-semibold text-sm mb-2">{t('teammembers')}</h5>
            <ul className="space-y-2">
              {team.members.map(memberId => (
                <li
                  key={memberId}
                  className="flex items-center justify-between px-3 py-1 bg-gray-50 rounded"
                >

                  <MemberListItem userId={memberId} />
                  {memberId !== userData.uid && (
                    <Button
                      onClick={() => handleKickMember(memberId)}
                      variant="danger"
                      className='text-xs'
                    >
                      {t('kick')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}


        {canManage && (
          <div className="mt-2 px-3 py-2 bg-gray-100 rounded text-sm text-gray-800">
            Join Code: <span className="font-mono">{team.joinCode}</span>
          </div>
        )}



        {canManage && (
          <div className="flex space-x-3 my-3">
            <Button onClick={() => router.push(`/teams/${teamId}/edit`)} variant="secondary" className='text-xs'>
              {t('edit_team')}
            </Button>
            <Button onClick={() => router.push(`/teams/${teamId}/create-event`)} variant="primary" className='text-xs'>
              {t('create_event')}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-2">
        {events.length === 0 && <p>No events yet.</p>}

        {['live', 'upcoming', 'past'].map(category => {
          const labelMap = {
            live: 'live_events',
            upcoming: 'upcoming_events',
            past: 'past_events'
          };

          if (!categorizedEvents[category].length) return null;

          return (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{t(labelMap[category])}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {categorizedEvents[category].map(evt => {
                  const start = new Date(evt.startDate.seconds * 1000);
                  const end = new Date(evt.endDate.seconds * 1000);
                  const startDateFormatted = start.toLocaleDateString();
                  const endDateFormatted = end.toLocaleDateString();
                  const badge = badgeStyles[category];

                  return (
                    <Button
                      key={evt.id}
                      onClick={() => router.push(`/teams/${team.id}/${evt.id}`)}
                      variant="secondary"
                      className="relative text-left"
                    >
                      <div className="absolute top-2 right-2 flex items-center">
                        <span className={`h-2 w-2 rounded-full mr-1 ${badge.dot} ${category === 'live' ? 'animate-pulse' : ''}`}></span>
                        <span className={`text-xs font-bold uppercase tracking-wide ${badge.color}`}>{badge.label}</span>
                      </div>

                      <h3 className="font-semibold text-base">{evt.name}</h3>
                      <p className="text-sm opacity-80">{startDateFormatted} - {endDateFormatted}</p>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
