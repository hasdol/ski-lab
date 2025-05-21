import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';

export default function useUser(userId) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const unsub = onSnapshot(userRef, snap => {
      if (snap.exists()) setUser({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [userId]);

  return user;
}
