// EditTeamPage.jsx
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
import { useAuth } from '@/context/AuthContext';

export default function EditTeamPage() {
  const { t } = useTranslation();
  const { teamId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // Fetch team data to prefill the fields
  const { team, loading, error } = useSingleTeam(teamId);

  const [name, setName] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setImageURL(team.imageURL || '');
    }
  }, [team]);

  if (loading) return <div className="p-4">{t('loading')}...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;
  if (!team) return <div className="p-4">No team found.</div>;

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setImageURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdate = async () => {
    try {
      setUploading(true);
      let finalImageURL = imageURL;

      if (file) {
        // Upload using teamId with a fixed path (overwriting any existing image)
        finalImageURL = await uploadTeamImage(teamId, file, user.uid);
        setImageURL(finalImageURL);
      }
      await updateTeam(team.id, { name, imageURL: finalImageURL });
      router.push(`/teams/${teamId}`);
    } catch (err) {
      console.error('Error updating team:', err);
      alert('Error updating team: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(team.id);
        router.push('/teams');
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team: ' + error.message);
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      await deleteTeamImage(teamId);
      await updateTeam(teamId, { imageURL: '' });
      setImageURL('');
      alert(t('image_removed_success'));
    } catch (error) {
      console.error('Error removing image:', error);
      alert(t('remove_image_error') + ': ' + error.message);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-3xl font-semibold mb-4">{t('edit_team')}</h1>

      <Input
        type="text"
        name="name"
        placeholder={t('team_name')}
        onChange={(e) => setName(e.target.value)}
        value={name}
        required
      />

      <UploadableImage
        photoURL={imageURL}
        variant="team"
        alt="Team Image"
        isChangingImg={uploading}
        clickable={true}
        handleImageChange={handleFileSelect}
      />

      <Button onClick={handleRemoveImage} variant="danger">
        {t('remove_image')}
      </Button>

      <div className="flex space-x-3 mt-4">
        <Button onClick={handleUpdate} variant="primary" loading={uploading}>
          {t('update')}
        </Button>
        <Button onClick={handleDelete} variant="danger">
          {t('delete')}
        </Button>
        <Button onClick={() => router.push(`/teams/${teamId}`)} variant="secondary">
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
