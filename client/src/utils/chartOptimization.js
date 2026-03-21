/**
 * Chart Performance Optimization Utilities
 * 
 * Provides utilities for optimizing chart rendering performance to achieve
 * smooth 60fps performance across all chart components including candlestick
 * charts, sparklines, and interactive price charts.
 */

import React from 'react';

// Frame rate management
export class FrameRateManager {
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
    this.lastFrameTime = 0;
    this.animationId = null;
    this.callbacks = new Set();
  }

  // Add callback to animation loop
  addCallback(callback) {
    this.callbacks.add(callback);
    if (this.callbacks.size === 1) {
      this.start();
    }
  }

  // Remove callback from animation loop
  removeCallback(callback) {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  // Start animation loop
  start() {
    const animate = (currentTime) => {
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        this.callbacks.forEach(callback => {
          try {
            callback(currentTime);
          } catch (error) {
            console.error('Animation callback error:', error);
          }
        });
        this.lastFrameTime = currentTime;
      }
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  // Stop animation loop
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Global frame rate manager instance
export const globalFrameManager = new FrameRateManager(60);

// Canvas optimization utilities
export class CanvasOptimizer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: options.alpha !== false,
      desynchronized: true, // Improves performance
      willReadFrequently: false
    });
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    
    this.setupCanvas();
  }

  setupCanvas() {
    // Set up high DPI support
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width * this.dpr;
    this.height = rect.height * this.dpr;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    
    this.ctx.scale(this.dpr, this.dpr);
    
    // Create offscreen canvas for double buffering
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d');
      this.offscreenCtx.scale(this.dpr, this.dpr);
    }
  }

  // Get optimized context (offscreen if available)
  getOptimizedContext() {
    return this.offscreenCtx || this.ctx;
  }

  // Commit offscreen canvas to main canvas
  commitFrame() {
    if (this.offscreenCanvas) {
      this.ctx.clearRect(0, 0, this.width / this.dpr, this.height / this.dpr);
      this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }
  }

  // Clear canvas efficiently
  clear() {
    const ctx = this.getOptimizedContext();
    ctx.clearRect(0, 0, this.width / this.dpr, this.height / this.dpr);
  }

  // Resize canvas
  resize(width, height) {
    this.width = width * this.dpr;
    this.height = height * this.dpr;
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    this.ctx.scale(this.dpr, this.dpr);
    
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      this.offscreenCtx.scale(this.dpr, this.dpr);
    }
  }
}

// Data processing optimization
export class DataProcessor {
  constructor() {
    this.cache = new Map();
    this.workers = [];
  }

  // Process data in chunks to avoid blocking main thread
  async processDataChunks(data, processor, chunkSize = 1000) {
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    const results = [];
    for (const chunk of chunks) {
      // Use setTimeout to yield control back to browser
      await new Promise(resolve => setTimeout(resolve, 0));
      results.push(...processor(chunk));
    }

    return results;
  }

  // Downsample data for performance
  downsampleData(data, maxPoints = 1000) {
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    const downsampled = [];
    
    for (let i = 0; i < data.length; i += step) {
      downsampled.push(data[i]);
    }
    
    return downsampled;
  }

  // Cache processed data
  cacheData(key, data, ttl = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cached data
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Chart animation utilities
export class ChartAnimator {
  constructor() {
    this.animations = new Map();
  }

  // Create smooth transition animation
  createTransition(from, to, duration = 300, easing = 'easeOutCubic') {
    return new Promise(resolve => {
      const startTime = performance.now();
      const easingFunctions = {
        linear: t => t,
        easeOutCubic: t => 1 - Math.pow(1 - t, 3),
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      };
      
      const easingFn = easingFunctions[easing] || easingFunctions.easeOutCubic;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        
        const current = from + (to - from) * easedProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(to);
        }
        
        return current;
      };
      
      requestAnimationFrame(animate);
    });
  }

  // Animate array of values
  animateValues(fromArray, toArray, duration = 300, callback) {
    const startTime = performance.now();
    const length = Math.max(fromArray.length, toArray.length);
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      const currentValues = [];
      for (let i = 0; i < length; i++) {
        const from = fromArray[i] || 0;
        const to = toArray[i] || 0;
        currentValues[i] = from + (to - from) * easedProgress;
      }
      
      callback(currentValues, progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  // Stagger animations for multiple elements
  staggerAnimation(elements, animationFn, staggerDelay = 50) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        animationFn(element, index);
      }, index * staggerDelay);
    });
  }
}

