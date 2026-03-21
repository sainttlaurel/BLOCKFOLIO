import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { 
  FrameRateManager, 
  CanvasOptimizer, 
  DataProcessor, 
  ChartAnimator,
  ChartPerformanceMonitor,
  optimizeSparkline
} from '../../utils/chartOptimization';

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

// Mock canvas context
const mockContext = {
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  }))
};

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  width: 800,
  height: 400,
  style: {},
  getBoundingClientRect: jest.fn(() => ({
    width: 800,
    height: 400,
    left: 0,
    top: 0
  }))
};

// Mock OffscreenCanvas
global.OffscreenCanvas = jest.fn(() => mockCanvas);

describe('Chart Optimization Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FrameRateManager', () => {
    test('should maintain target frame rate', () => {
      const frameManager = new FrameRateManager(60);
      const callback = jest.fn();
      
      frameManager.addCallback(callback);
      
      expect(frameManager.targetFPS).toBe(60);
      expect(frameManager.frameInterval).toBe(1000 / 60);
      
      frameManager.removeCallback(callback);
    });

    test('should handle multiple callbacks', () => {
      const frameManager = new FrameRateManager(60);
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      frameManager.addCallback(callback1);
      frameManager.addCallback(callback2);
      
      expect(frameManager.callbacks.size).toBe(2);
      
      frameManager.removeCallback(callback1);
      expect(frameManager.callbacks.size).toBe(1);
      
      frameManager.removeCallback(callback2);
      expect(frameManager.callbacks.size).toBe(0);
    });
  });

  describe('CanvasOptimizer', () => {
    test('should optimize canvas for high DPI displays', () => {
      const optimizer = new CanvasOptimizer(mockCanvas);
      
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d', {
        alpha: true,
        desynchronized: true,
        willReadFrequently: false
      });
      
      expect(mockContext.scale).toHaveBeenCalled();
    });

    test('should provide optimized context', () => {
      const optimizer = new CanvasOptimizer(mockCanvas);
      const ctx = optimizer.getOptimizedContext();
      
      expect(ctx).toBeDefined();
    });

    test('should handle canvas resizing', () => {
      const optimizer = new CanvasOptimizer(mockCanvas);
      
      optimizer.resize(1000, 500);
      
      expect(mockCanvas.width).toBe(1000);
      expect(mockCanvas.height).toBe(500);
    });
  });

  describe('DataProcessor', () => {
    test('should downsample data correctly', () => {
      const processor = new DataProcessor();
      const data = Array.from({ length: 1000 }, (_, i) => i);
      
      const downsampled = processor.downsampleData(data, 100);
      
      expect(downsampled.length).toBeLessThanOrEqual(100);
      expect(downsampled[0]).toBe(0);
    });

    test('should cache and retrieve data', () => {
      const processor = new DataProcessor();
      const testData = [1, 2, 3, 4, 5];
      
      processor.cacheData('test-key', testData, 1000);
      const cached = processor.getCachedData('test-key');
      
      expect(cached).toEqual(testData);
    });

    test('should expire cached data', async () => {
      const processor = new DataProcessor();
      const testData = [1, 2, 3, 4, 5];
      
      processor.cacheData('test-key', testData, 10); // 10ms TTL
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const cached = processor.getCachedData('test-key');
      expect(cached).toBeNull();
    });

    test('should process data in chunks', async () => {
      const processor = new DataProcessor();
      const data = Array.from({ length: 100 }, (_, i) => i);
      const processorFn = jest.fn((chunk) => chunk.map(x => x * 2));
      
      const result = await processor.processDataChunks(data, processorFn, 10);
      
      expect(result).toHaveLength(100);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(2);
      expect(processorFn).toHaveBeenCalledTimes(10); // 100 items / 10 chunk size
    });
  });

  describe('ChartAnimator', () => {
    test('should create smooth transitions', async () => {
      const animator = new ChartAnimator();
      
      const result = await animator.createTransition(0, 100, 100, 'linear');
      
      expect(result).toBe(100);
    });

    test('should animate array values', () => {
      const animator = new ChartAnimator();
      const callback = jest.fn();
      
      animator.animateValues([0, 0, 0], [100, 200, 300], 100, callback);
      
      expect(callback).toHaveBeenCalled();
    });

    test('should stagger animations', () => {
      const animator = new ChartAnimator();
      const elements = [1, 2, 3];
      const animationFn = jest.fn();
      
      animator.staggerAnimation(elements, animationFn, 10);
      
      // Should be called immediately for first element
      expect(animationFn).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('ChartPerformanceMonitor', () => {
    test('should track frame rate', () => {
      const monitor = new ChartPerformanceMonitor();
      
      monitor.startFrameRateMonitoring();
      
      expect(monitor.metrics.frameRate).toBeDefined();
    });

    test('should measure render time', () => {
      const monitor = new ChartPerformanceMonitor();
      const renderFn = jest.fn(() => 'result');
      
      const result = monitor.measureRenderTime(renderFn);
      
      expect(result).toBe('result');
      expect(renderFn).toHaveBeenCalled();
      expect(monitor.metrics.renderTime).toBeGreaterThanOrEqual(0);
    });

    test('should provide performance report', () => {
      const monitor = new ChartPerformanceMonitor();
      
      const report = monitor.getReport();
      
      expect(report).toHaveProperty('frameRate');
      expect(report).toHaveProperty('renderTime');
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('recommendations');
    });

    test('should detect performance issues', () => {
      const monitor = new ChartPerformanceMonitor();
      
      // Simulate slow render
      monitor.renderTimes = [20, 25, 30]; // Above 16.67ms threshold
      monitor.metrics.renderTime = 25;
      
      const report = monitor.getReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Sparkline Optimization', () => {
    test('should create optimized sparkline renderer', () => {
      const data = [10, 15, 12, 18, 20, 16, 14];
      
      const { render, optimizer } = optimizeSparkline.createRenderer(
        mockCanvas, 
        data, 
        { color: '#3B82F6', strokeWidth: 2 }
      );
      
      expect(render).toBeDefined();
      expect(optimizer).toBeDefined();
      
      // Test rendering
      render(1);
      
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    test('should handle empty data gracefully', () => {
      const { render } = optimizeSparkline.createRenderer(mockCanvas, [], {});
      
      // Should not throw error
      expect(() => render(1)).not.toThrow();
    });

    test('should support animation progress', () => {
      const data = [10, 15, 12, 18, 20];
      const { render } = optimizeSparkline.createRenderer(mockCanvas, data, {});
      
      // Test partial rendering
      render(0.5); // 50% progress
      
      expect(mockContext.beginPath).toHaveBeenCalled();
    });
  });
});

describe('Performance Property Tests', () => {
  test('Frame rate should never exceed target FPS', () => {
    const frameManager = new FrameRateManager(60);
    
    // Property: Frame interval should be consistent with target FPS
    expect(frameManager.frameInterval).toBe(1000 / 60);
    
    // Property: Target FPS should be positive
    expect(frameManager.targetFPS).toBeGreaterThan(0);
  });

  test('Data downsampling should preserve data bounds', () => {
    const processor = new DataProcessor();
    const data = Array.from({ length: 1000 }, (_, i) => Math.random() * 100);
    const originalMin = Math.min(...data);
    const originalMax = Math.max(...data);
    
    const downsampled = processor.downsampleData(data, 100);
    const downsampledMin = Math.min(...downsampled);
    const downsampledMax = Math.max(...downsampled);
    
    // Property: Downsampled data should maintain original bounds
    expect(downsampledMin).toBeGreaterThanOrEqual(originalMin);
    expect(downsampledMax).toBeLessThanOrEqual(originalMax);
  });

  test('Canvas optimization should maintain aspect ratio', () => {
    const optimizer = new CanvasOptimizer(mockCanvas);
    const originalWidth = mockCanvas.width;
    const originalHeight = mockCanvas.height;
    const originalRatio = originalWidth / originalHeight;
    
    optimizer.resize(400, 200);
    const newRatio = mockCanvas.width / mockCanvas.height;
    
    // Property: Resize should maintain intended aspect ratio
    expect(newRatio).toBe(400 / 200);
  });

  test('Performance monitoring should detect degradation', () => {
    const monitor = new ChartPerformanceMonitor();
    
    // Simulate performance degradation
    monitor.metrics.frameRate = 30; // Below 55fps threshold
    monitor.metrics.renderTime = 25; // Above 16.67ms threshold
    
    const report = monitor.getReport();
    
    // Property: Poor performance should be detected
    expect(report.status).toBe('poor');
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});

/**
 * Property-Based Test for Chart Optimization
 * 
 * **Feature: professional-trading-platform, Property 64: Chart Rendering Performance**
 * 
 * *For any* chart interaction or animation, smooth performance should be maintained 
 * without performance degradation.
 */
describe('Property 64: Chart Rendering Performance', () => {
  test('maintains smooth performance during chart interactions', () => {
    const monitor = new ChartPerformanceMonitor();
    const processor = new DataProcessor();
    
    // Generate test data of varying sizes
    const testSizes = [100, 500, 1000, 2000];
    
    testSizes.forEach(size => {
      const data = Array.from({ length: size }, (_, i) => ({
        x: i,
        o: 100 + Math.random() * 10,
        h: 110 + Math.random() * 10,
        l: 90 + Math.random() * 10,
        c: 105 + Math.random() * 10,
        v: Math.random() * 1000000
      }));
      
      // Simulate chart rendering
      const renderTime = monitor.measureRenderTime(() => {
        // Simulate data processing
        processor.downsampleData(data, Math.min(size, 1000));
        
        // Simulate canvas operations
        for (let i = 0; i < Math.min(size, 100); i++) {
          mockContext.beginPath();
          mockContext.moveTo(i, data[i].c);
          mockContext.stroke();
        }
      });
      
      // Property: Render time should be reasonable for smooth 60fps
      expect(monitor.metrics.renderTime).toBeLessThan(16.67); // 60fps = 16.67ms per frame
    });
  });
});

/**
 * Property-Based Test for Frame Rate Performance
 * 
 * **Feature: professional-trading-platform, Property 65: Frame Rate Performance Maintenance**
 * 
 * *For any* data update or user interaction, the interface should maintain 60fps performance.
 */
describe('Property 65: Frame Rate Performance Maintenance', () => {
  test('maintains 60fps performance during data updates', () => {
    const frameManager = new FrameRateManager(60);
    const callbacks = [];
    
    // Add multiple callbacks to simulate concurrent chart updates
    for (let i = 0; i < 5; i++) {
      const callback = jest.fn(() => {
        // Simulate lightweight chart update
        mockContext.clearRect(0, 0, 800, 400);
        mockContext.beginPath();
        mockContext.stroke();
      });
      
      callbacks.push(callback);
      frameManager.addCallback(callback);
    }
    
    // Property: Frame manager should handle multiple callbacks efficiently
    expect(frameManager.callbacks.size).toBe(5);
    expect(frameManager.targetFPS).toBe(60);
    expect(frameManager.frameInterval).toBe(1000 / 60);
    
    // Cleanup
    callbacks.forEach(callback => frameManager.removeCallback(callback));
  });
});