'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { RiShieldStarLine, RiMessage2Line, RiVerifiedBadgeFill } from 'react-icons/ri';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Spinner from '@/components/common/Spinner/Spinner';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit, updateDoc, doc } from 'firebase/firestore';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [savingIds, setSavingIds] = useState(() => new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) { if (mounted) setIsAdmin(false); return; }
      try {
        const token = await user.getIdTokenResult();
        if (mounted) setIsAdmin(!!token.claims?.admin);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Load teams for verification (admin only)
  useEffect(() => {
    if (!user || !isAdmin) return;

    setTeamsLoading(true);
    const q = query(collection(db, 'teams'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTeams(list);
        setTeamsLoading(false);
      },
      (err) => {
        console.error('Failed to load teams', err);
        setTeams([]);
        setTeamsLoading(false);
      }
    );
    return () => unsub();
  }, [user, isAdmin]);

  const setTeamVerified = async (teamId, next) => {
    if (!teamId) return;

    setSavingIds((prev) => {
      const copy = new Set(prev);
      copy.add(teamId);
      return copy;
    });
    try {
      await updateDoc(doc(db, 'teams', teamId), { verified: !!next });
    } catch (e) {
      console.error('Failed to update verified flag', e);
      alert(e?.message || 'Failed to update team');
    } finally {
      setSavingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(teamId);
        return copy;
      });
    }
  };

  if (!user) {
    return (
      <div className="p-4 max-w-4xl w-full self-center">
        <div className="bg-red-50 text-red-700 rounded-2xl p-6">Sign in required.</div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="p-4 max-w-4xl w-full self-center">
        <div className="bg-red-50 text-red-700 rounded-2xl p-6">Not authorized.</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl w-full self-center">
      <PageHeader
        icon={<RiShieldStarLine className="text-blue-600 text-2xl" />}
        title="Admin"
        subtitle="Administration tools and dashboards"
        actions={null}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white shadow rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <RiMessage2Line className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Feedback</h2>
          </div>
          <p className="text-sm text-gray-600">
            View and resolve messages submitted via Contact form.
          </p>
          <div>
            <Link href="/admin/feedback">
              <Button variant="primary">Open Feedback</Button>
            </Link>
          </div>
        </div>

        {/* Future admin modules */}
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Team verification</h2>
          <p className="text-sm text-gray-600">
            Toggle the Verified badge for any team.
          </p>

          {teamsLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : (
            <div className="space-y-2">
              {teams.length === 0 ? (
                <div className="text-sm text-gray-500">No teams found.</div>
              ) : (
                teams.map((t) => {
                  const saving = savingIds.has(t.id);
                  const verified = !!t.verified;
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-2xl p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <div className="font-medium text-gray-900 truncate">{t.name || t.id}</div>
                          {verified && (
                            <span className="inline-flex items-center text-blue-700 font-semibold">
                              <RiVerifiedBadgeFill className="text-blue-600" aria-hidden="true" />
                              <span className="sr-only">Verified</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{t.id}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {saving ? <Spinner size="sm" /> : null}
                        <Toggle
                          enabled={verified}
                          setEnabled={(next) => setTeamVerified(t.id, next)}
                          label="Verified"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}