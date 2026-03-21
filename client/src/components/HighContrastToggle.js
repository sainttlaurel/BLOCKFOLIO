import React from 'react';
import { Eye } from 'lucide-react';
import { useHighContrast } from '../contexts/HighContrastContext';

const HighContrastToggle = () => {
  const { isHighContrast, toggleHighContrast } = useHighContrast();

  return (
    <button
      onClick={toggleHighContrast}
      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
      aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
      aria-pressed={isHighContrast}
      title={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">
        {isHighContrast ? 'High Contrast: On' : 'High Contrast: Off'}
      </span>
    </button>
  );
};

export default HighContrastToggle;
