'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateEvent, deleteEvent } from '@/lib/firebase/teamFunctions';
import { deleteEventImage, uploadEventImage } from '@/lib/firebase/storageFunctions';
import useEvent from '@/hooks/useEvent';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import UploadableImage from '@/components/common/UploadableImage';
import { useAuth } from '@/context/AuthContext';
import GeocodeInput from '@/components/GeocodeInput/GeocodeInput';
import Spinner from '@/components/common/Spinner/Spinner';

export default function EditEventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const { eventData, loading, error } = useEvent(teamId, eventId);

  const formatDate = (ts) =>
    ts?.seconds ? new Date(ts.seconds * 1000).toISOString().slice(0, 10) : '';

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState({ lat: null, lon: null, address: '' });

  useEffect(() => {
    if (eventData) {
      setName(eventData.name || '');
      setDesc(eventData.description || '');
      setStartDate(formatDate(eventData.startDate));
      setEndDate(formatDate(eventData.endDate));
      setImageURL(eventData.imageURL || '');
      setLocation(eventData.location || { lat: null, lon: null, address: '' });
    }
  }, [eventData]);

  if (loading) return <Spinner />;
  if (error) return <div className="text-red-700">Error: {error.message}</div>;
  if (!eventData) return <div>No event found</div>;

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setImageURL(URL.createObjectURL(selected));
    }
  };

  const handleUpdate = async () => {
    setUploading(true);
    try {
      let finalImage = imageURL;
      if (file) {
        finalImage = await uploadEventImage(teamId, eventId, file, user.uid);
        setImageURL(finalImage);
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      await updateEvent(teamId, eventId, {
        name,
        description: desc,
        startDate: start,
        endDate: end,
        imageURL: finalImage,
        location,
      });
      router.push(`/teams/${teamId}/${eventId}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the event?')) return;
    try {
      await deleteEvent(teamId, eventId);
      router.push(`/teams/${teamId}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await deleteEventImage(teamId, eventId);
      await updateEvent(teamId, eventId, { imageURL: '' });
      setImageURL('');
      alert('Successfully removed the image');
    } catch (err) {
      console.error(err);
      alert('Error removing image: ' + err.message);
    }
  };

  return (
    <div className='p-3 md:w-2/3 mx-auto space-y-6'>
      <h1 className="text-3xl font-bold text-gray-900 my-4">
        Edit Event
      </h1>
      <Button onClick={() => router.push(`/teams/${teamId}/${eventId}`)} variant="secondary" >
        Back
      </Button>

      <div className="space-y-4">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder='Event name' />
        <Input type="textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder='Description' />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="date" label='Start date' value={startDate} onChange={e => setStartDate(e.target.value)} />
          <Input type="date" label='End date' value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <GeocodeInput label='Event location' initialValue={location.address} onLocationSelect={(lat, lon, addr) => setLocation({ lat, lon, address: addr })} />
        <div className="w-32 h-32 overflow-hidden mx-auto">
          <UploadableImage photoURL={imageURL} variant="event" alt='event image' clickable handleImageChange={handleFile} className="object-cover w-full h-full" />
        </div>
        {imageURL && (
          <Button onClick={handleRemoveImage} variant="danger" className="text-xs w-full">
            Remove image
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleUpdate} variant="primary" loading={uploading}>
          Update
        </Button>
        <Button onClick={handleDelete} variant="danger" >
          Delete
        </Button>

      </div>
    </div>
  );
}
