'use client';
import React from 'react';

export default function EventTabs({ activeTab, setActiveTab }) {
  const tabs = ['Overview', 'Tests', 'Weather'];

  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm ${
              isActive
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
