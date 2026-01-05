'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useEvent from '@/hooks/useEvent';
import Button from '@/components/ui/Button';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import EventTabs from './components/EventTabs';
import EventTests from './components/EventTests';
import EventWeather from './components/EventWeather';
import Spinner from '@/components/common/Spinner/Spinner';
import { formatDate } from '@/helpers/helpers';
import TeamEventDashboard from '@/components/analytics/TeamEventDashboard';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card';
import Markdown from '@/components/common/Markdown/Markdown';
import { MdEvent, MdArrowBack } from 'react-icons/md';
import TeamInfo from '../components/TeamInfo';

export default function EventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { eventData, loading, error } = useEvent(teamId, eventId);
  const { userData, user } = useAuth();

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
  const canManage = canSeeDashboard;

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
  const vis = eventData?.resultsVisibility ?? 'team';
  const address = eventData?.location?.address || '';

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
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Image: no fixed box; scales naturally with a max-height */}
          <div className="w-full md:w-5/12 lg:w-1/3">
            <UploadableImage
              photoURL={eventData.imageURL}
              variant="event"
              alt="event image"
              clickable={false}
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">About</div>
              {eventData.description ? (
                <div className="text-gray-800 text-base leading-relaxed">
                  <Markdown>{eventData.description}</Markdown>
                </div>
              ) : (
                <div className="text-gray-500 italic">Welcome! More information will be available soon.</div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase">Info</div>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-800">{address || 'No location set.'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-500">Sharing</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${vis === 'staff'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-green-100 text-green-700'
                      }`}
                    title={
                      vis === 'staff'
                        ? 'Only owner & mods can view event test results'
                        : 'All team members can view event test results'
                    }
                  >
                    {vis === 'staff' ? 'Owner/mods only' : 'Team members'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <EventTabs activeTab={activeTab} setActiveTab={setActiveTab} canSeeDashboard={canSeeDashboard} />

      <div className="mt-4">
        {activeTab === 'Info' && (
          <div className="mb-6 w-full">
            <TeamInfo teamId={teamId} canPost={canSeeDashboard} />
          </div>
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
