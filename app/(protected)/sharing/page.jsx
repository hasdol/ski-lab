'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';

import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/common/Spinner/Spinner';
import { FaSlideshare } from 'react-icons/fa';
import { RiShieldUserLine, RiEditLine } from 'react-icons/ri'; // New icons

import useUser from '@/hooks/useUser';

// Small helper to show denormalized name for pending requests to avoid profile reads
function NameOrChip({ uid, fallbackName }) {
  if (fallbackName) return <span className="font-medium text-gray-800">{fallbackName}</span>;
  return <UserChip uid={uid} />;
}

// Small helper to render user avatar + displayName, never UID
function UserChip({ uid }) {
  const user = useUser(uid);
  const name = user?.displayName || 'Unknown';
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="flex items-center gap-2">
      {user?.photoURL ? (
        <img src={user.photoURL} alt={name} className="w-7 h-7 rounded-full" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-700 text-sm font-semibold">{initial}</span>
        </div>
      )}
      <span className="font-medium text-gray-800">{name}</span>
    </div>
  );
}

export default function SharingPage() {
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(true);
  const [requestCode, setRequestCode] = useState('');

  const [owners, setOwners] = useState([]);   // users I can read
  const [readers, setReaders] = useState([]); // users who can read me

  const [incoming, setIncoming] = useState([]); // requests to me
  const [outgoing, setOutgoing] = useState([]); // requests from me

  // NEW: loading flags for Cloud Functions
  const [sendingRequest, setSendingRequest] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [revokingUid, setRevokingUid] = useState(null);
  const [leavingUid, setLeavingUid] = useState(null);
  const [updatingAccessUid, setUpdatingAccessUid] = useState(null); // New loading state

  const functions = useMemo(() => getFunctions(), []);
  const ensuredRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    // Ensure or get my share code
    if (!ensuredRef.current) {
      ensuredRef.current = true;
      (async () => {
        setLoadingCode(true);
        try {
          const ensureShareCode = httpsCallable(functions, 'ensureShareCode');
          const res = await ensureShareCode();
          setShareCode(res.data?.shareCode || '');
        } catch (e) {
          console.error('ensureShareCode failed', e);
        } finally {
          setLoadingCode(false);
        }
      })();
    }

    // Live subscriptions
    const unsubOwners = onSnapshot(
      query(collection(db, 'userShares'), where('readerUid', '==', user.uid)),
      (snap) => setOwners(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    );
    const unsubReaders = onSnapshot(
      query(collection(db, 'userShares'), where('ownerUid', '==', user.uid)),
      (snap) => setReaders(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    );
    const unsubIncoming = onSnapshot(
      query(collection(db, 'shareRequests'), where('toUid', '==', user.uid), where('status', '==', 'pending')),
      (snap) => setIncoming(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    );
    const unsubOutgoing = onSnapshot(
      query(collection(db, 'shareRequests'), where('fromUid', '==', user.uid), where('status', '==', 'pending')),
      (snap) => setOutgoing(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    );

    return () => {
      unsubOwners?.();
      unsubReaders?.();
      unsubIncoming?.();
      unsubOutgoing?.();
    };
  }, [user, functions]);

  if (!user) {
    return (
      <div className="p-4 max-w-4xl w-full self-center pb-24 md:pb-8">
        <div className="bg-red-50 text-red-700 rounded-lg p-6">Sign in required.</div>
      </div>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      alert('Code copied to clipboard');
    } catch {
      alert('Failed to copy');
    }
  };

  const handleRequestByCode = async (e) => {
    e.preventDefault();
    const code = (requestCode || '').trim();
    if (!code) return;
    try {
      setSendingRequest(true);
      const fn = httpsCallable(functions, 'requestShareByCode');
      const res = await fn({ code });
      if (res.data?.alreadyShared) {
        alert('You already have access.');
      } else {
        alert('Request sent.');
      }
      setRequestCode('');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleRespond = async (requestId, action, accessLevel = 'read') => {
    if (action === 'approved' && accessLevel === 'write') {
      if (!confirm('Warning: Giving write access allows this user to create tests and modify ski data in your account. Are you sure?')) return;
    }
    try {
      setRespondingId(requestId);
      const fn = httpsCallable(functions, 'respondShareRequest');
      await fn({ requestId, action, accessLevel }); // action: 'approved' | 'declined'
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  const handleAccessChange = async (readerUid, newLevel) => {
    if (newLevel === 'write') {
      if (!confirm('Warning: Giving write access allows this user to create tests and modify ski data in your account. Are you sure?')) return;
    }
    try {
      setUpdatingAccessUid(readerUid);
      const fn = httpsCallable(functions, 'updateShareAccess');
      await fn({ readerUid, accessLevel: newLevel });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update access');
    } finally {
      setUpdatingAccessUid(null);
    }
  };

  const handleRevoke = async (readerUid) => {
    if (!confirm('Revoke access for this reader?')) return;
    try {
      setRevokingUid(readerUid);
      const fn = httpsCallable(functions, 'revokeShare');
      await fn({ readerUid });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to revoke');
    } finally {
      setRevokingUid(null);
    }
  };

  const handleLeave = async (ownerUid) => {
    if (!confirm('Stop reading this user’s data?')) return;
    try {
      setLeavingUid(ownerUid);
      const fn = httpsCallable(functions, 'leaveShare');
      await fn({ ownerUid });
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to leave');
    } finally {
      setLeavingUid(null);
    }
  };

  return (
    <div className="p-4 max-w-4xl w-full self-center pb-24 md:pb-8">
      <PageHeader
        icon={<FaSlideshare className="text-blue-600 text-2xl" />}
        title="Sharing"
        subtitle="Share access or request to view another user’s data"
        actions={null}
      />

      {/* Your share code */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Your share code</h2>
        {loadingCode ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Spinner /> <span>Loading code…</span>
          </div>
        ) : shareCode ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg tracking-widest bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
              {shareCode}
            </span>
            <Button variant="secondary" onClick={handleCopy} className="text-sm">
              Copy
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No code available.</div>
        )}
        <p className="text-sm text-gray-600">
          Share this code with someone who should be able to view your skis and results.
        </p>
      </div>

      {/* Request access by code */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Request access</h2>
        <form onSubmit={handleRequestByCode} className="flex flex-col md:flex-row gap-3">
          <Input
            type="text"
            placeholder="Enter owner’s share code"
            value={requestCode}
            onChange={(e) => setRequestCode(e.target.value.toUpperCase())}
            className="md:flex-1"
            required
          />
          <Button type="submit" variant="primary" className="md:w-auto" loading={sendingRequest}>
            Send request
          </Button>
        </form>
        <p className="text-sm text-gray-600">Enter another user’s code to request read access.</p>
      </div>

      {/* Pending requests */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Requests to you</h3>
          {incoming.length === 0 ? (
            <div className="text-sm text-gray-500">No pending requests.</div>
          ) : (
            <ul className="space-y-2">
              {incoming.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <NameOrChip uid={r.fromUid} fallbackName={r.fromDisplayName} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="secondary" 
                      className="text-xs" 
                      onClick={() => handleRespond(r.id, 'approved', 'read')} 
                      loading={respondingId === r.id}
                    >
                      Approve (Read-only)
                    </Button>
                    <Button 
                      variant="primary" 
                      className="text-xs" 
                      onClick={() => handleRespond(r.id, 'approved', 'write')} 
                      loading={respondingId === r.id}
                    >
                      Approve (Write)
                    </Button>
                    <Button 
                      variant="danger" 
                      className="text-xs" 
                      onClick={() => handleRespond(r.id, 'declined')} 
                      loading={respondingId === r.id}
                    >
                      Decline
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Requests you sent</h3>
          {outgoing.length === 0 ? (
            <div className="text-sm text-gray-500">No pending requests.</div>
          ) : (
            <ul className="space-y-2">
              {outgoing.map((r) => (
                <li key={r.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <NameOrChip uid={r.toUid} fallbackName={r.toDisplayName} />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active shares */}
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">You can view</h3>
          {owners.length === 0 ? (
            <div className="text-sm text-gray-500">You don’t have access to anyone yet.</div>
          ) : (
            <ul className="space-y-2">
              {owners.map((s) => (
                <li key={s.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  {/* prefer denormalized name to avoid cross-user profile reads */}
                  <NameOrChip uid={s.ownerUid} fallbackName={s.ownerDisplayName} />
                  <Button
                    variant="danger"
                    className="text-sm"
                    onClick={() => handleLeave(s.ownerUid)}
                    loading={leavingUid === s.ownerUid}
                  >
                    Leave
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Can view you</h3>
          {readers.length === 0 ? (
            <div className="text-sm text-gray-500">Nobody has access to your data yet.</div>
          ) : (
            <ul className="space-y-2">
              {readers.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <NameOrChip uid={s.readerUid} fallbackName={s.readerDisplayName} />
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.accessLevel === 'write' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {s.accessLevel === 'write' ? 'Write Access' : 'Read Only'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-100">
                    <div className="flex gap-2">
                      {s.accessLevel === 'write' ? (
                        <button 
                          onClick={() => handleAccessChange(s.readerUid, 'read')}
                          disabled={updatingAccessUid === s.readerUid}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Downgrade to Read-only
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAccessChange(s.readerUid, 'write')}
                          disabled={updatingAccessUid === s.readerUid}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Upgrade to Write
                        </button>
                      )}
                    </div>
                    <Button
                      variant="danger"
                      className="text-xs py-1 h-auto"
                      onClick={() => handleRevoke(s.readerUid)}
                      loading={revokingUid === s.readerUid}
                    >
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}