import React from 'react';

// Simple custom select-like components. We avoid rendering a native <select>
// wrapper so we don't accidentally nest invalid elements (e.g. <div> inside <select>).
export const Select = ({ children, defaultValue, className = '', ...props }: any) => (
  <div role="listbox" aria-label="select" className={className} {...props}>
    {children}
  </div>
);

export const SelectTrigger = ({ children, className = '', ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

export const SelectValue = ({ children }: any) => <span>{children}</span>;
export const SelectContent = ({ children }: any) => <div>{children}</div>;

// Render a button/div for each item instead of <option>
export const SelectItem = ({ children, value, onClick }: any) => (
  <div role="option" data-value={value} onClick={onClick} className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
    {children}
  </div>
);

export default Select;
