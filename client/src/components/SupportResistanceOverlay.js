import React, { useMemo } from 'react';
import chartDataService from '../services/chartDataService';

const SupportResistanceOverlay = ({ 
  data = [], 
  symbol = 'BTC', 
  timeframe = '1D',
  width = 800, 
  height = 400,
  className = '' 
}) => {
  const levels = useMemo(() => {
    const chartData = data.length > 0 ? data : chartDataService.generateSampleOHLCVData(symbol, timeframe, 100);
    return chartDataService.calculateSupportResistance(chartData, 20);
  }, [data, symbol, timeframe]);

  const { support, resistance } = levels;

  // Calculate price range for positioning
  const priceRange = useMemo(() => {
    if (!data.length) return { min: 0, max: 100 };
    
    const prices = data.flatMap(d => [d.h, d.l]);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }, [data]);

  const getYPosition = (price) => {
    const { min, max } = priceRange;
    const range = max - min;
    const position = ((max - price) / range) * height;
    return Math.max(0, Math.min(height, position));
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg width={width} height={height} className="absolute inset-0">
        {/* Support Levels */}
        {support.map((level, index) => (
          <g key={`support-${index}`}>
            <line
              x1={0}
              y1={getYPosition(level.level)}
              x2={width}
              y2={getYPosition(level.level)}
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="5,5"
              opacity={0.7}
            />
            <text
              x={width - 80}
              y={getYPosition(level.level) - 5}
              fill="#10b981"
              fontSize="12"
              fontFamily="Inter, sans-serif"
              className="font-medium"
            >
              Support: ${level.level.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Resistance Levels */}
        {resistance.map((level, index) => (
          <g key={`resistance-${index}`}>
            <line
              x1={0}
              y1={getYPosition(level.level)}
              x2={width}
              y2={getYPosition(level.level)}
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5,5"
              opacity={0.7}
            />
            <text
              x={width - 90}
              y={getYPosition(level.level) + 15}
              fill="#ef4444"
              fontSize="12"
              fontFamily="Inter, sans-serif"
              className="font-medium"
            >
              Resistance: ${level.level.toFixed(2)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default SupportResistanceOverlay;