'use client';
import React, { useState, useEffect } from 'react';
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
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import { MdEvent, MdArrowBack } from 'react-icons/md';

export default function EventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { eventData, loading, error } = useEvent(teamId, eventId);
  const { userData, user } = useAuth();

  const canManage = ['coach', 'company'].includes(userData?.plan);
  const [activeTab, setActiveTab] = useState('Info');
  const [teamMeta, setTeamMeta] = useState(null);

  // Subscribe to team meta for owner/mod check
  useEffect(() => {
    if (!teamId) return;
    const ref = doc(db, 'teams', teamId);
    const unsub = onSnapshot(ref, snap => {
      setTeamMeta(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [teamId]);

  const isOwner = teamMeta?.createdBy === user?.uid;
  const isMod = (teamMeta?.mods || []).includes(user?.uid);
  const canSeeDashboard = isOwner || isMod;

  // If activeTab is Dashboard but user lost permission, force Info
  useEffect(() => {
    if (activeTab === 'Dashboard' && !canSeeDashboard) {
      setActiveTab('Info');
    }
  }, [activeTab, canSeeDashboard]);

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
      <div className="bg-red-50 text-red-700 rounded-2xl p-6 border border-red-200">
        Error: {error.message}
      </div>
    );
  }
  if (!eventData) {
    return (
      <div className="bg-yellow-50 text-yellow-800 rounded-2xl p-6 border border-yellow-200">
        No event found
      </div>
    );
  }

  // Format dates
  const start = eventData.startDate?.seconds && new Date(eventData.startDate.seconds * 1000);
  const end = eventData.endDate?.seconds && new Date(eventData.endDate.seconds * 1000);
  const startFmt = formatDate(start);
  const endFmt = formatDate(end);

  const headerActions = (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      <Button onClick={handleBack} className='flex items-center' variant="secondary">
        <MdArrowBack className='mr-1'/> Back to Team
      </Button>
      {canManage && (
        <Button onClick={handleEdit} variant="primary">
          Edit Event
        </Button>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        icon={<MdEvent className="text-blue-600 text-2xl" />}
        title={eventData.name}
        subtitle={`${startFmt} – ${endFmt}`}
        actions={headerActions}
      />

      <Card className="mb-6">
        <div className="flex flex-col items-center text-center gap-3">
          <UploadableImage
            photoURL={eventData.imageURL}
            variant="event"
            clickable={false}
            className="mx-auto w-full max-h-40 object-contain"
          />
        </div>
      </Card>

      <EventTabs activeTab={activeTab} setActiveTab={setActiveTab} canSeeDashboard={canSeeDashboard} />

      <div className="mt-4">
        {activeTab === 'Info' && (
          <Card>
            <EventOverview eventData={eventData} />
          </Card>
        )}
        {activeTab === 'Tests' && (
          <EventTests teamId={teamId} eventId={eventId} eventData={eventData} />
        )}
        {activeTab === 'Weather' && (
          <Card>
            <EventWeather eventData={eventData} />
          </Card>
        )}
        {activeTab === 'Dashboard' && canSeeDashboard && (
          <TeamEventDashboard teamId={teamId} eventId={eventId} />
        )}
      </div>
    </>
  );
}
