/**
 * React Hook for Data Synchronization
 * 
 * Provides efficient data synchronization hooks that prevent interface lag
 * by using intelligent update strategies, visibility tracking, and performance
 * optimization techniques.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dataSynchronizer from '../services/dataSynchronizer';

/**
 * Main data synchronization hook
 */
export const useDataSync = (componentId, options = {}) => {
  const {
    strategy = 'batched',
    priority = 3, // medium priority
    debounceDelay = 100,
    throttleDelay = 16,
    maxUpdatesPerSecond = 60,
    enableVisibilityTracking = true
  } = options;

  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const elementRef = useRef();
  const mountedRef = useRef(true);

  // Update handler
  const handleUpdate = useCallback((newData) => {
    if (mountedRef.current) {
      setData(newData);
      setLastUpdate(Date.now());
    }
  }, []);

  // Register component with synchronizer
  useEffect(() => {
    dataSynchronizer.registerUpdateHandler(componentId, handleUpdate, {
      strategy,
      priority,
      debounceDelay,
      throttleDelay,
      maxUpdatesPerSecond
    });

    return () => {
      dataSynchronizer.unregisterUpdateHandler(componentId);
    };
  }, [componentId, handleUpdate, strategy, priority, debounceDelay, throttleDelay, maxUpdatesPerSecond]);

  // Register for visibility tracking
  useEffect(() => {
    if (enableVisibilityTracking && elementRef.current) {
      dataSynchronizer.registerComponent(componentId, elementRef.current);
      
      return () => {
        if (elementRef.current) {
          dataSynchronizer.unregisterComponent(componentId, elementRef.current);
        }
      };
    }
  }, [componentId, enableVisibilityTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update data function
  const updateData = useCallback((newData, updateOptions = {}) => {
    dataSynchronizer.queueUpdate(componentId, newData, {
      priority,
      strategy,
      ...updateOptions
    });
  }, [componentId, priority, strategy]);

  // Force immediate update
  const forceUpdate = useCallback((newData) => {
    dataSynchronizer.queueUpdate(componentId, newData, {
      priority: 1, // critical priority
      strategy: 'immediate',
      force: true
    });
  }, [componentId]);

  return {
    data,
    lastUpdate,
    isVisible,
    elementRef,
    updateData,
    forceUpdate
  };
};

/**
 * Hook for high-frequency price updates with lag prevention
 */
export const usePriceSync = (symbol, options = {}) => {
  const {
    enableSmoothing = true,
    smoothingFactor = 0.3,
    maxUpdateRate = 10, // updates per second
    ...syncOptions
  } = options;

  const componentId = `price-${symbol}`;
  const [smoothedPrice, setSmoothedPrice] = useState(null);
  const lastRawPrice = useRef(null);
  const smoothingTimer = useRef(null);

  const { data: rawPrice, updateData, elementRef } = useDataSync(componentId, {
    strategy: 'throttled',
    priority: 2, // high priority for prices
    throttleDelay: 1000 / maxUpdateRate,
    ...syncOptions
  });

  // Apply price smoothing to prevent jarring updates
  useEffect(() => {
    if (rawPrice && enableSmoothing) {
      if (lastRawPrice.current === null) {
        setSmoothedPrice(rawPrice);
        lastRawPrice.current = rawPrice;
      } else {
        // Clear existing timer
        if (smoothingTimer.current) {
          clearTimeout(smoothingTimer.current);
        }

        // Smooth price transition
        const priceDiff = rawPrice - lastRawPrice.current;
        const steps = 5;
        const stepSize = priceDiff / steps;
        let currentStep = 0;

        const smoothStep = () => {
          if (currentStep < steps) {
            const newPrice = lastRawPrice.current + (stepSize * (currentStep + 1));
            setSmoothedPrice(newPrice);
            currentStep++;
            smoothingTimer.current = setTimeout(smoothStep, 16); // ~60fps
          } else {
            setSmoothedPrice(rawPrice);
            lastRawPrice.current = rawPrice;
          }
        };

        smoothStep();
      }
    } else {
      setSmoothedPrice(rawPrice);
      lastRawPrice.current = rawPrice;
    }
  }, [rawPrice, enableSmoothing, smoothingFactor]);

  // Cleanup smoothing timer
  useEffect(() => {
    return () => {
      if (smoothingTimer.current) {
        clearTimeout(smoothingTimer.current);
      }
    };
  }, []);

  return {
    price: enableSmoothing ? smoothedPrice : rawPrice,
    rawPrice,
    updatePrice: updateData,
    elementRef
  };
};

/**
 * Hook for table data synchronization with virtual scrolling support
 */
export const useTableSync = (tableId, options = {}) => {
  const {
    pageSize = 50,
    enableVirtualScrolling = true,
    sortField = null,
    sortDirection = 'asc',
    ...syncOptions
  } = options;

  const [tableData, setTableData] = useState([]);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: pageSize });
  const [sortedData, setSortedData] = useState([]);

  const { data: rawData, updateData, elementRef } = useDataSync(`table-${tableId}`, {
    strategy: 'batched',
    priority: 3, // medium priority
    ...syncOptions
  });

  // Sort data when raw data or sort parameters change
  useEffect(() => {
    if (rawData && Array.isArray(rawData)) {
      let sorted = [...rawData];
      
      if (sortField) {
        sorted.sort((a, b) => {
          const aVal = a[sortField];
          const bVal = b[sortField];
          
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
          } else {
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            if (sortDirection === 'asc') {
              return aStr.localeCompare(bStr);
            } else {
              return bStr.localeCompare(aStr);
            }
          }
        });
      }
      
      setSortedData(sorted);
    }
  }, [rawData, sortField, sortDirection]);

  // Update visible data based on range
  useEffect(() => {
    if (enableVirtualScrolling && sortedData.length > 0) {
      const visible = sortedData.slice(visibleRange.start, visibleRange.end);
      setTableData(visible);
    } else {
      setTableData(sortedData);
    }
  }, [sortedData, visibleRange, enableVirtualScrolling]);

  // Update visible range for virtual scrolling
  const updateVisibleRange = useCallback((start, end) => {
    setVisibleRange({ start, end });
  }, []);

  // Update table data
  const updateTableData = useCallback((newData, options = {}) => {
    updateData(newData, options);
  }, [updateData]);

  return {
    tableData,
    totalRows: sortedData.length,
    visibleRange,
    updateTableData,
    updateVisibleRange,
    elementRef
  };
};

