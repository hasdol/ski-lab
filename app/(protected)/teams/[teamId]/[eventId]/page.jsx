'use client';
import React from 'react';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useEvent from '@/hooks/useEvent';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import UploadableImage from '@/components/common/UploadableImage';
import Tabs from './components/Tabs';
import EventOverview from './components/EventOverview';
import EventTests from './components/EventTests';
import EventWeather from './components/EventWeather';
import Spinner from '@/components/common/Spinner/Spinner';

export default function EventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { eventData, loading, error } = useEvent(teamId, eventId);
  const { t } = useTranslation();
  const { userData } = useAuth();

  const canManage = ['coach', 'company'].includes(userData?.plan);
  const [activeTab, setActiveTab] = useState('overview');

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
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-700 rounded-md p-6">
          {t('error')}: {error.message}
        </div>
      </div>
    );
  }
  if (!eventData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 text-yellow-800 rounded-md p-6">
          {t('no_event_found')}
        </div>
      </div>
    );
  }

  // Format dates
  const start = eventData.startDate?.seconds && new Date(eventData.startDate.seconds * 1000);
  const end = eventData.endDate?.seconds && new Date(eventData.endDate.seconds * 1000);
  const startFmt = start?.toLocaleDateString();
  const endFmt = end?.toLocaleDateString();

  return (
    <div className="max-w-4xl mx-auto animate-fade-up animate-duration-300">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={handleBack} variant="secondary" className="text-xs">{t('back')}</Button>
        {canManage && (
          <Button onClick={handleEdit} variant="secondary" className="text-xs">{t('edit_event')}</Button>
        )}
      </div>

      <div className="bg-white rounded-md shadow p-6 md:p-8 space-y-4">
        <div className="text-center">
          <div className="w-1/2 h-auto mx-auto overflow-hidden mb-4">
            <UploadableImage
              photoURL={eventData.imageURL}
              variant="event"
              alt={t('event_image')}
              clickable={false}
              className="object-cover w-full h-full"
            />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800 mb-1">{eventData.name}</h1>
          <p className="text-sm text-gray-600">{startFmt} - {endFmt}</p>
        </div>

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="pt-4">
          {activeTab === 'overview' && <EventOverview eventData={eventData} />}
          {activeTab === 'tests' && <EventTests teamId={teamId} eventId={eventId} />}
          {activeTab === 'weather' && <EventWeather eventData={eventData} />}
        </div>
      </div>
    </div>
  );
}
