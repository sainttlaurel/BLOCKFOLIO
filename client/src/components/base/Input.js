import React from 'react';

/**
 * Input - Professional input component with trading platform styling
 * Supports various input types and validation states
 */
const Input = ({ 
  type = 'text',
  label,
  error,
  success,
  placeholder,
  className = '',
  id,
  ...props 
}) => {
  const baseClasses = 'input-field';
  
  const stateClasses = error 
    ? 'border-error-500 focus:ring-error-500' 
    : success 
    ? 'border-success-500 focus:ring-success-500'
    : '';

  const inputClasses = `${baseClasses} ${stateClasses} ${className}`;
  
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const successId = `${inputId}-success`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : success ? successId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-error-600" role="alert">{error}</p>
      )}
      {success && (
        <p id={successId} className="text-sm text-success-600" role="status">{success}</p>
      )}
    </div>
  );
};

export default Input;