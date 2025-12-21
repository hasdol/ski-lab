"use client";
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { APP_VERSION, RELEASES } from '@/lib/releases';
import Button from '@/components/ui/Button';
import { MdUpdate } from "react-icons/md";




function formatDate(iso) {
    try {
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

// add above ReleasesPage()
function renderTextWithLinks(text) {
  if (typeof text !== 'string') return text;

  const parts = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = re.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a key={`${href}-${match.index}`} href={href} className="text-blue-600 underline hover:text-blue-700">
        {label}
      </a>
    );
    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function ReleasesPage() {
    const router = useRouter();
    const handleNavigation = (path) => router.push(path);

    return (
        <div className="p-4 max-w-4xl w-full self-center">
            <PageHeader
        icon={<span className="text-blue-600 text-2xl font-semibold"><MdUpdate/></span>}
        title="Releases"
        subtitle={
          <span>
            Current version: <span className="font-mono">{APP_VERSION}</span>
          </span>
        }
        actions={null}
      />

      <div className="space-y-4">
        {RELEASES.map((r) => (
          <div key={r.version} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {r.version} <span className="text-gray-500 font-normal">— {r.title}</span>
              </h2>
              <div className="text-sm text-gray-500">{formatDate(r.date)}</div>
            </div>

            {Array.isArray(r.items) && r.items.length > 0 && (
              <ul className="list-disc ml-5 mt-3 space-y-1 text-gray-700">
                {r.items.map((it, idx) => (
                  <li key={idx}>{renderTextWithLinks(it)}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
        </div>
    );
}