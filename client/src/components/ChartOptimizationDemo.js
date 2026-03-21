import React, { useState, useEffect, useRef } from 'react';
import OptimizedChartRenderer from './OptimizedChartRenderer';
import ChartPerformanceMonitorComponent, { ChartPerformanceBenchmark } from './ChartPerformanceMonitor';
import { useChartOptimization } from '../utils/chartOptimization';

/**
 * Chart Optimization Demo Component
 * 
 * Demonstrates the performance improvements achieved through chart optimization
 * including 60fps rendering, efficient data processing, and performance monitoring.
 */
const ChartOptimizationDemo = () => {
  const canvasRef = useRef(null);
  const { optimizer, dataProcessor, performanceMonitor } = useChartOptimization(canvasRef);
  const [dataSize, setDataSize] = useState(1000);
  const [chartType, setChartType] = useState('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [useOptimization, setUseOptimization] = useState(true);
  const [benchmarkResults, setBenchmarkResults] = useState(null);
  const [demoData, setDemoData] = useState([]);

  // Generate demo data
  useEffect(() => {
    const generateData = () => {
      const data = [];
      let price = 50000; // Starting price
      
      for (let i = 0; i < dataSize; i++) {
        const change = (Math.random() - 0.5) * 1000;
        price += change;
        
        const high = price + Math.random() * 500;
        const low = price - Math.random() * 500;
        const open = price - change / 2;
        const close = price;
        const volume = Math.random() * 1000000;
        
        data.push({
          x: new Date(Date.now() - (dataSize - i) * 60000).toLocaleTimeString(),
          o: open,
          h: high,
          l: low,
          c: close,
          v: volume
        });
      }
      
      return data;
    };

    setDemoData(generateData());
  }, [dataSize]);

  const handleBenchmarkComplete = (results) => {
    setBenchmarkResults(results);
  };

  const handleDataSizeChange = (newSize) => {
    setDataSize(newSize);
  };

  return (
    <div className="chart-optimization-demo p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chart Performance Optimization Demo
          </h1>
          <p className="text-gray-600">
            Demonstrating 60fps chart rendering with optimized data processing and performance monitoring.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Data Size Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Points: {dataSize}
              </label>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={dataSize}
                onChange={(e) => handleDataSizeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100</span>
                <span>5000</span>
              </div>
            </div>

            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Type
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="candlestick">Candlestick</option>
                <option value="line">Line</option>
                <option value="area">Area</option>
              </select>
            </div>

            {/* Volume Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Display
              </label>
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`w-full px-4 py-2 rounded-md font-medium ${
                  showVolume
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {showVolume ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Optimization Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performance Mode
              </label>
              <button
                onClick={() => setUseOptimization(!useOptimization)}
                className={`w-full px-4 py-2 rounded-md font-medium ${
                  useOptimization
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {useOptimization ? '60fps Optimized' : 'Standard'}
              </button>
            </div>
          </div>
        </div>

        {/* Performance Monitor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Performance Monitor</h2>
            <ChartPerformanceMonitorComponent
              enabled={true}
              showDetails={true}
              className="ml-4"
            />
          </div>
          
          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Data Points</div>
              <div className="text-2xl font-bold text-gray-900">{dataSize.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Optimization</div>
              <div className={`text-2xl font-bold ${
                useOptimization ? 'text-green-600' : 'text-red-600'
              }`}>
                {useOptimization ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Chart Type</div>
              <div className="text-2xl font-bold text-gray-900 capitalize">{chartType}</div>
            </div>
          </div>
        </div>

        {/* Chart Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Optimized Chart Renderer</h2>
            <div className="text-sm text-gray-600">
              {useOptimization ? 'Using optimized 60fps renderer' : 'Using standard renderer'}
            </div>
          </div>
          
          <div className="relative">
            {useOptimization ? (
              <OptimizedChartRenderer
                data={demoData}
                width={800}
                height={400}
                type={chartType}
                showVolume={showVolume}
                className="w-full border border-gray-200 rounded"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium mb-2">Standard Renderer</div>
                  <div className="text-sm">
                    Enable optimization to see the 60fps optimized chart
                  </div>
                </div>
              </div>
            )}
            
            {/* Hidden canvas for optimization hook */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Performance Benchmark */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Benchmark</h2>
          
          <ChartPerformanceBenchmark
            onBenchmarkComplete={handleBenchmarkComplete}
            testDuration={5000} // 5 second test
          />
          
          {benchmarkResults && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Benchmark Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Avg FPS</div>
                  <div className={`font-bold ${
                    parseFloat(benchmarkResults.avgFrameRate) >= 55 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {benchmarkResults.avgFrameRate}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Min FPS</div>
                  <div className={`font-bold ${
                    parseFloat(benchmarkResults.minFrameRate) >= 45 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {benchmarkResults.minFrameRate}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Avg Render</div>
                  <div className={`font-bold ${
                    parseFloat(benchmarkResults.avgRenderTime) <= 16.67 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {benchmarkResults.avgRenderTime}ms
                  </div>
                </div>
                <div>
                  <div className="text-gray-600">Performance</div>
                  <div className={`font-bold capitalize ${
                    benchmarkResults.performance === 'excellent' ? 'text-green-600' :
                    benchmarkResults.performance === 'good' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {benchmarkResults.performance}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Optimization Features */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimization Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">60fps Rendering</h3>
              <p className="text-sm text-gray-600">
                Optimized canvas rendering with frame rate management for smooth 60fps performance
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Processing</h3>
              <p className="text-sm text-gray-600">
                Efficient data downsampling and caching for handling large datasets without performance loss
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance Monitoring</h3>
              <p className="text-sm text-gray-600">
                Real-time performance tracking with alerts and recommendations for optimal chart performance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartOptimizationDemo;