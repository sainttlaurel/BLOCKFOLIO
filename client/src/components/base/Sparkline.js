import React, { useRef, useEffect, useMemo } from 'react';
import { useChartOptimization, optimizeSparkline } from '../../utils/chartOptimization';

const Sparkline = ({ 
  data = [], 
  width = 80, 
  height = 30, 
  color = '#3B82F6',
  strokeWidth = 2,
  className = '',
  showDots = false,
  animate = true,
  ariaLabel = null // Allow custom aria-label
}) => {
  const canvasRef = useRef(null);
  const { optimizer, dataProcessor, animator, performanceMonitor } = useChartOptimization(canvasRef);
  
  // Memoize processed data to avoid recalculation
  const processedData = useMemo(() => {
    if (!data.length) return [];
    
    // Cache key for processed data
    const cacheKey = `sparkline_${data.length}_${data[0]}_${data[data.length - 1]}`;
    const cached = dataProcessor?.getCachedData(cacheKey);
    
    if (cached) return cached;
    
    // Downsample data if too many points for sparkline
    const maxPoints = Math.min(width, 100); // Limit based on width
    const downsampled = dataProcessor?.downsampleData(data, maxPoints) || data;
    
    dataProcessor?.cacheData(cacheKey, downsampled);
    return downsampled;
  }, [data, width, dataProcessor]);

  // Calculate trend description for accessibility
  const getTrendDescription = () => {
    if (!data.length) return 'No data available';
    
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const change = lastValue - firstValue;
    const changePercent = ((change / firstValue) * 100).toFixed(2);
    const trend = change >= 0 ? 'upward' : 'downward';
    
    return `Sparkline chart showing ${trend} trend, ${change >= 0 ? 'up' : 'down'} ${Math.abs(changePercent)}%`;
  };

  useEffect(() => {
    if (!optimizer || !processedData.length) return;

    const renderSparkline = () => {
      if (performanceMonitor) {
        performanceMonitor.measureRenderTime(() => {
          const { render } = optimizeSparkline.createRenderer(canvasRef.current, processedData, {
            color,
            strokeWidth,
            showFill: true,
            animate
          });
          
          if (animate) {
            // Animate the sparkline drawing
            animator?.animateValues([0], [1], 300, (values) => {
              render(values[0]);
            });
          } else {
            render(1);
          }
        });
      } else {
        // Fallback rendering without performance monitoring
        const { render } = optimizeSparkline.createRenderer(canvasRef.current, processedData, {
          color,
          strokeWidth,
          showFill: true,
          animate
        });
        render(1);
      }
    };

    renderSparkline();
  }, [optimizer, processedData, color, strokeWidth, showDots, animate, animator, performanceMonitor]);

  // Generate sample data if none provided
  const generateSampleData = () => {
    const sampleData = [];
    let value = 100;
    for (let i = 0; i < 20; i++) {
      value += (Math.random() - 0.5) * 10;
      sampleData.push(Math.max(value, 50)); // Keep values reasonable
    }
    return sampleData;
  };

  const chartData = data.length > 0 ? data : generateSampleData();

  return (
    <canvas
      ref={canvasRef}
      className={`sparkline ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'block'
      }}
      role="img"
      aria-label={ariaLabel || getTrendDescription()}
    />
  );
};

// Sparkline with trend indicator
export const SparklineWithTrend = ({ 
  data = [], 
  width = 80, 
  height = 30,
  className = '',
  coinName = 'Asset' // For better accessibility
}) => {
  if (!data.length) return null;

  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const isPositive = lastValue >= firstValue;
  const changePercent = (((lastValue - firstValue) / firstValue) * 100).toFixed(2);
  const color = isPositive ? '#10B981' : '#EF4444'; // Green or Red

  return (
    <div className={`flex items-center space-x-2 ${className}`} role="group" aria-label={`${coinName} price trend`}>
      <Sparkline
        data={data}
        width={width}
        height={height}
        color={color}
        strokeWidth={2}
        ariaLabel={`${coinName} price trend: ${isPositive ? 'up' : 'down'} ${Math.abs(changePercent)}%`}
      />
      <div 
        className={`text-xs font-medium ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
        aria-label={`Trend direction: ${isPositive ? 'upward' : 'downward'}`}
      >
        {isPositive ? '↗' : '↘'}
      </div>
    </div>
  );
};

// Mini sparkline for compact displays
export const MiniSparkline = ({ 
  data = [], 
  trend = 'neutral',
  ariaLabel = null 
}) => {
  const colors = {
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280'
  };

  const getTrendLabel = () => {
    if (ariaLabel) return ariaLabel;
    return `Mini price chart showing ${trend} trend`;
  };

  return (
    <Sparkline
      data={data}
      width={40}
      height={16}
      color={colors[trend] || colors.neutral}
      strokeWidth={1.5}
      ariaLabel={getTrendLabel()}
    />
  );
};

export default Sparkline;