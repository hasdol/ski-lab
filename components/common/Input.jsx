import React, { useContext } from 'react';
import PropTypes from 'prop-types';
// Adjust the import path if needed.
import { UserPreferencesContext } from '@/context/UserPreferencesContext';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  options,
  unit,
  className = '',
  ...props
}) => {
  // Use glove mode from context (if available) to adjust input padding and size
  const { gloveMode } = useContext(UserPreferencesContext) || { gloveMode: false };
  const gloveClasses = gloveMode ? 'p-4 text-xl' : 'p-2';

  // Use the label prop if provided; otherwise, fallback to placeholder text for the label
  const displayLabel = label || placeholder;
  const labelStyles = 'text-text block mb-1';

  let inputElement;
  if (type === 'textarea') {
    inputElement = (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full bg-container text-text border rounded-md ${gloveClasses} ${className}`}
        {...props}
      />
    );
  } else if (type === 'select') {
    inputElement = (
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full bg-container text-text border rounded-md ${gloveClasses} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options?.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (type === 'radio') {
    inputElement = (
      <div className="flex items-center space-x-4 mt-1">
        {options?.map((option, index) => (
          <label key={index} className="inline-flex items-center space-x-1 text-text">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              required={required}
              disabled={disabled}
              className={`${gloveClasses} accent-btn border-gray-300 h-5 w-5`}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  } else if (type === 'range') {
    inputElement = (
      <div className="flex flex-col">
        <input
          id={name}
          type="range"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full bg-container text-text border rounded-md ${gloveClasses} ${className}`}
          {...props}
        />
        <span className="text-text mt-1">
          {value} {unit || ''}
        </span>
      </div>
    );
  } else {
    // Default case for 'text', 'number', etc.
    inputElement = (
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full bg-container text-text border rounded-md ${gloveClasses} ${className}`}
        {...props}
      />
    );
  }

  return (
    <div>
      {displayLabel && (
        <label htmlFor={name} className={labelStyles}>
          {displayLabel} {required && <span className="text-xl absolute text-red-500">*</span>}
        </label>
      )}
      {inputElement}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'number', 'textarea', 'select', 'radio', 'range']),
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.any,
    })
  ),
  unit: PropTypes.string,
  className: PropTypes.string,
};

export default Input;
