'use client';
import React from 'react';

export default function EventTabs({ activeTab, setActiveTab, canSeeDashboard, onTabChange }) {
  const go = (tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      <button
        className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'Info'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => go('Info')}
      >
        Info
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'Tests'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => go('Tests')}
      >
        Tests
      </button>
      <button
        className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'Weather'
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-gray-700'}`}
        onClick={() => go('Weather')}
      >
        Weather
      </button>
      {canSeeDashboard && (
        <button
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap focus-visible:outline-none ${activeTab === 'Dashboard'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => go('Dashboard')}
        >
          Dashboard
        </button>
      )}
    </div>
  );
}
