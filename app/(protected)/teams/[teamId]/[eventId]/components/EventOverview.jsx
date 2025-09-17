// EventOverview.js
'use client';
import React from 'react';

export default function EventOverview({ eventData }) {
  if (eventData.description.length === 0) {
    return <div className="my-4 italic">Welcome! More information will be available soon.</div>;
  }
  return (
    <div>
      <p>{eventData.description}</p>
    </div>
  );
}
