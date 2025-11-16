import React from 'react';

export const Button = ({ children, className = '', variant, size, ...props }: any) => {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1';
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
