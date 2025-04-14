'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useSingleTeam from '@/hooks/useSingleTeam';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import UploadableImage from '@/components/common/UploadableImage';
import { RiAddLargeLine } from 'react-icons/ri';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { userData } = useAuth();
  const { team, events, loading, error } = useSingleTeam(teamId);
  const { t } = useTranslation();

  const canManage = userData?.plan === 'coach' || userData?.plan === 'company';

  // Instead of `router.back()`, navigate specifically or keep it as is:
  const handleBackClick = () => {
    router.push(`/teams`);
  };

  if (loading) return <div>Loading Team...</div>;
  if (error) return <div>Error loading team: {error.message}</div>;
  if (!team) return <div>No team found.</div>;

  return (
    <div className="p-4">
      <Button onClick={handleBackClick} variant="secondary">
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
        <h5 className='text-sm'>{t('members')}: {team.members.length}</h5>

        {canManage && <p>Join Code: {team.joinCode}</p>}
        

        {canManage && (
          <div className="flex space-x-3 my-3">
            {/* Navigate to the new edit page instead of opening a modal */}
            <Button onClick={() => router.push(`/teams/${teamId}/edit`)} variant="primary">
              {t('edit_team')}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-end my-4">
          <h2 className="text-xl font-semibold">Events</h2>
          {canManage && (
            <Button onClick={() => router.push(`/teams/${teamId}/create-event`)} variant="primary">
              <RiAddLargeLine />
            </Button>
          )}

        </div>

        {!events.length && <p>No events yet.</p>}
        {events.map((evt) => {
          const start = evt.startDate?.seconds ? new Date(evt.startDate.seconds * 1000) : null;
          const end = evt.endDate?.seconds ? new Date(evt.endDate.seconds * 1000) : null;
          const startDateFormatted = start?.toLocaleDateString();
          const endDateFormatted = end?.toLocaleDateString();

          return (
            <div
              key={evt.id}
              onClick={() => router.push(`/teams/${team.id}/${evt.id}`)}
              className="shadow bg-container p-4 mt-2 rounded cursor-pointer hover:bg-sbtn relative"
            >
              <h3 className="font-semibold">{evt.name}</h3>
              <p>{evt.description}</p>
              {start && end && <p>{startDateFormatted} - {endDateFormatted}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
