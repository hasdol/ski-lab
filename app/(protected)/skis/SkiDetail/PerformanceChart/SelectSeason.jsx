// components/SelectSeason/SelectSeason.jsx

import React from 'react';
import { useTranslation } from 'react-i18next';

const SelectSeason = ({ selectedSeason, handleSeasonChange, availableSeasons }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="season" className="text-sm">{t('season')}:</label>
      <select
        id="season"
        value={selectedSeason}
        onChange={handleSeasonChange}
        className="bg-sbtn rounded p-2"
      >
        <option value="">{t('all_seasons')}</option>
        {availableSeasons.map(season => (
          <option key={season} value={season}>
            {season}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectSeason;
