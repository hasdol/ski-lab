// components/SelectSeason/SelectSeason.jsx

import Input from '@/components/common/Input';
import React from 'react';
import { useTranslation } from 'react-i18next';

const SelectSeason = ({ selectedSeason, handleSeasonChange, availableSeasons }) => {
  const { t } = useTranslation();
  // Prepare options for the Input component, including an "All Seasons" choice
  const options = [
    { label: t('all_seasons'), value: '' },
    ...availableSeasons.map(season => ({ label: season, value: season })),
  ];

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="select"
        name="season"
        label={t('season')}
        value={selectedSeason}
        onChange={handleSeasonChange}
        options={options}
        placeholder={t('all_seasons')}
        className="bg-sbtn "
      />
    </div>
  );
};

export default SelectSeason;
