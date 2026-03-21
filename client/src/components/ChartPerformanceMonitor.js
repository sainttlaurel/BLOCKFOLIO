import React, { useEffect, useState, useRef } from 'react';
import { ChartPerformanceMonitor } from '../utils/chartOptimization';

/**
 * Chart Performance Monitor Component
 * 
 * Monitors and displays real-time performance metrics for chart components
 * to ensure 60fps performance is maintained during interactions and updates.
 */
const ChartPerformanceMonitorComponent = ({ 
  enabled = process.env.NODE_ENV === 'development',
  showDetails = false,
  onPerformanceIssue,
  className = ''
}) => {
  const [monitor] = useState(() => new ChartPerformanceMonitor());
  const [metrics, setMetrics] = useState({
    frameRate: 0,
    renderTime: 0,
    status: 'good'
  });
  const [alerts, setAlerts] = useState([]);
  const updateInterval = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Start monitoring
    monitor.startFrameRateMonitoring();

    // Update metrics display every second
    updateInterval.current = setInterval(() => {
      const report = monitor.getReport();
      setMetrics(report);

      // Check for performance issues
      if (report.status === 'poor') {
        const alert = {
          id: Date.now(),
          type: 'performance',
          message: `Chart performance degraded: ${report.frameRate}fps`,
          recommendations: report.recommendations,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setAlerts(prev => [...prev.slice(-4), alert]); // Keep last 5 alerts
        onPerformanceIssue?.(alert);
      }
    }, 1000);

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [enabled, monitor, onPerformanceIssue]);

  // Clear alerts
  const clearAlerts = () => setAlerts([]);

  if (!enabled) return null;

  return (
    <div className={`chart-performance-monitor ${className}`}>
      {/* Compact Performance Indicator */}
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
        metrics.status === 'good' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          metrics.status === 'good' ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <span>{metrics.frameRate}fps</span>
        {metrics.renderTime > 0 && (
          <span className="text-gray-500">
            {metrics.renderTime.toFixed(1)}ms
          </span>
        )}
      </div>

      {/* Detailed Metrics Panel */}
      {showDetails && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Chart Performance</h4>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              metrics.status === 'good' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {metrics.status === 'good' ? 'Optimal' : 'Poor'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-600">Frame Rate</div>
              <div className={`font-semibold ${
                metrics.frameRate >= 55 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.frameRate} fps
              </div>
              <div className="text-gray-500 text-xs">Target: 60fps</div>
            </div>

            <div>
              <div className="text-gray-600">Render Time</div>
              <div className={`font-semibold ${
                metrics.renderTime <= 16.67 ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.renderTime.toFixed(2)} ms
              </div>
              <div className="text-gray-500 text-xs">Target: &lt;16.67ms</div>
            </div>
          </div>

          {/* Performance Recommendations */}
          {metrics.recommendations && metrics.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-gray-700 font-medium mb-1">Recommendations</div>
              <ul className="text-gray-600 space-y-1">
                {metrics.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <div className="mt-2 space-y-1">
          {alerts.slice(-3).map(alert => (
            <div 
              key={alert.id}
              className="bg-red-50 border border-red-200 rounded px-2 py-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-red-800 font-medium">{alert.message}</span>
                <span className="text-red-600">{alert.timestamp}</span>
              </div>
              {alert.recommendations && alert.recommendations.length > 0 && (
                <div className="mt-1 text-red-700">
                  {alert.recommendations[0]}
                </div>
              )}
            </div>
          ))}
          
          {alerts.length > 3 && (
            <button
              onClick={clearAlerts}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear alerts ({alerts.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Hook for easy integration with chart components
export const useChartPerformanceMonitor = (options = {}) => {
  const [monitor] = useState(() => new ChartPerformanceMonitor());
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = () => {
    if (!isMonitoring) {
      monitor.startFrameRateMonitoring();
      setIsMonitoring(true);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const measureRender = (renderFn) => {
    return monitor.measureRenderTime(renderFn);
  };

  const getReport = () => {
    return monitor.getReport();
  };

  return {
    monitor,
    startMonitoring,
    stopMonitoring,
    measureRender,
    getReport,
    isMonitoring
  };
};

// Performance benchmark component for testing
export const ChartPerformanceBenchmark = ({ 
  onBenchmarkComplete,
  testDuration = 10000 // 10 seconds
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const { monitor, startMonitoring, stopMonitoring, getReport } = useChartPerformanceMonitor();

  const runBenchmark = async () => {
    setIsRunning(true);
    setResults(null);

    startMonitoring();

    // Simulate heavy chart operations
    const startTime = Date.now();
    const frameRates = [];
    const renderTimes = [];

    const benchmarkLoop = () => {
      const report = getReport();
      frameRates.push(report.frameRate);
      renderTimes.push(report.renderTime);

      if (Date.now() - startTime < testDuration) {
        requestAnimationFrame(benchmarkLoop);
      } else {
        // Calculate results
        const avgFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
        const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
        const minFrameRate = Math.min(...frameRates);
        const maxRenderTime = Math.max(...renderTimes);

        const benchmarkResults = {
          avgFrameRate: avgFrameRate.toFixed(1),
          minFrameRate: minFrameRate.toFixed(1),
          avgRenderTime: avgRenderTime.toFixed(2),
          maxRenderTime: maxRenderTime.toFixed(2),
          performance: avgFrameRate >= 55 ? 'excellent' : avgFrameRate >= 45 ? 'good' : 'poor',
          duration: testDuration / 1000
        };

        setResults(benchmarkResults);
        setIsRunning(false);
        stopMonitoring();
        onBenchmarkComplete?.(benchmarkResults);
      }
    };

    requestAnimationFrame(benchmarkLoop);
  };

  return (
    <div className="chart-performance-benchmark p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Chart Performance Benchmark</h3>
        <button
          onClick={runBenchmark}
          disabled={isRunning}
          className={`px-3 py-1 text-sm font-medium rounded ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>

      {isRunning && (
        <div className="text-sm text-gray-600 mb-3">
          Running {testDuration / 1000}s performance test...
        </div>
      )}

      {results && (
        <div className="bg-white rounded border p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600">Average FPS</div>
              <div className={`font-semibold ${
                results.avgFrameRate >= 55 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.avgFrameRate}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Min FPS</div>
              <div className={`font-semibold ${
                results.minFrameRate >= 45 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.minFrameRate}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Avg Render Time</div>
              <div className={`font-semibold ${
                results.avgRenderTime <= 16.67 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.avgRenderTime}ms
              </div>
            </div>
            <div>
              <div className="text-gray-600">Max Render Time</div>
              <div className={`font-semibold ${
                results.maxRenderTime <= 33 ? 'text-green-600' : 'text-red-600'
              }`}>
                {results.maxRenderTime}ms
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
              results.performance === 'excellent' ? 'bg-green-100 text-green-800' :
              results.performance === 'good' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Performance: {results.performance}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartPerformanceMonitorComponent;