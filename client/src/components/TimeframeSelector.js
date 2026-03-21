import React from 'react';

const TimeframeSelector = ({ selectedTimeframe, onTimeframeChange, className = '' }) => {
  const timeframes = ['1D', '7D', '1M', '3M', '1Y'];

  return (
    <div className={`flex space-x-1 ${className}`}>
      {timeframes.map((timeframe) => (
        <button
          key={timeframe}
          onClick={() => onTimeframeChange(timeframe)}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            selectedTimeframe === timeframe
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;