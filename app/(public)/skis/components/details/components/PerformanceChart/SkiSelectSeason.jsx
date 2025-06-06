// components/SelectSeason/SelectSeason.jsx

import Input from '@/components/ui/Input';
import React from 'react';

const SelectSeason = ({ selectedSeason, handleSeasonChange, availableSeasons }) => {
  // Prepare options for the Input component, including an "All Seasons" choice
  const options = [
    ...availableSeasons.map(season => ({ label: season, value: season })),
  ];

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="select"
        name="season"
        label='Season'
        value={selectedSeason}
        onChange={handleSeasonChange}
        options={options}
        placeholder='All seasons'
      />
    </div>
  );
};

export default SelectSeason;
