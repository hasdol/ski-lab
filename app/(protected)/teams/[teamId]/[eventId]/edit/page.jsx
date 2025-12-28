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
import PageHeader from '@/components/layout/PageHeader';
import Card from '@/components/ui/Card'; // NEW
import { RiCalendarEventLine } from 'react-icons/ri';
import { MdArrowBack } from "react-icons/md";


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
  const [resultsVisibility, setResultsVisibility] = useState('team'); // NEW

  // Separate loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    if (eventData) {
      setName(eventData.name || '');
      setDesc(eventData.description || '');
      setStartDate(eventData.startDate ? new Date(eventData.startDate.seconds * 1000).toISOString().slice(0,10) : '');
      setEndDate(eventData.endDate ? new Date(eventData.endDate.seconds * 1000).toISOString().slice(0,10) : '');
      setImageURL(eventData.imageURL || '');
      setLocation(eventData.location || { lat: null, lon: null, address: '' });
      setResultsVisibility(eventData.resultsVisibility || 'team'); // NEW
    }
  }, [eventData]);

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
        finalImage = await uploadEventImage(teamId, eventId, file);
        setImageURL(finalImage);
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      await updateEvent(teamId, eventId, {
        name,
        description: desc,
        startDate: start,
        endDate: end,
        imageURL: finalImage,
        location,
        resultsVisibility, // NEW
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
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiCalendarEventLine className="text-blue-600 text-2xl" />}
        title="Edit Event"
        subtitle="Edit the selected event"
        actions={
          <Button onClick={() => router.push(`/teams/${teamId}/${eventId}`)} className='flex items-center' variant="secondary"><MdArrowBack className='mr-1'/>
            Back
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : (
        <Card className="p-6 space-y-6">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Event name" />
          <Input type="textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" />

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

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
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

          <div className="flex gap-2">
            <Button onClick={handleUpdate} variant="primary" loading={isUpdating}>
              Update
            </Button>
            <Button onClick={handleDelete} variant="danger" loading={isDeleting}>
              Delete
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
