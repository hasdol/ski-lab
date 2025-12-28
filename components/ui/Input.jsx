import React, { useContext, useId } from 'react';
import PropTypes from 'prop-types';
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
  const { gloveMode } = useContext(UserPreferencesContext) || { gloveMode: false };
  const gloveClasses = gloveMode ? 'p-4 text-xl' : 'p-2';

  const reactId = useId();
  const displayLabel = label || placeholder;

  // Prefer explicit id, then name, then a stable generated id.
  const inputId = props.id || name || `input-${reactId}`;

  // Ensure form fields have a name when possible (helps audits/autofill).
  // NOTE: for fields using a generic handleInputChange that relies on e.target.name,
  // you should still pass `name` explicitly from the caller.
  const inputName = name || props.name || inputId;

  const labelStyles = 'text-text block mb-1';

  // ✅ Special case: radio groups should not use a single <label for="...">.
  if (type === 'radio') {
    return (
      <fieldset className="min-w-0" disabled={disabled} aria-required={required}>
        {displayLabel ? (
          <legend className={labelStyles}>
            {displayLabel} {required && <span className="text-xl text-red-500">*</span>}
          </legend>
        ) : null}

        <div className="flex items-center space-x-4 mt-1">
          {options?.map((option, index) => {
            const radioId = `${inputId}-${index}`;
            return (
              <div key={index} className="inline-flex items-center space-x-1 text-text">
                <input
                  id={radioId}
                  type="radio"
                  name={inputName}
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  required={required}
                  disabled={disabled}
                  className={`${gloveClasses} accent-btn border border-gray-300 h-5 w-5`}
                />
                <label htmlFor={radioId}>{option.label}</label>
              </div>
            );
          })}
        </div>
      </fieldset>
    );
  }

  let inputElement;

  if (type === 'textarea') {
    inputElement = (
      <textarea
        id={inputId}
        name={inputName}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full bg-white text-text border border-gray-300 rounded-2xl ${gloveClasses} ${className}`}
        {...props}
      />
    );
  } else if (type === 'select') {
    inputElement = (
      <select
        id={inputId}
        name={inputName}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full bg-container text-text border border-gray-300 rounded-2xl ${gloveClasses} ${className}`}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options?.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (type === 'range') {
    inputElement = (
      <div className="flex flex-col">
        <input
          id={inputId}
          type="range"
          name={inputName}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full bg-white text-text border border-gray-300 rounded-2xl ${gloveClasses} ${className}`}
          {...props}
        />
        <span className="text-text">
          {value} {unit || ''}
        </span>
      </div>
    );
  } else {
    inputElement = (
      <input
        id={inputId}
        type={type}
        name={inputName}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full bg-white text-text border border-gray-300 rounded-2xl ${gloveClasses} text-base ${className} ${disabled && 'bg-gray-100!'}`}
        {...props}
      />
    );
  }

  return (
    <div>
      {displayLabel ? (
        <label htmlFor={inputId} className={labelStyles}>
          {displayLabel} {required && <span className="text-xl absolute text-red-500">*</span>}
        </label>
      ) : null}
      {inputElement}
    </div>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.oneOf(['text', 'number', 'textarea', 'select', 'radio', 'range']),
  // Many callers currently omit name; keep it optional here, but prefer passing it explicitly.
  name: PropTypes.string,
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