// Performance monitoring for charts
export class ChartPerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 0,
      renderTime: 0,
      dataProcessingTime: 0,
      memoryUsage: 0
    };
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.renderTimes = [];
  }

  // Start monitoring frame rate
  startFrameRateMonitoring() {
    const measureFrameRate = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastTime >= 1000) {
        this.metrics.frameRate = this.frameCount;
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Log warning if frame rate drops below 55fps
        if (this.metrics.frameRate < 55) {
          console.warn(`Chart performance warning: ${this.metrics.frameRate}fps (target: 60fps)`);
        }
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    requestAnimationFrame(measureFrameRate);
  }

  // Measure render time
  measureRenderTime(renderFn) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    this.renderTimes.push(renderTime);
    
    // Keep only last 100 measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
    
    this.metrics.renderTime = this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length;
    
    // Log warning if render time is too high
    if (renderTime > 16.67) { // 60fps = 16.67ms per frame
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms (target: <16.67ms)`);
    }
    
    return result;
  }

  // Get performance report
  getReport() {
    return {
      ...this.metrics,
      status: this.metrics.frameRate >= 55 ? 'good' : 'poor',
      recommendations: this.getRecommendations()
    };
  }

  // Get performance recommendations
  getRecommendations() {
    const recommendations = [];
    
    if (this.metrics.frameRate < 55) {
      recommendations.push('Consider reducing data points or using data downsampling');
    }
    
    if (this.metrics.renderTime > 16) {
      recommendations.push('Optimize rendering code or use canvas optimization techniques');
    }
    
    return recommendations;
  }
}

// Chart-specific optimization hooks
export const useChartOptimization = (canvasRef, options = {}) => {
  const [optimizer, setOptimizer] = React.useState(null);
  const [performanceMonitor] = React.useState(() => new ChartPerformanceMonitor());
  const dataProcessor = React.useRef(new DataProcessor());
  const animator = React.useRef(new ChartAnimator());

  React.useEffect(() => {
    if (canvasRef.current) {
      const canvasOptimizer = new CanvasOptimizer(canvasRef.current, options);
      setOptimizer(canvasOptimizer);
      
      // Start performance monitoring
      performanceMonitor.startFrameRateMonitoring();
      
      return () => {
        // Cleanup
        dataProcessor.current.clearExpiredCache();
      };
    }
  }, [canvasRef.current]);

  return {
    optimizer,
    performanceMonitor,
    dataProcessor: dataProcessor.current,
    animator: animator.current,
    frameManager: globalFrameManager
  };
};

// Sparkline optimization utilities
export const optimizeSparkline = {
  // Create optimized sparkline renderer
  createRenderer: (canvas, data, options = {}) => {
    const optimizer = new CanvasOptimizer(canvas);
    const ctx = optimizer.getOptimizedContext();
    
    const {
      color = '#3B82F6',
      strokeWidth = 2,
      showFill = true,
      animate = true
    } = options;

    const render = (animationProgress = 1) => {
      optimizer.clear();
      
      if (!data || data.length < 2) return;
      
      const width = canvas.width / optimizer.dpr;
      const height = canvas.height / optimizer.dpr;
      
      // Calculate bounds
      const minValue = Math.min(...data);
      const maxValue = Math.max(...data);
      const valueRange = maxValue - minValue || 1;
      
      // Create path
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const points = data.slice(0, Math.floor(data.length * animationProgress));
      
      points.forEach((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - minValue) / valueRange) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Add fill if enabled
      if (showFill && points.length > 1) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `${color}20`);
        gradient.addColorStop(1, `${color}05`);
        
        ctx.lineTo(points.length > 0 ? (points.length - 1) / (data.length - 1) * width : 0, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      optimizer.commitFrame();
    };

    return { render, optimizer };
  }
};

// Candlestick chart optimization
export const optimizeCandlestickChart = {
  // Efficient candlestick rendering
  renderCandlesticks: (ctx, data, viewport, options = {}) => {
    const {
      candleWidth = 8,
      wickWidth = 1,
      bullColor = '#10b981',
      bearColor = '#ef4444'
    } = options;

    // Only render visible candles
    const startIndex = Math.max(0, Math.floor(viewport.startX));
    const endIndex = Math.min(data.length, Math.ceil(viewport.endX));
    
    for (let i = startIndex; i < endIndex; i++) {
      const candle = data[i];
      if (!candle) continue;
      
      const x = viewport.getX(i);
      const openY = viewport.getY(candle.open);
      const highY = viewport.getY(candle.high);
      const lowY = viewport.getY(candle.low);
      const closeY = viewport.getY(candle.close);
      
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? bullColor : bearColor;
      
      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = wickWidth;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      
      // Draw body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      
      ctx.fillStyle = color;
      if (isGreen) {
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      }
    }
  }
};

// Export all utilities
export default {
  FrameRateManager,
  CanvasOptimizer,
  DataProcessor,
  ChartAnimator,
  ChartPerformanceMonitor,
  globalFrameManager,
  useChartOptimization,
  optimizeSparkline,
  optimizeCandlestickChart
};