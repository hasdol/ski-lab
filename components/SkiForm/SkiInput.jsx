// SkiInput.js
import React from 'react';

const SkiInput = ({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    required,
    isStyle,
    disabled,
    min,
    max,
    step,
    options // New prop for select options
}) => {
    return (
        <div className="mb-2 flex flex-col">
            <label className='font-semibold relative'>
                {label}
                {required && <span className="absolute mx-1 text-xl text-red-500">*</span>}
            </label>

            {type === "range" ? (
                <div className="flex flex-col accent-btn">
                    <input
                        type="range"
                        name={name}
                        className='w-full'
                        value={value}
                        onChange={onChange}
                        min={min}
                        max={max}
                        step={step || 1}  // Optional: step can default to 1 if not provided
                        disabled={disabled}
                    />
                    <span className='text-text'>{value || 200} cm</span>
                </div>
            ) : isStyle ? (
                <select
                    name={name}
                    className='p-2 rounded bg-container border-sbtn text-inputtxt'
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                >
                    <option value="" disabled>Select...</option>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    className='p-2 rounded border bg-container border-sbtn text-inputtxt '
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                />
            )}
        </div>
    );
};

export default SkiInput;
