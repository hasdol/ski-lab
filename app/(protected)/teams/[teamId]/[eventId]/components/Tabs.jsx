'use client';
import Button from '@/components/common/Button';
import React from 'react';

export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = ['Overview', 'Tests', 'Weather'];

  return (
    <div className="flex space-x-2 my-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;


        return (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant='tab'
            className={` text-sm ${isActive && 'bg-gray-200'}`}
          >
            {tab}
          </Button>
        );
      })}
    </div>
  );
}