/**
 * Hook for chart data synchronization with frame rate optimization
 */
export const useChartSync = (chartId, options = {}) => {
  const {
    maxDataPoints = 1000,
    enableDownsampling = true,
    targetFPS = 60,
    ...syncOptions
  } = options;

  const [chartData, setChartData] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrame = useRef(null);
  const pendingData = useRef(null);

  const { data: rawData, updateData, elementRef } = useDataSync(`chart-${chartId}`, {
    strategy: 'throttled',
    priority: 3, // medium priority
    throttleDelay: 1000 / targetFPS,
    ...syncOptions
  });

  // Process chart data with downsampling if needed
  const processChartData = useCallback((data) => {
    if (!data || !Array.isArray(data)) return data;
    
    if (enableDownsampling && data.length > maxDataPoints) {
      const step = Math.ceil(data.length / maxDataPoints);
      return data.filter((_, index) => index % step === 0);
    }
    
    return data;
  }, [enableDownsampling, maxDataPoints]);

  // Animate chart data updates
  const animateDataUpdate = useCallback((newData) => {
    if (isAnimating) {
      pendingData.current = newData;
      return;
    }

    setIsAnimating(true);
    
    const animate = () => {
      setChartData(processChartData(newData));
      setIsAnimating(false);
      
      // Process pending data if available
      if (pendingData.current) {
        const pending = pendingData.current;
        pendingData.current = null;
        setTimeout(() => animateDataUpdate(pending), 16);
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
  }, [isAnimating, processChartData]);

  // Update chart data when raw data changes
  useEffect(() => {
    if (rawData) {
      animateDataUpdate(rawData);
    }
  }, [rawData, animateDataUpdate]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  // Update chart data function
  const updateChartData = useCallback((newData, options = {}) => {
    updateData(newData, options);
  }, [updateData]);

  return {
    chartData,
    isAnimating,
    updateChartData,
    elementRef
  };
};

/**
 * Hook for monitoring synchronization performance
 */
export const useSyncMetrics = () => {
  const [metrics, setMetrics] = useState(dataSynchronizer.getMetrics());
  const [alerts, setAlerts] = useState([]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics = dataSynchronizer.getMetrics();
      setMetrics(newMetrics);
      
      // Generate performance alerts
      const newAlerts = [];
      
      if (newMetrics.currentFPS < 50) {
        newAlerts.push({
          type: 'warning',
          message: `Low frame rate: ${newMetrics.currentFPS}fps`,
          timestamp: Date.now()
        });
      }
      
      if (newMetrics.queueSize > 100) {
        newAlerts.push({
          type: 'warning',
          message: `High queue size: ${newMetrics.queueSize} pending updates`,
          timestamp: Date.now()
        });
      }
      
      if (newMetrics.averageProcessingTime > 16) {
        newAlerts.push({
          type: 'error',
          message: `Slow processing: ${newMetrics.averageProcessingTime.toFixed(2)}ms average`,
          timestamp: Date.now()
        });
      }
      
      setAlerts(newAlerts);
    };

    const interval = setInterval(updateMetrics, 1000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, []);

  // Control functions
  const flush = useCallback(() => {
    dataSynchronizer.flush();
  }, []);

  const pause = useCallback(() => {
    dataSynchronizer.pause();
  }, []);

  const resume = useCallback(() => {
    dataSynchronizer.resume();
  }, []);

  const clear = useCallback(() => {
    dataSynchronizer.clear();
  }, []);

  const optimizeMemory = useCallback(() => {
    dataSynchronizer.optimizeMemory();
  }, []);

  return {
    metrics,
    alerts,
    flush,
    pause,
    resume,
    clear,
    optimizeMemory
  };
};

export default {
  useDataSync,
  usePriceSync,
  useTableSync,
  useChartSync,
  useSyncMetrics
};