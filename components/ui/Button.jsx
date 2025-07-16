'use client'
import React from 'react';
import PropTypes from 'prop-types';
import Spinner from '../common/Spinner/Spinner';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '', 
  ...props
}) => {
  const isIconOnly = React.Children.count(children) === 1 && React.isValidElement(children);

  const baseStyles = isIconOnly
    ? 'p-3.5 rounded-lg focus:outline-none transition-all duration-200'
    : 'px-5 py-2.5 rounded-lg focus:outline-none transition-all duration-200';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:to-indigo-600 active:scale-[0.98]';
      break;
    case 'secondary':
      variantStyles = 'bg-slate-200 hover:bg-slate-300 text-gray-800 active:scale-[0.98]';
      break;
    case 'danger':
      variantStyles = 'bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors active:scale-[0.98] focus:ring-2 focus:ring-red-300';
      break;
    case 'upgrade':
      variantStyles = 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] focus:ring-2 focus:ring-blue-300 shadow-sm';
      break;
    case 'tab':
      variantStyles = 'bg-gray-100 text-gray-800 hover:bg-gray-200 px-4 py-3';
      break;
    case 'archive':
      variantStyles = 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300';
      break;
    default:
      variantStyles = 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98] focus:ring-2 focus:ring-blue-300 shadow-sm';
      break;
  }

  const disabledStyles = disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${disabledStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <span>{children}</span>
          <Spinner />
        </div>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
