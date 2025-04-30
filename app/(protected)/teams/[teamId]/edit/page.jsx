'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 rounded-md p-6">
          {t('error_loading_team')}: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-fade-up animate-duration-300">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{t('edit_team')}</h1>
        <div className="w-6" />
      </div>

      <div className="bg-white rounded-md shadow p-6 space-y-6">
        <Input
          type="text"
          label={t('team_name')}
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <div className="text-center">
          <div className="w-1/2 h-auto mx-auto overflow-hidden mb-4">
            <UploadableImage
              photoURL={imageURL}
              variant="team"
              alt={t('team_image')}
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
              {t('remove_image')}
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
          <Button
            onClick={handleUpdate}
            variant="primary"
            loading={loadingAction}
            className="flex-1"
          >
            {t('update')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            loading={loadingAction}
            className="flex-1"
          >
            {t('delete')}
          </Button>
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex-1"
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
