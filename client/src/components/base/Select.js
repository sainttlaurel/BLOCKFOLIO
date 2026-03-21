import React from 'react';

/**
 * Select - Professional select dropdown component
 * Supports options and custom styling
 */
const Select = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option',
  className = '',
  ...props 
}) => {
  const selectClasses = `input-field ${className}`;

  return (
    <select
      value={value}
      onChange={onChange}
      className={selectClasses}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;