'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createEvent, deleteEvent, updateEvent } from '@/lib/firebase/teamFunctions';
import { uploadEventImage } from '@/lib/firebase/storageFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import GeocodeInput from '@/components/GeocodeInput/GeocodeInput';
import PageHeader from '@/components/layout/PageHeader';
import { RiCalendarEventLine } from "react-icons/ri";
import { MdArrowBack } from 'react-icons/md';


export default function CreateEventPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lon: null, address: '' });
  const [resultsVisibility, setResultsVisibility] = useState('team'); // NEW: per-event


  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleCreate = async () => {
    if (!name || !startDate || !endDate || !location.lat) return;

    try {
      setUploading(true);

      // 1. First create the event without an image
      const eventRef = await createEvent(
        teamId,
        name,
        desc,
        new Date(startDate),
        new Date(endDate),
        '',
        user.uid,
        location.lat,
        location.lon,
        location.address,
        resultsVisibility // NEW
      );

      // 2. If image selected, upload using the new event ID
      let finalImageURL = '';
      if (file) {
        finalImageURL = await uploadEventImage(teamId, eventRef.id, file, user.uid);
        // 3. Update the event with the image URL
        await updateEvent(teamId, eventRef.id, { imageURL: finalImageURL });
      }

      router.push(`/teams/${teamId}`);
    } catch (err) {
      console.error('Create event failed', err);
      // Optional: Delete event if image upload fails
      if (eventRef?.id) {
        await deleteEvent(teamId, eventRef.id);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={<RiCalendarEventLine className="text-blue-600 text-2xl" />}
        title="Create Event"
        subtitle="Create a new event for your team"
        actions={
          <Button
            onClick={() => router.push(`/teams/${teamId}`)}
            className='flex items-center'
            variant="secondary"
          >
            <MdArrowBack className='mr-1'/> Back to Team
          </Button>
        }
      />

      <div className="rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200 p-6 space-y-6">

        <Input
          type="text"
          name="eventName"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="textarea"
          name="description"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <Input
          type="date"
          name="startDate"
          label='Start date'
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          type="date"
          name="endDate"
          label='End date'
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        <GeocodeInput
          label="Event Location"
          onLocationSelect={(lat, lon, address) => setLocation({ lat, lon, address })}
        />

        <div className="space-y-2">
          <p className="text-sm text-gray-600">Event image (optional)</p>
          <UploadableImage
            photoURL={imageURL}
            handleImageChange={handleFileChange}
            variant="event"
            clickable={true}
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-2">Result visibility</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="resultsVisibility"
                value="team"
                checked={resultsVisibility === 'team'}
                onChange={() => setResultsVisibility('team')}
              />
              <span>All team members can view event test results</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="resultsVisibility"
                value="staff"
                checked={resultsVisibility === 'staff'}
                onChange={() => setResultsVisibility('staff')}
              />
              <span>Only owner & mods can view event test results</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleCreate} variant="primary" loading={uploading}>
            Create
          </Button>
        </div>
      </div>
    </>
  );
}
