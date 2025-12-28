'use client';

import React from 'react';

const Card = ({
  children,
  className = '',
  as: Component = 'div',
  padded = true,
}) => {
  const base =
    'rounded-2xl bg-white/75 backdrop-blur-xl ring-1 ring-black/5 shadow-xs overflow-hidden transition-colors duration-200';
  const padding = padded ? 'p-6' : '';

  return <Component className={[base, padding, className].join(' ')}>{children}</Component>;
};

export default Card;