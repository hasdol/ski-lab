'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateEvent, deleteEvent } from '@/lib/firebase/teamFunctions';
import { deleteEventImage, uploadEventImage } from '@/lib/firebase/storageFunctions';
import useEvent from '@/hooks/useEvent';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import { useAuth } from '@/context/AuthContext';
import GeocodeInput from '@/components/GeocodeInput/GeocodeInput';
import Spinner from '@/components/common/Spinner/Spinner';
import { RiCalendarEventLine } from 'react-icons/ri';

export default function EditEventPage() {
  const { teamId, eventId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { eventData, loading, error } = useEvent(teamId, eventId);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null, address: '' });

  // Separate loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

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

  const formatDate = (ts) =>
    ts?.seconds ? new Date(ts.seconds * 1000).toISOString().slice(0, 10) : '';

  const handleFile = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setImageURL(URL.createObjectURL(selected));
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
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
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the event?')) return;
    setIsDeleting(true);
    try {
      await deleteEvent(teamId, eventId);
      router.push(`/teams/${teamId}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsRemovingImage(true);
    try {
      await deleteEventImage(teamId, eventId);
      await updateEvent(teamId, eventId, { imageURL: '' });
      setImageURL('');
    } catch (err) {
      console.error(err);
      alert('Error removing image: ' + err.message);
    } finally {
      setIsRemovingImage(false);
    }
  };

  if (error) return <div className="text-red-700">Error: {error.message}</div>;
  if (!eventData && !loading) return <div>No event found</div>;

  return (
    <div className="max-w-4xl md:min-w-xl w-full self-center p-4">
      <div className='flex justify-between items-center mb-6'>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <RiCalendarEventLine className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
            <p className="text-gray-600">Edit the selected event</p>
          </div>
        </div>

        <Button onClick={() => router.push(`/teams/${teamId}/${eventId}`)} variant="secondary">
          Back
        </Button>
      </div>


      {loading ?
        <div className="flex justify-center">
          <Spinner />
        </div> :
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder='Event name' />
          <Input type="textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder='Description' />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="date"
                label="Start date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              {startDate && (
                <p className="text-sm text-gray-500">
                  Norwegian format: {new Date(startDate).toLocaleDateString('nb-NO')}
                </p>
              )}
            </div>
            <div>
              <Input
                type="date"
                label="End date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
              {endDate && (
                <p className="text-sm text-gray-500">
                  Norwegian format: {new Date(endDate).toLocaleDateString('nb-NO')}
                </p>
              )}
            </div>
          </div>

          <GeocodeInput
            label='Event location'
            initialValue={location.address}
            onLocationSelect={(lat, lon, addr) => setLocation({ lat, lon, address: addr })}
          />

          <UploadableImage
            photoURL={imageURL}
            variant="event"
            alt="event image"
            clickable
            handleImageChange={handleFile}
            className="object-cover mx-auto w-auto max-h-42"
          />

          {imageURL && (
            <Button
              onClick={handleRemoveImage}
              variant="danger"
              className="text-xs flex justify-self-center"
              loading={isRemovingImage}
            >
              Remove image
            </Button>
          )}

          <div className="flex gap-2">
            <Button onClick={handleUpdate} variant="primary" loading={isUpdating}>
              Update
            </Button>
            <Button onClick={handleDelete} variant="danger" loading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>


      }
    </div>
  );
}
