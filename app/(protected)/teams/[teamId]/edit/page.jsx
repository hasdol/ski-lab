'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateTeam, deleteTeam } from '@/lib/firebase/teamFunctions';
import { deleteTeamImage, uploadTeamImage } from '@/lib/firebase/storageFunctions';
import useSingleTeam from '@/hooks/useSingleTeam';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import UploadableImage from '@/components/common/UploadableImage';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/context/AuthContext';

export default function EditTeamPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { team, loading, error } = useSingleTeam(teamId);

  const [name, setName] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [file, setFile] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setImageURL(team.imageURL || '');
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
    setLoadingAction(true);
    try {
      let finalImage = imageURL;
      if (file) {
        finalImage = await uploadTeamImage(teamId, file, user.uid);
        setImageURL(finalImage);
      }
      await updateTeam(teamId, { name, imageURL: finalImage });
      router.push(`/teams/${teamId}`);
    } catch (e) {
      console.error(e);
      alert(t('error_updating_team') + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('confirm_delete_team'))) return;
    setLoadingAction(true);
    try {
      await deleteTeam(teamId);
      router.push('/teams');
    } catch (e) {
      console.error(e);
      alert(t('error_deleting_team') + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveImage = async () => {
    setLoadingAction(true);
    try {
      await deleteTeamImage(teamId);
      await updateTeam(teamId, { imageURL: '' });
      setImageURL('');
    } catch (e) {
      console.error(e);
      alert(t('error_removing_image') + e.message);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto">
        <div className="bg-red-50 text-red-700 rounded-md p-6">
          Error loading team: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className='p-3 md:w-2/3 mx-auto space-y-4'>
      <h1 className="text-3xl font-bold text-gray-900 my-4">
        Edit Team
      </h1>
      <Button
        onClick={handleBack}
        variant="secondary"
      >
        Back
      </Button>

      <div className=" space-y-6">
        <Input
          type="text"
          label='Team name'
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <div className="text-center">
          <div className="w-1/2 h-auto mx-auto overflow-hidden mb-4">
            <UploadableImage
              photoURL={imageURL}
              variant="team"
              alt='team image'
              clickable
              handleImageChange={handleFile}
              className="object-cover w-full h-full"
            />
          </div>
          {imageURL && (
            <Button
              onClick={handleRemoveImage}
              variant="danger"
              className="text-xs"
              disabled={loadingAction}
            >
              Remove image
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleUpdate}
            variant="primary"
            loading={loadingAction}
          >
            Update
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            loading={loadingAction}
          >
            Delete
          </Button>

        </div>
      </div>
    </div>
  );
}
