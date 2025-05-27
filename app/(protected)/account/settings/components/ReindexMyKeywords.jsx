// src/components/ReindexMyKeywords.js
'use client';

import React, { useState } from 'react';
import { getDocs, updateDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { buildKeywords } from '@/helpers/buildKeywords';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function ReindexMyKeywords() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);

  const handleReindex = async () => {
    if (!user) {
      alert('You must be signed in.');
      return;
    }

    setRunning(true);
    try {
      const resultsCol = collection(db, `users/${user.uid}/testResults`);
      const snap = await getDocs(resultsCol);

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const keywords_en = buildKeywords(data, 'en');
        const keywords_no = buildKeywords(data, 'no');
        await updateDoc(docSnap.ref, { keywords_en, keywords_no });
      }

      alert('✅ Re-indexed all of your testResults');
    } catch (err) {
      console.error('Reindex failed:', err);
      alert('⚠️ Error reindexing — see console');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button onClick={handleReindex} disabled={running} variant="secondary">
      {running ? 'Re-indexing…' : 'Re-index My Keywords'}
    </Button>
  );
}
