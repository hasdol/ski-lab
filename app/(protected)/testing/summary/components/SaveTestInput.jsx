// SaveTestInput.js
import { UserPreferencesContext } from '@/context/UserPreferencesContext';
import React, { useContext } from 'react';

const SaveTestInput = ({ name, type, placeholder, onChange, required, value, options }) => {
  const { gloveMode } = useContext(UserPreferencesContext);

  // Helper class for bigger buttons in glove mode
  const gloveClasses = gloveMode ? 'p-4 text-xl' : 'p-2';

  if (type === 'select') {
    // Render a <select>
    return (
      <div className='mb-4'>
        <label className='text-text block mb-1'>
          {placeholder} {required && <span className="text-xl absolute text-red-500">*</span>}
        </label>
        <select
          className={`w-full bg-container text-inputtxt ${gloveClasses} rounded`}
          name={name}
          onChange={onChange}
          value={value}
          required={required}
        >
          <option value="">{placeholder}</option>
          {options?.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'radio') {
    // Render multiple radio buttons
    return (
      <div className="mb-4 flex flex-col">
        <label className="text-text block mb-1">
          {placeholder} {required && <span className="text-xl absolute text-red-500">*</span>}
        </label>
        <div className="flex  items-center space-x-4 mt-1">
          {options?.map((option, index) => (
            <label key={index} className="inline-flex items-center space-x-1 text-text">
              <input
                className={`${gloveClasses} accent-btn border-gray-300 h-5 w-5`}
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
                required={required}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Otherwise, default to an <input> type (e.g. text, number, etc)
  return (
    <div className='mb-4'>
      <label className='text-text block mb-1'>
        {placeholder} {required && <span className="text-xl absolute text-red-500">*</span>}
      </label>
      <input
        className={`w-full bg-container text-inputtxt ${gloveClasses} rounded `}
        type={type}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        required={required}
      />
    </div>
  );
};

export default SaveTestInput;
