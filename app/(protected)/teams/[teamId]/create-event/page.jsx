'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createEvent, updateEvent } from '@/lib/firebase/teamFunctions';
import { uploadEventImage } from '@/lib/firebase/storageFunctions';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import UploadableImage from '@/components/common/UploadableImage';
import GeocodeInput from '@/components/GeocodeInput/GeocodeInput';

export default function CreateEventPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

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
    <div className="mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 my-4">
        {t('create_event')}
      </h1>

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
        label={t('start_date')}
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />
      <Input
        type="date"
        name="endDate"
        label={t('end_date')}
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        required
      />

      <GeocodeInput
        label="Event Location"
        onLocationSelect={(lat, lon, address) => setLocation({ lat, lon, address })}
      />

      <UploadableImage
        photoURL={imageURL}
        isChangingImg={uploading}
        handleImageChange={handleFileChange}
        variant="event"
        alt="Event Image"
        clickable={true}
      />

      <div className="flex gap-3 mt-4">
        <Button onClick={handleCreate} variant="primary" loading={uploading}>
          {t('create')}
        </Button>
        <Button onClick={() => router.push(`/teams/${teamId}`)} variant="secondary">
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
