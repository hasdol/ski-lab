'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import Tabs from './components/Tabs';
import EventOverview from './components/EventOverview';
import EventTests from './components/EventTests';
import EventWeather from './components/EventWeather';
import useEvent from '@/hooks/useEvent';
import Button from '@/components/common/Button';
import UploadableImage from '@/components/common/UploadableImage';

export default function EventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { eventData, loading, error } = useEvent(teamId, eventId);
  const [activeTab, setActiveTab] = React.useState('overview');
  const { t } = useTranslation();

  const { userData } = useAuth();
  const canManage = userData?.plan === 'coach' || userData?.plan === 'company';

  const handleBackClick = () => {
    router.push(`/teams/${teamId}`);
  };

  if (loading) return <div className="p-4">Loading event...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;
  if (!eventData) return <div className="p-4">No event found.</div>;

  const start = eventData.startDate?.seconds
    ? new Date(eventData.startDate.seconds * 1000)
    : null;
  const end = eventData.endDate?.seconds
    ? new Date(eventData.endDate.seconds * 1000)
    : null;
  const startDateFormatted = start?.toLocaleDateString();
  const endDateFormatted = end?.toLocaleDateString();

  return (
    <div className="p-4">
      <Button onClick={handleBackClick} variant="secondary">
        {t('back')}
      </Button>

      <h1 className="text-3xl font-semibold text-center">{eventData.name}</h1>
      <p className="text-center mb-4 font-semibold">
        {startDateFormatted} - {endDateFormatted}
      </p>

      <UploadableImage
        photoURL={eventData.imageURL}
        variant="event"
        alt="Event"
        clickable={false} // read-only
      />

      {canManage && (
        <div className="flex justify-center mb-4">
          <Button
            variant="secondary"
            onClick={() => router.push(`/teams/${teamId}/${eventId}/edit`)}
            className='text-xs'
          >
            {t('edit_event')}
          </Button>
        </div>
      )}

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'overview' && <EventOverview eventData={eventData} />}
      {activeTab === 'tests' && <EventTests teamId={teamId} eventId={eventId} />}
      {activeTab === 'weather' && <EventWeather eventData={eventData} />}
    </div>
  );
}
