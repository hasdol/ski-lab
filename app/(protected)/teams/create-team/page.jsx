// CreateTeamPage.jsx
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createTeam, updateTeamImage } from '@/lib/firebase/teamFunctions';
import { uploadTeamImage } from '@/lib/firebase/storageFunctions';
import Button from '@/components/ui/Button';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import Input from '@/components/ui/Input';

export default function CreateTeamPage() {
  const { user, userData } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageURL, setImageURL] = useState('');
  const router = useRouter();

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageURL(URL.createObjectURL(selectedFile));
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName) return;
    let uploadedImageURL = '';
    try {
      setUploading(true);

      // 1. Create team without an image
      const teamId = await createTeam(user.uid, teamName);

      // 2. If an image was selected and the user is allowed, upload it using the teamId as filename
      if (file && (userData?.plan === 'coach' || userData?.plan === 'company')) {
        uploadedImageURL = await uploadTeamImage(teamId, file, user.uid);
        // Update the team document with the image URL
        await updateTeamImage(teamId, uploadedImageURL);
      }

      router.push('/teams');
    } catch (err) {
      console.error('Create team failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='p-3 md:w-2/3 mx-auto space-y-8'>
      <h1 className="text-3xl font-bold text-gray-900 my-4">
        Create Team
      </h1>

      <Input
        type="text"
        name="teamName"
        placeholder="Team name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        required
      />

      {(userData?.plan === 'coach' || userData?.plan === 'company') && (
        <UploadableImage
          photoURL={imageURL}
          handleImageChange={handleFileChange}
          variant="team"
          alt="Team Image"
          clickable={true}
        />
      )}

      <div className="flex gap-3 mt-4">
        <Button onClick={handleCreateTeam} variant="primary" loading={uploading}>
          Create
        </Button>
        <Button onClick={() => router.push('/teams')} variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
}
