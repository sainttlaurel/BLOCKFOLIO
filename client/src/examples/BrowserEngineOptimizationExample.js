/**
 * Browser Engine Optimization Example
 * 
 * Demonstrates how to use browser engine-specific optimizations
 * and adaptive performance features in the trading platform.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAdaptivePerformance, useFPSMonitor, useMemoryMonitor } from '../hooks/useAdaptivePerformance';
import PerformanceMonitor from '../components/PerformanceMonitor';
import {
  detectBrowserEngine,
  BrowserEngine,
  applyEngineOptimizations
} from '../utils/browserEngineOptimization';

/**
 * Example 1: Basic Adaptive Performance Usage
 */
export const BasicAdaptivePerformanceExample = () => {
  const {
    settings,
    capabilities,
    engine,
    isInitialized,
    getCSSVariables,
    shouldEnableFeature
  } = useAdaptivePerformance();

  if (!isInitialized) {
    return <div className="p-4">Initializing performance optimizations...</div>;
  }

  return (
    <div className="p-6 space-y-4" style={getCSSVariables()}>
      <h2 className="text-2xl font-bold">Adaptive Performance Example</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Device Info</h3>
          <p>Engine: {engine}</p>
          <p>Tier: {capabilities?.tier}</p>
          <p>CPU: {capabilities?.cpu.cores} cores</p>
          <p>Memory: {capabilities?.memory.size} GB</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Current Settings</h3>
          <p>Quality: {settings?.quality}</p>
          <p>Animation: {settings?.animations.duration}ms</p>
          <p>Blur: {settings?.effects.backdropBlur}px</p>
          <p>Chart Points: {settings?.charts.maxDataPoints}</p>
        </div>
      </div>

      {/* Conditional rendering based on features */}
      {shouldEnableFeature('backdrop-blur') && (
        <div className="glass-card p-4">
          <p>This glass card is only shown if backdrop-blur is enabled</p>
        </div>
      )}

      {shouldEnableFeature('animations') && (
        <div className="animate-fade-in">
          <p>This animation is only shown if animations are enabled</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Chart with Adaptive Data Downsampling
 */
export const AdaptiveChartExample = () => {
  const { getChartSettings, downsampleData, isInitialized } = useAdaptivePerformance();
  const [data] = useState(() => {
    // Generate large dataset
    return Array.from({ length: 5000 }, (_, i) => ({
      x: i,
      y: Math.sin(i / 100) * 100 + Math.random() * 20
    }));
  });

  if (!isInitialized) return <div>Loading...</div>;

  const chartSettings = getChartSettings();
  const optimizedData = downsampleData(data);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Adaptive Chart Example</h2>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p>Original data points: {data.length}</p>
        <p>Optimized data points: {optimizedData.length}</p>
        <p>Max allowed: {chartSettings.maxDataPoints}</p>
        <p>Antialiasing: {chartSettings.antialiasing ? 'On' : 'Off'}</p>
        <p>Animations: {chartSettings.animations ? 'On' : 'Off'}</p>
      </div>

      <div className="border border-gray-300 rounded p-4">
        <svg width="100%" height="200" viewBox="0 0 1000 200">
          <polyline
            points={optimizedData.map((point, i) => 
              `${(i / optimizedData.length) * 1000},${100 - point.y}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * Example 3: FPS and Memory Monitoring
 */
export const PerformanceMonitoringExample = () => {
  const fps = useFPSMonitor();
  const memory = useMemoryMonitor(1000);
  const [stressTest, setStressTest] = useState(false);

  // Stress test: Create many elements
  useEffect(() => {
    if (!stressTest) return;

    const interval = setInterval(() => {
      // Simulate heavy work
      const arr = new Array(100000).fill(0).map((_, i) => i * Math.random());
      arr.sort();
    }, 100);

    return () => clearInterval(interval);
  }, [stressTest]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Performance Monitoring Example</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold mb-2">FPS</h3>
          <p className="text-3xl font-bold">{fps}</p>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${fps >= 55 ? 'bg-green-500' : fps >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        {memory && (
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Memory</h3>
            <p className="text-3xl font-bold">{memory.used} MB</p>
            <p className="text-sm text-gray-600">{memory.percentage}% used</p>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${memory.percentage < 60 ? 'bg-blue-500' : memory.percentage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${memory.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setStressTest(!stressTest)}
        className={`px-4 py-2 rounded ${stressTest ? 'bg-red-500' : 'bg-blue-500'} text-white`}
      >
        {stressTest ? 'Stop Stress Test' : 'Start Stress Test'}
      </button>

      {stressTest && (
        <p className="mt-2 text-sm text-gray-600">
          Running stress test... Watch FPS and memory usage
        </p>
      )}
    </div>
  );
};

/**
 * Example 4: Engine-Specific Optimizations
 */
export const EngineSpecificExample = () => {
  const [engine, setEngine] = useState('unknown');
  const [optimizations, setOptimizations] = useState(null);
  const elementRef = useRef(null);

  useEffect(() => {
    const detectedEngine = detectBrowserEngine();
    setEngine(detectedEngine);

    const engineOpts = applyEngineOptimizations();
    setOptimizations(engineOpts);

    // Apply optimizations to element
    if (elementRef.current) {
      if (detectedEngine === BrowserEngine.CHROMIUM) {
        engineOpts.enableGPUAcceleration?.(elementRef.current);
      } else if (detectedEngine === BrowserEngine.WEBKIT) {
        engineOpts.enableIOSOptimizations?.(elementRef.current);
        engineOpts.optimizeBackdropFilter?.(elementRef.current);
      } else if (detectedEngine === BrowserEngine.GECKO) {
        engineOpts.enableSmoothScrolling?.(elementRef.current);
      }
    }
  }, []);

  const getEngineIcon = () => {
    switch (engine) {
      case BrowserEngine.CHROMIUM: return '🔷';
      case BrowserEngine.GECKO: return '🦊';
      case BrowserEngine.WEBKIT: return '🧭';
      default: return '🌐';
    }
  };

  const getEngineName = () => {
    switch (engine) {
      case BrowserEngine.CHROMIUM: return 'Chromium (V8 + Blink)';
      case BrowserEngine.GECKO: return 'Gecko (SpiderMonkey)';
      case BrowserEngine.WEBKIT: return 'WebKit (JavaScriptCore)';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Engine-Specific Optimizations</h2>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{getEngineIcon()}</span>
          <div>
            <h3 className="font-semibold">{getEngineName()}</h3>
            <p className="text-sm text-gray-600">Detected browser engine</p>
          </div>
        </div>
      </div>

      <div 
        ref={elementRef}
        className="glass-card p-4 mb-4"
        style={{ backdropFilter: 'blur(12px)' }}
      >
        <h3 className="font-semibold mb-2">Optimized Element</h3>
        <p className="text-sm text-gray-600">
          This element has engine-specific optimizations applied
        </p>
      </div>

      {engine === BrowserEngine.CHROMIUM && (
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Chromium Optimizations Applied:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>GPU acceleration enabled (translateZ)</li>
            <li>will-change hints added</li>
            <li>Aggressive caching enabled</li>
            <li>V8 hot path optimization</li>
          </ul>
        </div>
      )}

      {engine === BrowserEngine.GECKO && (
        <div className="bg-orange-50 p-4 rounded">
          <h4 className="font-semibold mb-2">Gecko Optimizations Applied:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Smooth scrolling enabled</li>
            <li>Flexbox preferred for layouts</li>
            <li>Native scrollbar styling</li>
            <li>Optimized will-change usage</li>
          </ul>
        </div>
      )}

      {engine === BrowserEngine.WEBKIT && (
        <div className="bg-purple-50 p-4 rounded">
          <h4 className="font-semibold mb-2">WebKit Optimizations Applied:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Backdrop-filter blur reduced to 8px</li>
            <li>iOS momentum scrolling enabled</li>
            <li>Tap highlight removed</li>
            <li>Hardware acceleration hints</li>
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Example 5: Complete Integration with Performance Monitor
 */
export const CompleteIntegrationExample = () => {
  const [showMonitor, setShowMonitor] = useState(true);
  const { settings, isInitialized } = useAdaptivePerformance();

  if (!isInitialized) {
    return <div className="p-4">Initializing...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Browser Engine Optimization Demo</h1>
          <button
            onClick={() => setShowMonitor(!showMonitor)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showMonitor ? 'Hide' : 'Show'} Performance Monitor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">Adaptive Performance</h2>
            <BasicAdaptivePerformanceExample />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">Performance Monitoring</h2>
            <PerformanceMonitoringExample />
          </div>

          <div className="glass-card p-6 md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Adaptive Chart</h2>
            <AdaptiveChartExample />
          </div>

          <div className="glass-card p-6 md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Engine-Specific Optimizations</h2>
            <EngineSpecificExample />
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Current Settings</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      </div>

      {showMonitor && <PerformanceMonitor position="bottom-right" />}
    </div>
  );
};

export default CompleteIntegrationExample;
