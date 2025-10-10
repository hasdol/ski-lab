'use client';
import React from 'react';

export default function EventTabs({ activeTab, setActiveTab }) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'Info'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('Info')}
      >
        Info
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'Tests'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('Tests')}
      >
        Tests
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'Weather'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('Weather')}
      >
        Weather
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm ${activeTab === 'Dashboard'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => setActiveTab('Dashboard')}
      >
        Dashboard
      </button>
    </div>
  );
}
