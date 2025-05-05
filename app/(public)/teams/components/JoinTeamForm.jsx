import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useTranslation } from 'react-i18next';

export default function JoinTeamForm() {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setIsLoading] = useState(false);
  const { t } = useTranslation();

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
        placeholder={t('enter_team_code')}
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
