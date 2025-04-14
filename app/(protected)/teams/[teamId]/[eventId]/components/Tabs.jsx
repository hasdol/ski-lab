'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Tabs({ activeTab, setActiveTab }) {
  const { t } = useTranslation();
  const tabs = ['overview', 'tests', 'weather'];

  return (
    <div className="flex space-x-4 my-4">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-3 py-2 shadow rounded 
            ${activeTab === tab ? 'bg-sbtn shadow-none' : 'bg-container'}`}
        >
          {t(tab)}
        </button>
      ))}
    </div>
  );
}
