'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { updateTeam, deleteTeam } from '@/lib/firebase/teamFunctions';
import { uploadTeamImage } from '@/lib/firebase/storageFunctions';
import useSingleTeam from '@/hooks/useSingleTeam'; // to fetch team data
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import UploadableImage from '@/components/common/UploadableImage';

/**
 * A dedicated Edit Team page.
 * E.g. at /teams/[teamId]/edit
 */
export default function EditTeamPage() {
  const { t } = useTranslation();
  const { teamId } = useParams();
  const router = useRouter();

  // Fetch the team data so we can prefill the fields
  const { team, loading, error } = useSingleTeam(teamId);

  // Local state for editing
  const [name, setName] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Once the team data is fetched, populate local state
  useEffect(() => {
    if (team) {
      setName(team.name || '');
      setImageURL(team.imageURL || '');
    }
  }, [team]);

  // If the data is loading or there's an error, handle that first
  if (loading) return <div className="p-4">{t('loading')}...</div>;
  if (error) return <div className="p-4">Error: {error.message}</div>;
  if (!team) return <div className="p-4">No team found.</div>;

  // Handler for file selection
  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      // Optionally show local preview
      setImageURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Handler to update the team
  const handleUpdate = async () => {
    try {
      setUploading(true);
      let finalImageURL = imageURL;

      if (file) {
        finalImageURL = await uploadTeamImage(teamId, file);
        setImageURL(finalImageURL);
      }
      await updateTeam(team.id, { name, imageURL: finalImageURL });

      // Navigate back to the TeamDetailPage
      router.push(`/teams/${teamId}`);
    } catch (err) {
      console.error('Error updating team:', err);
      alert('Error updating team: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Handler to delete the team
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(team.id);
        // After deleting, maybe navigate back to /teams or somewhere else
        router.push('/teams');
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('Error deleting team: ' + error.message);
      }
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
