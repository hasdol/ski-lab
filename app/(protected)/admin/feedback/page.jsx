'use client';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { RiMessage2Line } from 'react-icons/ri';

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const q = query(collection(db, 'contact'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        setErr(e.message || 'Permission denied');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const markResolved = async (id) => {
    try {
      await updateDoc(doc(db, 'contact', id), { status: 'resolved' });
      setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'resolved' } : it));
    } catch (e) {
      alert(e.message || 'Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (err) return <div className="p-4 max-w-3xl mx-auto text-red-700 bg-red-50 rounded-lg">{err}</div>;

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiMessage2Line className="text-blue-600 text-2xl" />}
        title="Feedback"
        subtitle="Incoming contact messages"
        actions={null}
      />
      <div className="bg-white shadow rounded-lg divide-y">
        {items.map(item => (
          <div key={item.id} className="p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">{item.category} • {item.status || 'open'}</div>
              <div className="font-medium">{item.subject}</div>
              <div className="text-sm text-gray-600">{item.email}</div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{item.message}</p>
            </div>
            {item.status !== 'resolved' && (
              <Button variant="secondary" onClick={() => markResolved(item.id)}>Mark resolved</Button>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="p-6 text-sm text-gray-500">No messages yet.</div>}
      </div>
    </div>
  );
}