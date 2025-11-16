import React from 'react';

export const Card = ({ children, className = '', ...props }: any) => {
  // In dev keep only a border visual but avoid forcing a yellow background
  // so section backgrounds and card-level bg classes can show correctly.
  const devVisual = process.env.NODE_ENV !== 'production' ? 'border border-red-300' : '';
  return (
    <div className={`rounded-lg ${devVisual} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
