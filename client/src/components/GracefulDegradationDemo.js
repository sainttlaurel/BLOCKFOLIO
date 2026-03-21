/**
 * Graceful Degradation Demo Component
 * 
 * Demonstrates how components adapt to different degradation levels
 * and provides controls for testing degradation scenarios.
 */

import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
  Monitor,
  Smartphone,
  Zap
} from 'lucide-react';
import { useGracefulDegradation, useNetworkQuality, usePerformanceAware } from '../hooks/useGracefulDegradation';
import CandlestickChart from './CandlestickChart';
import GlobalMarketStats from './GlobalMarketStats';

const GracefulDegradationDemo = () => {
  const { 
    degradationLevel, 
    networkQuality, 
    featureFlags, 
    metrics, 
    forceDegradationLevel,
    degradationLevels 
  } = useGracefulDegradation();
  
  const { quality, isOnline, isExcellent, isGood, isFair, isPoor, isOffline } = useNetworkQuality();
  const { performanceMode, shouldOptimize } = usePerformanceAware();
  
  const [showDetails, setShowDetails] = useState(false);
  
  // Sample data for demonstration
  const sampleChartData = [
    { x: '9:00', o: 45000, h: 45500, l: 44800, c: 45200, v: 1200000 },
    { x: '9:15', o: 45200, h: 45800, l: 45100, c: 45600, v: 1500000 },
    { x: '9:30', o: 45600, h: 46200, l: 45400, c: 45900, v: 1800000 },
    { x: '9:45', o: 45900, h: 46100, l: 45700, c: 45800, v: 1300000 },
    { x: '10:00', o: 45800, h: 46500, l: 45600, c: 46300, v: 2100000 }
  ];

  const getDegradationColor = (level) => {
    switch (level) {
      case 'full': return 'text-green-600 bg-green-100';
      case 'reduced': return 'text-yellow-600 bg-yellow-100';
      case 'minimal': return 'text-orange-600 bg-orange-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNetworkQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleForceDegradation = (level) => {
    forceDegradationLevel(level);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Graceful Degradation Demo</h2>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          This demo shows how the trading platform adapts to different network conditions and performance constraints.
          Components automatically adjust their behavior to maintain functionality even under poor conditions.
        </p>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Degradation Level */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Monitor className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Degradation Level</span>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDegradationColor(degradationLevel)}`}>
              {degradationLevel.toUpperCase()}
            </div>
          </div>

          {/* Network Quality */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              {isOnline ? (
                <Wifi className={`h-5 w-5 ${getNetworkQualityColor(quality)}`} />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium text-gray-900">Network Quality</span>
            </div>
            <div className={`text-sm font-medium ${getNetworkQualityColor(quality)}`}>
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </div>
          </div>

          {/* Performance Mode */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Performance Mode</span>
            </div>
            <div className="text-sm font-medium text-gray-700">
              {performanceMode.charAt(0).toUpperCase() + performanceMode.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Degradation Levels</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(degradationLevels).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleForceDegradation(value)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                degradationLevel === value
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Flags Status */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Flags Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(featureFlags).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center space-x-2">
                {enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm text-gray-700 capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Degradation Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{metrics.degradationEvents}</div>
              <div className="text-sm text-gray-600">Degradation Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(metrics.totalDowntime / 1000)}s
              </div>
              <div className="text-sm text-gray-600">Total Downtime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 capitalize">
                {metrics.userExperience}
              </div>
              <div className="text-sm text-gray-600">User Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.averageRecoveryTime ? Math.round(metrics.averageRecoveryTime / 1000) : 0}s
              </div>
              <div className="text-sm text-gray-600">Avg Recovery Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Demo */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Adaptive Chart Component
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            This chart adapts its rendering quality, animations, and data points based on the current degradation level.
          </p>
          <div className="h-64">
            <CandlestickChart 
              data={sampleChartData}
              width="100%"
              height={250}
              showVolume={true}
            />
          </div>
        </div>

        {/* Market Stats Demo */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Adaptive Market Stats
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Market statistics with adaptive animations and update intervals based on network conditions.
          </p>
          <GlobalMarketStats />
        </div>
      </div>

      {/* Behavior Explanation */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How It Works</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Full Mode:</strong> All features enabled, high-quality rendering, real-time updates</p>
          <p><strong>Reduced Mode:</strong> Animations disabled, reduced update frequency, simplified rendering</p>
          <p><strong>Minimal Mode:</strong> Basic functionality only, no real-time updates, minimal UI</p>
          <p><strong>Offline Mode:</strong> Cached data only, no network requests, essential features only</p>
        </div>
      </div>
    </div>
  );
};

export default GracefulDegradationDemo;