'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createEvent, updateEvent } from '@/lib/firebase/teamFunctions';
import { uploadEventImage } from '@/lib/firebase/storageFunctions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import GeocodeInput from '@/components/GeocodeInput/GeocodeInput';
import { RiCalendarEventLine } from "react-icons/ri";


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
        location.address
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
    <div className="max-w-4xl md:min-w-xl w-full self-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-100 p-2 rounded-lg">
          <RiCalendarEventLine className="text-blue-600 text-2xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-600">Create a new event for your team</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">

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
        
        <div className="flex gap-3 mt-6">
          <Button onClick={handleCreate} variant="primary" loading={uploading}>
            Create
          </Button>
          <Button onClick={() => router.push(`/teams/${teamId}`)} variant="secondary">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
