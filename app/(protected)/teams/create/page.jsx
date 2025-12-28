'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createTeam, updateTeamImage } from '@/lib/firebase/teamFunctions';
import { uploadTeamImage } from '@/lib/firebase/storageFunctions';
import Button from '@/components/ui/Button';
import UploadableImage from '@/components/UploadableImage/UploadableImage';
import Input from '@/components/ui/Input';
import { RiTeamLine } from 'react-icons/ri';
import { MdPublic, MdPublicOff } from 'react-icons/md';
import Toggle from '@/components/ui/Toggle';
import PageHeader from '@/components/layout/PageHeader';


export default function CreateTeamPage() {
  const { user, userData } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
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

      // Create team without team-level results visibility
      const teamId = await createTeam(user.uid, teamName, isPublic);

      if (file && (userData?.plan === 'coach' || userData?.plan === 'company')) {
        uploadedImageURL = await uploadTeamImage(teamId, file, user.uid);
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
    <div className="max-w-4xl w-full self-center p-4">
      <PageHeader
        icon={<RiTeamLine className="text-blue-600 text-2xl" />}
        title="Create Team"
        subtitle="Set up a new team for collaboration"
        actions={null}
      />

      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200 space-y-6">
        <Input
          type="text"
          name="teamName"
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          className="w-full"
        />

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <MdPublic className="text-blue-600 text-xl" />
            ) : (
              <MdPublicOff className="text-gray-600 text-xl" />
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                {isPublic ? 'Public Team' : 'Private Team'}
              </h3>
              <p className="text-sm text-gray-600">
                {isPublic 
                  ? 'Anyone can discover and request to join' 
                  : 'Hidden from discover, users need the team code to join'}
              </p>
            </div>
          </div>
          <Toggle 
            enabled={isPublic} 
            setEnabled={setIsPublic} 
            label="Team visibility"
          />
        </div>

        {(userData?.plan === 'coach' || userData?.plan === 'company') && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Team image (optional)</p>
            <UploadableImage
              photoURL={imageURL}
              handleImageChange={handleFileChange}
              variant="team"
              alt="Team Image"
              clickable={true}
            />
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button 
            onClick={handleCreateTeam} 
            variant="primary" 
            loading={uploading}
            className="flex-1"
          >
            Create Team
          </Button>
          <Button 
            onClick={() => router.push('/teams')} 
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}