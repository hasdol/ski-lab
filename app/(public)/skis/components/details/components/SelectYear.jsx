// SelectYear.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const SelectYear = ({ selectedYear, handleYearChange, availableYears }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center">
      <label htmlFor="year-select" className="mr-1">{t('select_year')}:</label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={handleYearChange}
        className="bg-sbtn rounded mx-2 p-1 px-2 text-text border cursor-pointer"
      >
        <option value="">{t('all')}</option>
        {availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
};

export default SelectYear;
