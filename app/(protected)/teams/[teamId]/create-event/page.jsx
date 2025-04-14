'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createEvent } from '@/lib/firebase/teamFunctions';
import { uploadEventImage } from '@/lib/firebase/storageFunctions';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import UploadableImage from '@/components/common/UploadableImage';

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

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleCreate = async () => {
    if (!name || !startDate || !endDate) return;
    let finalImageURL = '';

    try {
      setUploading(true);

      if (file) {
        finalImageURL = await uploadEventImage(teamId, user.uid, file);
      }

      await createEvent(
        teamId,
        name,
        desc,
        new Date(startDate),
        new Date(endDate),
        finalImageURL,
        user.uid
      );

      router.push(`/teams/${teamId}`);
    } catch (err) {
      console.error('Create event failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">{t('new_event')}</h1>

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
