'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import { RiShieldStarLine, RiMessage2Line } from 'react-icons/ri';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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
        <div className="bg-white shadow rounded-2xl p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Coming soon</h2>
          <p className="text-sm text-gray-600">Users, teams, billing audits, and more.</p>
        </div>
      </div>
    </div>
  );
}