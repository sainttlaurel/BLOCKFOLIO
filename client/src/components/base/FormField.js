import React from 'react';

/**
 * FormField - Professional form field wrapper component
 * Provides consistent styling and layout for form elements
 */
const FormField = ({ 
  label, 
  children, 
  error, 
  required = false,
  helpText,
  className = '',
  id
}) => {
  // Generate unique ID if not provided
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const helpTextId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-error-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      {React.cloneElement(children, {
        id: fieldId,
        'aria-required': required,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': error ? errorId : helpText ? helpTextId : undefined
      })}
      {helpText && !error && (
        <p id={helpTextId} className="text-sm text-neutral-500">{helpText}</p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-error-600" role="alert">{error}</p>
      )}
    </div>
  );
};

export default FormField;