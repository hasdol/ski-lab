import React from 'react';
import { useTranslation } from 'react-i18next';

const SkiSort = ({ onSortChange, currentSort }) => {
  const { t } = useTranslation();

  const handleSortChange = (event) => {
    const { value } = event.target;
    onSortChange(value);
  };

  return (
    <div className="flex flex-col w-fit text-center">
      <label htmlFor="sort" className="text-sm font-semibold mb-1">
        {t('sort_by')}
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="h-10 bg-white text-btn-txt rounded p-2"
      >
        <option value="serialNumber">{t('serial_number')}</option>
        <option value="grind">{t('grind')}</option>
        <option value="base">Base</option>
      </select>
    </div>
  );
  
};

export default SkiSort;
