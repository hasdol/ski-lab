import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function TeamsJoinForm() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setIsLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setIsLoading(true)
    if (!user) return;
    try {
      const functions = getFunctions();
      const joinTeamByCode = httpsCallable(functions, 'joinTeamByCode');
      const result = await joinTeamByCode({ code });
      console.log('Joined team:', result.data.teamId);
      setCode('');
    } catch (err) {
      console.error('Join team error:', err);
      alert(err.message);
    }
    setIsLoading(false)
  };

  return (
    <form onSubmit={handleJoin} className="flex items-end space-x-2">
      <Input
        type="text"
        name="temperature"
        placeholder='Enter team code'
        onChange={(e) => setCode(e.target.value)}
        value={code}
        disabled={!user}
      />
      <Button type="submit" variant="primary" loading={loading} disabled={!user}>
        Join
      </Button>
    </form>
  );
}
