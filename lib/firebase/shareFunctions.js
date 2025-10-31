import { getFunctions, httpsCallable } from 'firebase/functions';import { db } from '@/lib/firebase/firebaseConfig';import { collection, onSnapshot, query, where, orderBy, limit, doc, getDoc, getDocs } from 'firebase/firestore';import { getAuth } from 'firebase/auth';export async function ensureShareCode() {  const fn = httpsCallable(getFunctions(), 'ensureShareCode');  return (await fn()).data.shareCode;}export async function regenerateShareCode() {  const fn = httpsCallable(getFunctions(), 'regenerateShareCode');  return (await fn()).data.shareCode;}export async function requestShareByCode(code) {  const fn = httpsCallable(getFunctions(), 'requestShareByCode');  return (await fn({ code })).data;}export async function respondShareRequest(requestId, action) {  const fn = httpsCallable(getFunctions(), 'respondShareRequest');  return (await fn({ requestId, action })).data;}export async function revokeShare(readerUid) {  const fn = httpsCallable(getFunctions(), 'revokeShare');  return (await fn({ readerUid })).data;}export async function leaveShare(ownerUid) {  const fn = httpsCallable(getFunctions(), 'leaveShare');  return (await fn({ ownerUid })).data;}export function subscribeInboundRequests(uid, cb) {  const q = query(    collection(db, 'shareRequests'),    where('toUid', '==', uid),    orderBy('createdAt', 'desc')  );  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));}export function subscribeOutboundRequests(uid, cb) {  const q = query(    collection(db, 'shareRequests'),    where('fromUid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function subscribeSharesAsOwner(uid, cb) {
  const q = query(
    collection(db, 'userShares'),
    where('ownerUid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export function subscribeSharesAsReader(uid, cb) {
  const q = query(
    collection(db, 'userShares'),
    where('readerUid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// List users you can read (and your own display name)
export async function listAccessibleUsers() {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) return { self: null, owners: [] };

  // Self profile
  const selfSnap = await getDoc(doc(db, 'users', uid));
  const self = selfSnap.exists() ? { id: uid, displayName: selfSnap.data().displayName || uid } : { id: uid, displayName: uid };

  // Owners I can read
  const q = query(collection(db, 'userShares'), where('readerUid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const owners = await Promise.all(
    snap.docs.map(async (d) => {
      const ownerUid = d.data().ownerUid;
      const u = await getDoc(doc(db, 'users', ownerUid));
      return {
        id: ownerUid,
        displayName: u.exists() ? (u.data().displayName || ownerUid) : ownerUid,
      };
    })
  );

  return { self, owners };
}

// One-off list of an owner's skis (respect rules via hasShareAccess)
export async function listUserSkis(ownerUid, max = 200) {
  const col = collection(db, `users/${ownerUid}/skis`);
  const q = query(col, where('locked', '==', false), orderBy('serialNumber'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}