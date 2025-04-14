// EventOverview.js
'use client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function EventOverview({ eventData }) {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{t('overview')}</h2>
      <p>{eventData.description}</p>
    </div>
  );
}
