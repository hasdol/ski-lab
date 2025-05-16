// EventOverview.js
'use client';
import React from 'react';

export default function EventOverview({ eventData }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Overview</h2>
      <p>{eventData.description}</p>
    </div>
  );
}
