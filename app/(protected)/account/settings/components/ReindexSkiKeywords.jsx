// src/components/ReindexSkiKeywords.js
'use client';

import React, { useState } from 'react';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { buildKeywords } from '@/helpers/buildKeywords';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function ReindexSkiKeywords() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);

  const handleReindex = async () => {
    if (!user) {
      alert('You must be signed in.');
      return;
    }

    setRunning(true);
    try {
      // 1️⃣  load *all* skis for the current user
      const skisCol = collection(db, `users/${user.uid}/skis`);
      const snap = await getDocs(skisCol);

      // 2️⃣  recompute keyword arrays, write back
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const keywords_en = buildKeywords(data, 'en');
        const keywords_no = buildKeywords(data, 'no');
        await updateDoc(docSnap.ref, { keywords_en, keywords_no });
      }

      alert('✅ Re‑indexed all of your skis');
    } catch (err) {
      console.error('Reindex failed:', err);
      alert('⚠️ Error reindexing — see console for details');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Button onClick={handleReindex} disabled={running} variant="secondary">
      {running ? 'Re‑indexing…' : 'Re‑index My Ski Keywords'}
    </Button>
  );
}
