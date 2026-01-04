// EventOverview.js
'use client';
import React from 'react';
import Markdown from '@/components/common/Markdown/Markdown';

export default function EventOverview({ eventData }) {
  const description = eventData?.description || '';
  if (description.length === 0) {
    return <div className="my-4 italic">Welcome! More information will be available soon.</div>;
  }
  return (
    <div>
      <Markdown>{description}</Markdown>
    </div>
  );
}
