import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';     // ← your existing config
import { useAuth } from '@/context/AuthContext';
import { buildKeywords } from '@/helpers/buildKeywords'; // ← updated helper

/**
 * Re‑generate keywords_en / keywords_no for *every* ski that belongs to
 * the currently signed‑in user.
 * Splits the work into batches of 500 (Firestore’s limit).
 */
export async function RebuildSkiKeywords() {
  const { user } = useAuth.getState?.() ?? {}; // ← grab auth any way you like
  if (!user?.uid) throw new Error('Need to be signed in first');

  const snap = await getDocs(
    collection(db, `users/${user.uid}/skis`)
  );
  if (snap.empty) {
    console.log('No skis found — nothing to rebuild.');
    return;
  }

  const CHUNK = 500;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    docs.slice(i, i + CHUNK).forEach((d) => {
      const data = d.data();
      batch.update(doc(db, d.ref.path), {
        keywords_en: buildKeywords(data, 'en'),
        keywords_no: buildKeywords(data, 'no')
      });
    });
    await batch.commit();           // ⏱ ~6 KB write quota per doc
    console.log(`Updated ${Math.min(i + CHUNK, docs.length)}/${docs.length}`);
  }
  console.log('✅  Finished rebuilding ski keywords');
}

