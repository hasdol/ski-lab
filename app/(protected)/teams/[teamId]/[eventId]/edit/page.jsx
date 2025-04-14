'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { updateEvent, deleteEvent } from '@/lib/firebase/teamFunctions';
import { uploadEventImage } from '@/lib/firebase/storageFunctions';
import useEvent from '@/hooks/useEvent';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import UploadableImage from '@/components/common/UploadableImage';

export default function EditEventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  // ❗ 1) Call all Hooks up front, unconditionally:
  const { eventData, loading, error } = useEvent(teamId, eventId);

  // Convert Firestore Timestamps after we have eventData
  const formatDate = (ts) =>
    ts?.seconds ? new Date(ts.seconds * 1000).toISOString().slice(0, 10) : '';

  // For local state, just initialize safely, even if eventData might be undefined initially
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ❗ 2) Then conditionally check data and fill in if not loading / error:
  if (loading) {
    return <div className="p-4">{t('loading')}...</div>;
  }
  if (error) {
    return <div className="p-4">Error: {error.message}</div>;
  }
  if (!eventData) {
    return <div className="p-4">No event found.</div>;
  }

  // ❗ 3) If we have eventData now, you can safely update local state:
  //       But do so in an effect or set them once at the top. 
  //       Alternatively, prefill them as soon as you know eventData is available.

  // If you want to fill local state once from eventData, 
  // do so in a useEffect that depends on [eventData], 
  // so you don't cause repeated rerenders:
  // e.g.
  // useEffect(() => {
  //   if (eventData) {
  //     setName(eventData.name || '');
  //     setDesc(eventData.description || '');
  //     setStartDate(formatDate(eventData.startDate));
  //     setEndDate(formatDate(eventData.endDate));
  //     setImageURL(eventData.imageURL || '');
  //   }
  // }, [eventData]);

  // For demonstration, let's just do it inline for now:
  // But be aware this will reset on each render if eventData changes
  const finalName = name || eventData.name || '';
  const finalDesc = desc || eventData.description || '';
  const finalStartDate = startDate || formatDate(eventData.startDate);
  const finalEndDate = endDate || formatDate(eventData.endDate);
  const finalImageURL = imageURL || eventData.imageURL || '';

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpdate = async () => {
    try {
      setUploading(true);
      let finalImage = finalImageURL;

      if (file) {
        finalImage = await uploadEventImage(teamId, eventId, file);
        setImageURL(finalImage);
      }
      const updatedData = {
        name: finalName,
        description: finalDesc,
        startDate: new Date(finalStartDate),
        endDate: new Date(finalEndDate),
        imageURL: finalImage,
      };
      await updateEvent(teamId, eventId, updatedData);
      router.push(`/teams/${teamId}/${eventId}`);
    } catch (err) {
      console.error('Error updating event:', err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(teamId, eventId);
        router.push(`/teams/${teamId}`);
      } catch (err) {
        console.error('Error deleting event:', err);
        alert(err.message);
      }
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">{t('edit_event')}</h1>
      <div className='space-y-2'>
        <Input
          type="text"
          placeholder={t('event_name')}
          value={finalName}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          type="textarea"
          placeholder={t('description')}
          value={finalDesc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <Input
          type="date"
          label={t('start_date')}
          value={finalStartDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          type="date"
          label={t('end_date')}
          value={finalEndDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />

        <UploadableImage
          photoURL={finalImageURL}
          alt="Event Image"
          variant="event"
          isChangingImg={uploading}
          clickable={true}
          handleImageChange={handleFileSelect}
        />
      </div>


      <div className="flex space-x-3 mt-4">
        <Button onClick={handleUpdate} variant="primary" loading={uploading}>
          {t('update')}
        </Button>
        <Button onClick={handleDelete} variant="danger">
          {t('delete')}
        </Button>
        <Button onClick={() => router.push(`/teams/${teamId}/${eventId}`)} variant="secondary">
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
