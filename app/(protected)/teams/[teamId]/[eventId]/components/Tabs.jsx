'use client';
import Button from '@/components/common/Button';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Tabs({ activeTab, setActiveTab }) {
  const { t } = useTranslation();
  const tabs = ['overview', 'tests', 'weather'];

  return (
    <div className="flex space-x-2 my-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            variant={`${isActive ? 'primary' : 'secondary'}`}
            className='text-xs'
          >
            {t(tab)}
          </Button>
        );
      })}
    </div>
  );
}
