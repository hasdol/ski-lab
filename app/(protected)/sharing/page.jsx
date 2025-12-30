'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';

import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/common/Spinner/Spinner';
import { FaEye, FaFlask, FaInbox, FaKey, FaPaperPlane, FaShareAlt, FaSlideshare, FaUserShield } from 'react-icons/fa';
import Card from '@/components/ui/Card'; // NEW
import Toggle from '@/components/ui/Toggle';
import { RiInformationLine } from 'react-icons/ri'; // NEW

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

// NEW: read/write info banner
function AccessInfoBanner() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <RiInformationLine className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-blue-800">
          <h3 className="block font-semibold mb-1">Access levels</h3>
          <p className="text-sm">
            <span className="font-medium">View</span> = read-only. <span className="font-medium">Testing</span> = can create tests in your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SharingPage() {
  const { user } = useAuth();
  const [shareCode, setShareCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(true);
  const [showShareCode, setShowShareCode] = useState(false);
  const [showAccessInfo, setShowAccessInfo] = useState(false);
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
        <div className="bg-red-50 text-red-700 rounded-2xl p-6">Sign in required.</div>
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
      if (!confirm('Warning: Giving Testing access lets this user create tests in your account (and run cross-user tests). Are you sure?')) return;
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
      if (!confirm('Warning: Giving Testing access lets this user create tests in your account (and run cross-user tests). Are you sure?')) return;
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
    <div className="p-4 max-w-4xl w-full self-center space-y-6">
      <PageHeader
        icon={<FaSlideshare className="text-blue-600 text-2xl" />}
        title="Sharing"
        subtitle="Request access, and manage who has access to you."
        actions={null}
      />

      {/* Your share code */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaShareAlt className="text-blue-600" />
            Share your data
          </h2>
          <p className="text-sm text-gray-600">Send your personal code to someone.</p>
        </div>
        {loadingCode ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Spinner /> <span>Loading code…</span>
          </div>
        ) : shareCode ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="font-mono text-lg tracking-widest bg-blue-50 text-blue-700 px-3 py-1.5 rounded-2xl border border-blue-200 w-fit">
              {showShareCode ? shareCode : '•'.repeat(Math.max(6, shareCode.length))}
            </span>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Show</span>
                <Toggle
                  enabled={showShareCode}
                  setEnabled={setShowShareCode}
                  label="Show share code"
                />
              </div>

              <Button variant="secondary" onClick={handleCopy} className="text-sm">
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No code available.</div>
        )}
        <p className="text-xs text-gray-500">Only share with trusted people.</p>
      </Card>

      {/* Request access by code */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaKey className="text-blue-600" />
            Request access
          </h2>
        </div>
        <form onSubmit={handleRequestByCode} className="flex flex-col md:flex-row gap-3 md:items-end">
          <Input
            type="text"
            placeholder="Enter owner’s share code"
            value={requestCode}
            onChange={(e) => setRequestCode(e.target.value.toUpperCase())}
            className="md:flex-1"
            required
          />
          <Button type="submit" variant="primary" className="h-fit" loading={sendingRequest}>
            Send request
          </Button>
        </form>
        <p className="text-xs text-gray-500">The owner chooses View or Testing access.</p>
      </Card>

      {/* NEW: access info toggle */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl ring-1 ring-black/5 rounded-2xl p-3">
        <div className="min-w-0">
          <span className="text-sm font-medium text-gray-800">What does “Testing access” mean?</span>
          <p className="text-xs text-gray-600">Quick explanation.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Show</span>
          <Toggle enabled={showAccessInfo} setEnabled={setShowAccessInfo} label="Show access info" />
        </div>
      </div>

      {/* NEW: access info banner (conditional) */}
      {showAccessInfo && <AccessInfoBanner />}

      {/* Pending requests */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FaInbox className="text-gray-600" />
              Requests to you
            </h3>
            <span className="text-xs text-gray-500">{incoming.length} pending</span>
          </div>
          {incoming.length === 0 ? (
            <div className="text-sm text-gray-500">No pending requests.</div>
          ) : (
            <ul className="space-y-2">
              {incoming.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 border border-gray-200 rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <NameOrChip uid={r.fromUid} fallbackName={r.fromDisplayName} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="primary"
                      className="text-xs"
                      onClick={() => handleRespond(r.id, 'approved', 'read')}
                      loading={respondingId === r.id}
                    >
                      Grant View
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => handleRespond(r.id, 'approved', 'write')}
                      loading={respondingId === r.id}
                    >
                      Grant Testing
                    </Button>
                    <Button
                      variant="secondary"
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
        </Card>

        <Card className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FaPaperPlane className="text-gray-600" />
              Requests you sent
            </h3>
            <span className="text-xs text-gray-500">{outgoing.length} pending</span>
          </div>
          {outgoing.length === 0 ? (
            <div className="text-sm text-gray-500">No pending requests.</div>
          ) : (
            <ul className="space-y-2">
              {outgoing.map((r) => (
                <li key={r.id} className="flex items-center justify-between border border-gray-200 rounded-2xl p-3">
                  <NameOrChip uid={r.toUid} fallbackName={r.toDisplayName} />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FaUserShield className="text-gray-600" />
            People who can access your data
          </h3>
          {readers.length === 0 ? (
            <div className="text-sm text-gray-500">Nobody has access to your data yet.</div>
          ) : (
            <ul className="space-y-2">
              {readers.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 border border-gray-200 rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <NameOrChip uid={s.readerUid} fallbackName={s.readerDisplayName} />
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center bg-slate-100 rounded-2xl p-1 ring-1 ring-black/5"
                        role="group"
                        aria-label="Access level"
                      >
                        <button
                          type="button"
                          onClick={() => s.accessLevel !== 'read' && handleAccessChange(s.readerUid, 'read')}
                          disabled={revokingUid === s.readerUid || updatingAccessUid === s.readerUid}
                          aria-pressed={s.accessLevel === 'read'}
                          className={[
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition',
                            s.accessLevel === 'read'
                              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60',
                          ].join(' ')}
                        >
                          <FaEye className="text-[12px]" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => s.accessLevel !== 'write' && handleAccessChange(s.readerUid, 'write')}
                          disabled={revokingUid === s.readerUid || updatingAccessUid === s.readerUid}
                          aria-pressed={s.accessLevel === 'write'}
                          className={[
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition',
                            s.accessLevel === 'write'
                              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60',
                          ].join(' ')}
                        >
                          <FaFlask className="text-[12px]" />
                          Testing
                        </button>
                      </div>

                      {updatingAccessUid === s.readerUid ? (
                        <span className="text-gray-500" aria-label="Updating access">
                          <Spinner />
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-1 pt-2 border-t border-gray-100">
                    <Button
                      variant="danger"
                      className="text-xs py-1 h-auto"
                      onClick={() => handleRevoke(s.readerUid)}
                      loading={revokingUid === s.readerUid}
                      disabled={updatingAccessUid === s.readerUid}
                    >
                      Revoke
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FaEye className="text-gray-600" />
            Accounts you can view
          </h3>
          {owners.length === 0 ? (
            <div className="text-sm text-gray-500">You don’t have access to anyone yet.</div>
          ) : (
            <ul className="space-y-2">
              {owners.map((s) => (
                <li key={s.id} className="flex items-center justify-between border border-gray-200 rounded-2xl p-3">
                  {/* prefer denormalized name to avoid cross-user profile reads */}
                  <NameOrChip uid={s.ownerUid} fallbackName={s.ownerDisplayName} />
                  <Button
                    variant="secondary"
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
        </Card>


      </div>
    </div>
  );
}