/**
 * Performance Monitor Component
 * 
 * Real-time performance monitoring dashboard showing:
 * - FPS counter
 * - Memory usage
 * - Core Web Vitals
 * - Long tasks
 * - Device capabilities
 * - Adaptive quality settings
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  FPSCounter,
  MemoryTracker,
  LongTaskDetector,
  CoreWebVitalsTracker,
  DeviceCapabilityDetector,
  AdaptivePerformanceManager,
  detectBrowserEngine,
  BrowserEngine
} from '../utils/browserEngineOptimization';

const PerformanceMonitor = ({ position = 'bottom-right', minimized: initialMinimized = false }) => {
  const [fps, setFps] = useState(0);
  const [avgFps, setAvgFps] = useState(0);
  const [memory, setMemory] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [longTasks, setLongTasks] = useState([]);
  const [capabilities, setCapabilities] = useState(null);
  const [settings, setSettings] = useState(null);
  const [minimized, setMinimized] = useState(initialMinimized);
  const [engine, setEngine] = useState('unknown');
  
  const fpsCounterRef = useRef(null);
  const memoryTrackerRef = useRef(null);
  const longTaskDetectorRef = useRef(null);
  const vitalsTrackerRef = useRef(null);
  const performanceManagerRef = useRef(null);

  useEffect(() => {
    // Detect browser engine
    setEngine(detectBrowserEngine());

    // Initialize FPS counter
    fpsCounterRef.current = new FPSCounter();
    fpsCounterRef.current.subscribe((newFps) => {
      setFps(newFps);
      setAvgFps(fpsCounterRef.current.getAverageFPS());
    });
    fpsCounterRef.current.start();

    // Initialize memory tracker
    memoryTrackerRef.current = new MemoryTracker();
    memoryTrackerRef.current.start(1000);
    
    const memoryInterval = setInterval(() => {
      const usage = memoryTrackerRef.current.getMemoryUsage();
      setMemory(usage);
    }, 1000);

    // Initialize long task detector
    longTaskDetectorRef.current = new LongTaskDetector();
    longTaskDetectorRef.current.subscribe((task) => {
      setLongTasks(prev => [...prev.slice(-9), task]);
    });
    longTaskDetectorRef.current.start();

    // Initialize Core Web Vitals tracker
    vitalsTrackerRef.current = new CoreWebVitalsTracker();
    vitalsTrackerRef.current.subscribe((metric, value) => {
      setVitals(prev => ({ ...prev, [metric]: value }));
    });
    vitalsTrackerRef.current.start();

    // Initialize adaptive performance manager
    performanceManagerRef.current = new AdaptivePerformanceManager();
    performanceManagerRef.current.initialize().then((initialSettings) => {
      setSettings(initialSettings);
      setCapabilities(performanceManagerRef.current.deviceCapabilities);
    });

    performanceManagerRef.current.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    // Cleanup
    return () => {
      fpsCounterRef.current?.stop();
      memoryTrackerRef.current?.stop();
      longTaskDetectorRef.current?.stop();
      vitalsTrackerRef.current?.stop();
      performanceManagerRef.current?.cleanup();
      clearInterval(memoryInterval);
    };
  }, []);

  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };
    return positions[position] || positions['bottom-right'];
  };

  const getFPSColor = (fps) => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryColor = (percentage) => {
    if (!percentage) return 'text-gray-600';
    if (percentage < 60) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVitalRating = (metric, value) => {
    if (!vitalsTrackerRef.current) return 'unknown';
    
    const ratings = vitalsTrackerRef.current.getRatings();
    return ratings[metric] || 'unknown';
  };

  const getRatingColor = (rating) => {
    if (rating === 'good') return 'text-green-600';
    if (rating === 'needs-improvement') return 'text-yellow-600';
    if (rating === 'poor') return 'text-red-600';
    return 'text-gray-600';
  };

  const getEngineIcon = () => {
    switch (engine) {
      case BrowserEngine.CHROMIUM:
        return '🔷';
      case BrowserEngine.GECKO:
        return '🦊';
      case BrowserEngine.WEBKIT:
        return '🧭';
      default:
        return '🌐';
    }
  };

  const getEngineName = () => {
    switch (engine) {
      case BrowserEngine.CHROMIUM:
        return 'Chromium (V8)';
      case BrowserEngine.GECKO:
        return 'Gecko (SpiderMonkey)';
      case BrowserEngine.WEBKIT:
        return 'WebKit (JavaScriptCore)';
      default:
        return 'Unknown';
    }
  };

  if (minimized) {
    return (
      <div 
        className={`fixed ${getPositionClasses()} z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-3 cursor-pointer hover:bg-white/95 transition-all`}
        onClick={() => setMinimized(false)}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getEngineIcon()}</span>
          <div className="text-sm">
            <div className={`font-bold ${getFPSColor(fps)}`}>{fps} FPS</div>
            {memory && (
              <div className={`text-xs ${getMemoryColor(memory.percentage)}`}>
                {memory.used}MB
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed ${getPositionClasses()} z-50 bg-white/95 backdrop-blur-md rounded-lg shadow-xl p-4 max-w-md max-h-[80vh] overflow-y-auto`}
      style={{ minWidth: '320px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getEngineIcon()}</span>
          <div>
            <h3 className="font-bold text-gray-900">Performance Monitor</h3>
            <p className="text-xs text-gray-600">{getEngineName()}</p>
          </div>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="text-gray-500 hover:text-gray-700 text-xl"
          aria-label="Minimize"
        >
          −
        </button>
      </div>

      {/* FPS Counter */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Frame Rate</h4>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getFPSColor(fps)}`}>{fps}</span>
          <span className="text-gray-600">FPS</span>
          <span className="text-sm text-gray-500 ml-auto">
            Avg: {avgFps} FPS
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${fps >= 55 ? 'bg-green-500' : fps >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min((fps / 60) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Memory Usage */}
      {memory && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Memory Usage</h4>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getMemoryColor(memory.percentage)}`}>
              {memory.used}
            </span>
            <span className="text-gray-600">MB</span>
            <span className="text-sm text-gray-500 ml-auto">
              / {memory.limit} MB ({memory.percentage}%)
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${memory.percentage < 60 ? 'bg-green-500' : memory.percentage < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${memory.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Core Web Vitals */}
      {vitals && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {vitals.lcp !== null && (
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">LCP</div>
                <div className={`font-bold ${getRatingColor(getVitalRating('lcp', vitals.lcp))}`}>
                  {vitals.lcp.toFixed(0)}ms
                </div>
              </div>
            )}
            {vitals.fid !== null && (
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">FID</div>
                <div className={`font-bold ${getRatingColor(getVitalRating('fid', vitals.fid))}`}>
                  {vitals.fid.toFixed(0)}ms
                </div>
              </div>
            )}
            {vitals.cls !== null && (
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">CLS</div>
                <div className={`font-bold ${getRatingColor(getVitalRating('cls', vitals.cls))}`}>
                  {vitals.cls.toFixed(3)}
                </div>
              </div>
            )}
            {vitals.fcp !== null && (
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">FCP</div>
                <div className={`font-bold ${getRatingColor(getVitalRating('fcp', vitals.fcp))}`}>
                  {vitals.fcp.toFixed(0)}ms
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Long Tasks */}
      {longTasks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Long Tasks ({longTasks.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {longTasks.slice(-5).reverse().map((task, index) => (
              <div key={index} className="text-xs bg-red-50 rounded p-2">
                <div className="font-semibold text-red-700">
                  {task.duration.toFixed(0)}ms
                </div>
                <div className="text-red-600">{task.name || 'Unknown task'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Device Capabilities */}
      {capabilities && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Device Capabilities</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-600">CPU</div>
              <div className="font-semibold">{capabilities.cpu.cores} cores</div>
              <div className="text-gray-500 capitalize">{capabilities.cpu.tier}</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-600">Memory</div>
              <div className="font-semibold">{capabilities.memory.size} GB</div>
              <div className="text-gray-500 capitalize">{capabilities.memory.tier}</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-600">GPU</div>
              <div className="font-semibold truncate">{capabilities.gpu.renderer.split(' ')[0]}</div>
              <div className="text-gray-500 capitalize">{capabilities.gpu.tier}</div>
            </div>
            <div className="bg-gray-50 rounded p-2">
              <div className="text-gray-600">Network</div>
              <div className="font-semibold uppercase">{capabilities.connection.effectiveType}</div>
              <div className="text-gray-500 capitalize">{capabilities.connection.tier}</div>
            </div>
          </div>
          <div className="mt-2 bg-blue-50 rounded p-2 text-center">
            <div className="text-xs text-blue-600">Overall Tier</div>
            <div className="font-bold text-blue-700 uppercase">{capabilities.tier}</div>
          </div>
        </div>
      )}

      {/* Adaptive Settings */}
      {settings && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Adaptive Settings</h4>
          <div className="bg-gray-50 rounded p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Quality:</span>
              <span className="font-semibold uppercase">{settings.quality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Animation Duration:</span>
              <span className="font-semibold">{settings.animations.duration}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Backdrop Blur:</span>
              <span className="font-semibold">{settings.effects.backdropBlur}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Chart Points:</span>
              <span className="font-semibold">{settings.charts.maxDataPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">GPU Acceleration:</span>
              <span className="font-semibold">{settings.rendering.useGPU ? 'On' : 'Off'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center pt-3 border-t border-gray-200">
        Performance monitoring active
      </div>
    </div>
  );
};

export default PerformanceMonitor;
