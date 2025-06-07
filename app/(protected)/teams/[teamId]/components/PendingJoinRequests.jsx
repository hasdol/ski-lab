'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Button from '@/components/ui/Button';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function PendingJoinRequests({ teamId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();

  useEffect(() => {
    async function fetchJoinRequests() {
      setLoading(true);
      try {
        const requestsRef = collection(db, 'teams', teamId, 'joinRequests');
        const q = query(requestsRef, where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        let reqs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        // Fetch additional user info for each join request
        reqs = await Promise.all(
          reqs.map(async (req) => {
            const userDoc = await getDoc(doc(db, 'users', req.userId));
            const userInfo = userDoc.exists() ? userDoc.data() : {};
            return { ...req, userInfo };
          })
        );
        setRequests(reqs);
      } catch (err) {
        console.error('Error fetching join requests:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJoinRequests();
  }, [teamId]);

  const handleAccept = async (requestId) => {
    try {
      const acceptJoinRequest = httpsCallable(functions, 'acceptJoinRequest');
      await acceptJoinRequest({ teamId, requestId });
      // Remove accepted request from list.
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error accepting join request:', err);
      alert(err.message || 'Failed to accept request.');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      const declineJoinRequest = httpsCallable(functions, 'declineJoinRequest');
      await declineJoinRequest({ teamId, requestId });
      // Remove declined request from list.
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Error declining join request:', err);
      alert(err.message || 'Failed to decline request.');
    }
  };

  if (loading) return <p>Loading join requests...</p>;
  if (requests.length === 0) return <p>No pending join requests.</p>;
  


  return (
    <div className="p-6 border border-gray-300 rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-4">Pending Join Requests</h2>
      <ul>
        {requests.map((req) => (
          <li key={req.id} className="flex flex-col items-center space-y-2 p-2 border-b border-gray-300">
            <div>
              <p className="font-medium">{req.email || req.userId}</p>
            </div>
            <div className="flex gap-2 text-xs">
              <Button variant="primary" onClick={() => handleAccept(req.id)}>
                Accept
              </Button>
              <Button variant="danger" onClick={() => handleDecline(req.id)}>
                Decline
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}