'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateTeam, deleteTeam } from '@/lib/firebase/teamFunctions';
import { deleteTeamImage, uploadTeamImage } from '@/lib/firebase/storageFunctions';
import useSingleTeam from '@/hooks/useSingleTeam';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/context/AuthContext';
import { RiEarthLine, RiLockLine } from 'react-icons/ri';
import Toggle from '@/components/ui/Toggle';

export default function EditTeamPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { team, loading, error } = useSingleTeam(teamId);

  const [name, setName] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setImageURL(team.imageURL || '');
      setIsPublic(team.isPublic || false);
    }
  }, [team]);

  const handleBack = () => router.push(`/teams/${teamId}`);

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
        finalImage = await uploadTeamImage(teamId, file, user.uid);
        setImageURL(finalImage);
      }
      // Pass in the isPublic field to update the team's privacy
      await updateTeam(teamId, { name, imageURL: finalImage, isPublic });
      router.push(`/teams/${teamId}`);
    } catch (e) {
      console.error(e);
      alert('Error updating team: ' + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete the team?')) return;
    setIsDeleting(true);
    try {
      await deleteTeam(teamId);
      router.push('/teams');
    } catch (e) {
      console.error(e);
      alert('Error deleting team: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsRemovingImage(true);
    try {
      await deleteTeamImage(teamId);
      await updateTeam(teamId, { imageURL: '' });
      setImageURL('');
    } catch (e) {
      console.error(e);
      alert('Error removing image: ' + e.message);
    } finally {
      setIsRemovingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-md p-6">
          Error loading team: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl md:min-w-xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={handleBack} variant="secondary">Back to Team</Button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 space-y-6">
        <Input
          type="text"
          label="Team name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full"
        />

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <RiEarthLine className="text-blue-600 text-xl" />
            ) : (
              <RiLockLine className="text-gray-600 text-xl" />
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                {isPublic ? 'Public Team' : 'Private Team'}
              </h3>
              <p className="text-sm text-gray-600">
                {isPublic
                  ? 'Anyone can discover and request to join'
                  : 'Hidden from discover, you need the team code to join'}
              </p>
            </div>
          </div>
          <Toggle
            enabled={isPublic}
            setEnabled={setIsPublic}
            label="Team visibility"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">Team image</p>
          <div className="flex flex-col items-center">
            <UploadableImage
              photoURL={imageURL}
              variant="team"
              alt="team image"
              clickable
              handleImageChange={handleFile}
              className=" w-full mx-auto max-h-40 rounded-lg border-4 border-white"
            />
            {imageURL && (
              <Button
                onClick={handleRemoveImage}
                variant="danger"
                className="mt-4 text-sm"
                loading={isRemovingImage}
              >
                Remove image
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleUpdate}
            variant="primary"
            loading={isUpdating}
            className="flex-1"
          >
            Update
          </Button>

          <Button
            onClick={handleDelete}
            variant="danger"
            loading={isDeleting}
            className="flex-1"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}