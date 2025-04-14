import React from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner/Spinner';

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

  // Styling
  const baseStyles = isIconOnly
    ? 'p-2 rounded focus:outline-none transition duration-200'
    : 'px-4 py-2 rounded focus:outline-none transition duration-200';

  let variantStyles = '';
  switch (variant) {
    case 'primary':
      variantStyles = 'bg-btn text-btntxt hover:bg-neutral-700';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-200 hover:bg-gray-300';
      break;
    case 'danger':
      variantStyles = 'bg-red-500 text-white hover:bg-red-600';
      break;
    default:
      variantStyles = 'bg-blue-500 text-white hover:bg-blue-600';
      break;
  }

  const disabledStyles = disabled || loading ? ' opacity-60 cursor-not-allowed pointer-events-none' : '';

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
