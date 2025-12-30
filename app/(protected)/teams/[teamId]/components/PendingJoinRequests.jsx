'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { TEAM_PLAN_CAPS } from '@/lib/constants/teamPlanCaps';
import Button from '@/components/ui/Button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '@/context/AuthContext';

export default function PendingJoinRequests({ teamId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [memberCap, setMemberCap] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const functions = getFunctions();
  const { user, userData } = useAuth();

  useEffect(() => {
    async function fetchJoinRequests() {
      setLoading(true);
      try {
        const requestsRef = collection(db, 'teams', teamId, 'joinRequests');
        const q = query(requestsRef, where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        // username is already stored by joinTeamByCode CF
        const reqs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setRequests(reqs);
      } catch (err) {
        console.error('Error fetching join requests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJoinRequests();
  }, [teamId]);

  // NEW: fetch team + owner plan to compute member cap and current count
  useEffect(() => {
    async function fetchTeamAndCap() {
      if (!teamId) return;
      const teamSnap = await getDoc(doc(db, 'teams', teamId));
      if (!teamSnap.exists()) return;
      const t = teamSnap.data();
      setMemberCount(Array.isArray(t.members) ? t.members.length : 0);

      // Only the creator should compute cap; derive from their own userData
      if (user?.uid !== t.createdBy) return;
      const cap = Number.isFinite(userData?.planMembersCap)
        ? userData.planMembersCap
        : (TEAM_PLAN_CAPS[userData?.plan]?.members ?? null);
      setMemberCap(cap ?? null);
    }
    fetchTeamAndCap();
  }, [teamId, user?.uid, userData?.plan, userData?.planMembersCap]);

  // Treat 0/invalid as "no cap"
  const isFull = Number.isFinite(memberCap) && memberCap > 0 && memberCount >= memberCap;

  const handleAccept = async (requestId) => {
    if (isFull) {
      alert('Team member limit reached for this plan.');
      return;
    }
    setLoading(true);
    try {
      const acceptJoinRequest = httpsCallable(functions, 'acceptJoinRequest');
      await acceptJoinRequest({ teamId, requestId });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMemberCount((c) => c + 1); // optimistic count update
    } catch (err) {
      console.error('Error accepting join request:', err);
      alert(err.message || 'Failed to accept request.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (requestId) => {
    setLoading(true);
    try {
      const declineJoinRequest = httpsCallable(functions, 'declineJoinRequest');
      await declineJoinRequest({ teamId, requestId });
      // Remove declined request from list.
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error declining join request:', err);
      alert(err.message || 'Failed to decline request.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading join requests...</p>;
  if (requests.length === 0) return <p>No pending join requests.</p>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* cap banner */}
      {Number.isFinite(memberCap) && memberCap > 0 && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${isFull ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-800'}`}>
          Members: {memberCount} / {memberCap} {isFull && '— team is full'}
        </div>
      )}

      <ul className="space-y-3">
        {requests.map((req) => (
          <li key={req.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">{req.username || req.email || req.userId}</p>
            <div className="flex gap-2">
              <Button
                variant="primary"
                loading={loading}
                disabled={loading || isFull}
                onClick={() => handleAccept(req.id)}
                className='text-sm'
              >
                Accept
              </Button>
              <Button variant="danger" loading={loading} onClick={() => handleDecline(req.id)}>
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}