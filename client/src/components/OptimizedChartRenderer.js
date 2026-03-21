import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  useChartOptimization, 
  optimizeCandlestickChart,
  globalFrameManager 
} from '../utils/chartOptimization';

/**
 * Optimized Chart Renderer using Canvas for high-performance rendering
 * Handles large datasets efficiently with progressive loading and smooth 60fps animations
 */
const OptimizedChartRenderer = ({
  data = [],
  width = 800,
  height = 400,
  type = 'candlestick', // 'candlestick', 'line', 'area'
  showVolume = true,
  onDataPointHover,
  className = ''
}) => {
  const canvasRef = useRef(null);
  const { optimizer, dataProcessor, animator, performanceMonitor, frameManager } = useChartOptimization(canvasRef);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedDataPoints, setLoadedDataPoints] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewport, setViewport] = useState({ startX: 0, endX: 0, startY: 0, endY: 0 });

  // Progressive loading configuration
  const CHUNK_SIZE = 100; // Increased chunk size for better performance
  const ANIMATION_DURATION = 800; // Reduced duration for snappier feel
  const TARGET_FPS = 60;

  // Chart dimensions and padding
  const padding = { top: 20, right: 60, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Memoize and cache processed data ranges
  const ranges = useMemo(() => {
    if (!data.length) return { priceMin: 0, priceMax: 100, volumeMax: 1000000 };

    const cacheKey = `ranges_${data.length}_${type}`;
    const cached = dataProcessor?.getCachedData(cacheKey);
    
    if (cached) return cached;

    const prices = data.flatMap(d => [d.h, d.l]);
    const volumes = data.map(d => d.v);

    const result = {
      priceMin: Math.min(...prices) * 0.98, // Add 2% padding
      priceMax: Math.max(...prices) * 1.02,
      volumeMax: Math.max(...volumes)
    };

    dataProcessor?.cacheData(cacheKey, result);
    return result;
  }, [data, type, dataProcessor]);

  // Optimized viewport calculations
  const createViewport = useCallback(() => {
    return {
      startX: 0,
      endX: data.length,
      getX: (index) => padding.left + (index / (data.length - 1)) * chartWidth,
      getY: (price) => padding.top + ((ranges.priceMax - price) / (ranges.priceMax - ranges.priceMin)) * chartHeight
    };
  }, [data.length, chartWidth, ranges, padding]);

  // Optimized candlestick drawing with viewport culling
  const drawCandlestick = useCallback((ctx, dataPoint, index, alpha = 1) => {
    if (!optimizer) return;
    
    const viewport = createViewport();
    
    // Viewport culling - only draw visible candles
    const x = viewport.getX(index);
    if (x < -50 || x > width + 50) return; // Skip off-screen candles
    
    const candleWidth = Math.max(1, Math.min(chartWidth / data.length * 0.8, 12));
    
    const isGreen = dataPoint.c >= dataPoint.o;
    const color = isGreen ? '#10b981' : '#ef4444';
    
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;

    // Calculate OHLC positions
    const yOpen = viewport.getY(dataPoint.o);
    const yHigh = viewport.getY(dataPoint.h);
    const yLow = viewport.getY(dataPoint.l);
    const yClose = viewport.getY(dataPoint.c);

    // Draw wick (high-low line)
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    // Draw body (open-close rectangle)
    const bodyHeight = Math.abs(yClose - yOpen);
    const bodyY = Math.min(yOpen, yClose);
    
    if (isGreen) {
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
    } else {
      ctx.strokeRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight);
    }

    ctx.globalAlpha = 1;
  }, [optimizer, createViewport, chartWidth, data.length, width]);

  // Optimized line chart drawing
  const drawLine = useCallback((ctx, alpha = 1) => {
    if (data.length < 2 || !optimizer) return;

    const viewport = createViewport();
    
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let pathStarted = false;
    
    // Only draw visible portion of the line
    for (let i = 0; i < Math.min(loadedDataPoints, data.length); i++) {
      const dataPoint = data[i];
      const x = viewport.getX(i);
      
      // Skip off-screen points for performance
      if (x < -50) continue;
      if (x > width + 50) break;
      
      const y = viewport.getY(dataPoint.c);
      
      if (!pathStarted) {
        ctx.moveTo(x, y);
        pathStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [data, loadedDataPoints, createViewport, optimizer, width]);

  // Optimized volume bars with batching
  const drawVolume = useCallback((ctx, alpha = 1) => {
    if (!showVolume || !optimizer) return;

    const viewport = createViewport();
    ctx.globalAlpha = alpha * 0.6;
    const barWidth = Math.max(1, chartWidth / data.length * 0.6);

    // Batch drawing operations for better performance
    const greenBars = [];
    const redBars = [];

    for (let i = 0; i < Math.min(loadedDataPoints, data.length); i++) {
      const dataPoint = data[i];
      const x = viewport.getX(i);
      
      // Skip off-screen bars
      if (x < -50) continue;
      if (x > width + 50) break;
      
      const yVolume = height - padding.bottom - ((dataPoint.v / ranges.volumeMax) * (chartHeight * 0.2));
      const barHeight = (height - padding.bottom) - yVolume;
      
      const isGreen = dataPoint.c >= dataPoint.o;
      const bar = { x: x - barWidth / 2, y: yVolume, width: barWidth, height: barHeight };
      
      if (isGreen) {
        greenBars.push(bar);
      } else {
        redBars.push(bar);
      }
    }

    // Draw all green bars at once
    if (greenBars.length > 0) {
      ctx.fillStyle = '#10b981';
      greenBars.forEach(bar => {
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
      });
    }

    // Draw all red bars at once
    if (redBars.length > 0) {
      ctx.fillStyle = '#ef4444';
      redBars.forEach(bar => {
        ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
      });
    }

    ctx.globalAlpha = 1;
  }, [showVolume, data, loadedDataPoints, createViewport, chartWidth, height, padding, ranges, optimizer, width]);

  // Optimized grid drawing with reduced operations
  const drawGrid = useCallback((ctx) => {
    if (!optimizer) return;
    
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Horizontal grid lines (price levels)
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const y = padding.top + (i / priceSteps) * chartHeight;
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
    }

    // Vertical grid lines (time)
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding.left + (i / timeSteps) * chartWidth;
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
    }
    
    ctx.stroke();
  }, [padding, chartWidth, chartHeight, optimizer]);

  // Optimized label drawing with text caching
  const drawLabels = useCallback((ctx) => {
    if (!optimizer) return;
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';

    // Price labels
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = ranges.priceMax - (i / priceSteps) * (ranges.priceMax - ranges.priceMin);
      const y = padding.top + (i / priceSteps) * chartHeight;
      ctx.fillText(`${price.toLocaleString()}`, padding.left - 10, y + 4);
    }

    // Time labels (simplified for performance)
    ctx.textAlign = 'center';
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const dataIndex = Math.floor((i / timeSteps) * (data.length - 1));
      if (data[dataIndex]) {
        const x = padding.left + (i / timeSteps) * chartWidth;
        ctx.fillText(data[dataIndex].x, x, height - 10);
      }
    }
  }, [ranges, padding, chartHeight, chartWidth, data, height, optimizer]);

  // Main render function with performance monitoring
  const render = useCallback(() => {
    if (!optimizer) return;

    const renderFrame = () => {
      const ctx = optimizer.getOptimizedContext();
      optimizer.clear();

      // Draw grid and labels
      drawGrid(ctx);
      drawLabels(ctx);

      // Draw chart based on type
      if (type === 'candlestick') {
        for (let i = 0; i < Math.min(loadedDataPoints, data.length); i++) {
          drawCandlestick(ctx, data[i], i);
        }
      } else if (type === 'line') {
        drawLine(ctx);
      }

      // Draw volume
      drawVolume(ctx);

      // Draw hover indicator
      if (hoveredPoint) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(hoveredPoint.x, padding.top);
        ctx.lineTo(hoveredPoint.x, padding.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      optimizer.commitFrame();
    };

    if (performanceMonitor) {
      performanceMonitor.measureRenderTime(renderFrame);
    } else {
      renderFrame();
    }
  }, [optimizer, drawGrid, drawLabels, type, data, loadedDataPoints, drawCandlestick, drawLine, drawVolume, hoveredPoint, padding, chartHeight, performanceMonitor]);

  // Progressive loading with frame rate management
  useEffect(() => {
    if (data.length === 0) return;

    setIsLoading(true);
    setLoadedDataPoints(0);

    let animationId;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const newLoadedPoints = Math.floor(progress * data.length);

      setLoadedDataPoints(newLoadedPoints);

      if (progress < 1) {
        // Use frame manager for consistent 60fps
        frameManager.addCallback(animate);
      } else {
        setIsLoading(false);
        frameManager.removeCallback(animate);
      }
    };

    frameManager.addCallback(animate);

    return () => {
      frameManager.removeCallback(animate);
    };
  }, [data.length, frameManager]);

  // Render when data changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      render();
    }, 16); // ~60fps debouncing

    return () => clearTimeout(timeoutId);
  }, [render]);

  // Handle mouse interactions with throttling
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || !optimizer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest data point with viewport culling
    if (x >= padding.left && x <= padding.left + chartWidth) {
      const dataIndex = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
      const dataPoint = data[dataIndex];
      
      if (dataPoint) {
        setHoveredPoint({ x, y, dataPoint, index: dataIndex });
        onDataPointHover?.(dataPoint, dataIndex);
      }
    } else {
      setHoveredPoint(null);
      onDataPointHover?.(null, -1);
    }
  }, [padding, chartWidth, data, onDataPointHover, optimizer]);

  const handleMouseLeave = useCallback(() => {
    setHoveredPoint(null);
    onDataPointHover?.(null, -1);
  }, [onDataPointHover]);

  // Setup canvas with proper sizing
  useEffect(() => {
    if (canvasRef.current && optimizer) {
      optimizer.resize(width, height);
    }
  }, [width, height, optimizer]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="cursor-crosshair"
        style={{ width, height }}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">
              Loading chart... {Math.round((loadedDataPoints / data.length) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && performanceMonitor && (
        <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-75 text-white px-2 py-1 rounded">
          {performanceMonitor.metrics.frameRate}fps
        </div>
      )}
    </div>
  );
};

export default OptimizedChartRenderer;