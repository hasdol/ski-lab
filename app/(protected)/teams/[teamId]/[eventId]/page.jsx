'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useEvent from '@/hooks/useEvent';
import Button from '@/components/ui/Button';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import EventTabs from './components/EventTabs';
import EventOverview from './components/EventOverview';
import EventTests from './components/EventTests';
import EventWeather from './components/EventWeather';
import Spinner from '@/components/common/Spinner/Spinner';
import { formatDate } from '@/helpers/helpers';
import TeamEventDashboard from '@/components/analytics/TeamEventDashboard';

export default function EventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { eventData, loading, error } = useEvent(teamId, eventId);
  const { userData } = useAuth();

  const canManage = ['coach', 'company'].includes(userData?.plan);
  const [activeTab, setActiveTab] = useState('Info');

  const handleBack = () => router.push(`/teams/${teamId}`);
  const handleEdit = () => router.push(`/teams/${teamId}/${eventId}/edit`);


  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto">
        <div className="bg-red-50 text-red-700 rounded-lg p-6">
          Error: {error.message}
        </div>
      </div>
    );
  }
  if (!eventData) {
    return (
      <div className="mx-auto">
        <div className="bg-yellow-50 text-yellow-800 rounded-lg p-6">
          No event found
        </div>
      </div>
    );
  }

  // Format dates
  const start = eventData.startDate?.seconds && new Date(eventData.startDate.seconds * 1000);
  const end = eventData.endDate?.seconds && new Date(eventData.endDate.seconds * 1000);
  const startFmt = formatDate(start);
  const endFmt = formatDate(end);

  return (
    <div className="max-w-4xl w-full self-center p-4">
      <div className="flex items-center justify-between">
        <Button onClick={handleBack} variant="secondary">
          Back 
        </Button>
        {canManage && (
          <Button onClick={handleEdit} variant="primary">
            Edit Event
          </Button>
        )}
      </div>

      <div className=" space-y-6">
        <div className="text-center">
          <UploadableImage
            photoURL={eventData.imageURL}
            variant="event"
            clickable={false}
            className="mx-auto mb-4 w-full max-h-40 object-contain"
          />
          <h1 className="text-3xl font-semibold text-gray-800 mb-1">
            {eventData.name}
          </h1>
          <p className="text-sm text-gray-600">{startFmt} - {endFmt}</p>
        </div>

        <EventTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="m-4">
          {activeTab === 'Info' && <EventOverview eventData={eventData} />}
          {activeTab === 'Tests' && <EventTests teamId={teamId} eventId={eventId} eventData={eventData} />}
          {activeTab === 'Weather' && <EventWeather eventData={eventData} />}
          {activeTab === 'Dashboard' && <TeamEventDashboard teamId={teamId} eventId={eventId} />}
        </div>
      </div>

    </div>
  );
}
