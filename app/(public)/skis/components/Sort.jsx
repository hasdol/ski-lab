import React from 'react';

const SkiSort = ({ onSortChange, currentSort }) => {

  const handleSortChange = (event) => {
    const { value } = event.target;
    onSortChange(value);
  };

  return (
    <div className="flex flex-col w-fit text-center">
      <label htmlFor="sort" className="text-sm font-semibold mb-1">
        Sort by
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="h-10 bg-white text-btn-txt rounded p-2"
      >
        <option value="serialNumber">Serial number</option>
        <option value="grind">Grind</option>
        <option value="base">Base</option>
      </select>
    </div>
  );
  
};

export default SkiSort;
