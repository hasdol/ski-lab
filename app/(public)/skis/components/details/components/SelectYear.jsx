// SelectYear.jsx
import React from 'react';

const SelectYear = ({ selectedYear, handleYearChange, availableYears }) => {

  return (
    <div className="flex flex-wrap items-center">
      <label htmlFor="year-select" className="mr-1">Select year:</label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={handleYearChange}
        className="bg-sbtn rounded mx-2 p-1 px-2 text-text border cursor-pointer"
      >
        <option value="">All</option>
        {availableYears.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
};

export default SelectYear;
