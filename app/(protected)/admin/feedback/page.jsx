'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, where } from 'firebase/firestore';
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
  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'resolved' | 'all'

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setErr('');
    let unsub = () => {};
    try {
      const base = collection(db, 'contact');
      const constraints = [orderBy('createdAt', 'desc')];
      if (statusFilter !== 'all') constraints.unshift(where('status', '==', statusFilter));
      const q = query(base, ...constraints);
      unsub = onSnapshot(
        q,
        (snap) => {
          setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (e) => {
          setErr(e.message || 'Permission denied');
          setLoading(false);
        }
      );
    } catch (e) {
      setErr(e.message || 'Permission denied');
      setLoading(false);
    }
    return () => unsub();
  }, [user, statusFilter]);

  const toggleStatus = async (id, current) => {
    try {
      await updateDoc(doc(db, 'contact', id), { status: current === 'resolved' ? 'open' : 'resolved' });
    } catch (e) {
      alert(e.message || 'Failed to update status');
    }
  };

  const openCount = useMemo(() => items.filter(i => i.status !== 'resolved').length, [items]);

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (err) return <div className="p-4 max-w-3xl mx-auto text-red-700 bg-red-50 rounded-2xl">{err}</div>;

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiMessage2Line className="text-blue-600 text-2xl" />}
        title="Feedback"
        subtitle={
          <>
            <span>Incoming contact messages</span>
            {openCount > 0 && (
              <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                {openCount} open
              </span>
            )}
          </>
        }
        actions={
          <div className="inline-flex rounded-2xl overflow-hidden border border-gray-200">
            {['open','resolved','all'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-sm ${statusFilter===s ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {s[0].toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        }
      />
      <div className="bg-white shadow rounded-2xl divide-y">
        {items.map(item => (
          <div key={item.id} className="p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-gray-500">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full mr-2 ${item.status==='resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                  {item.category} • {item.status || 'open'}
                </span>
              </div>
              <div className="font-medium">{item.subject}</div>
              <div className="text-sm text-gray-600">{item.email}</div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{item.message}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant={item.status==='resolved' ? 'secondary' : 'primary'} onClick={() => toggleStatus(item.id, item.status)}>
                {item.status === 'resolved' ? 'Mark open' : 'Mark resolved'}
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="p-6 text-sm text-gray-500">No messages.</div>}
      </div>
    </div>
  );
}