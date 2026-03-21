/**
 * Cache Monitor Component
 * 
 * Demonstrates the enhanced caching functionality including:
 * - Real-time cache metrics
 * - Cache health monitoring
 * - Background refresh indicators
 * - Cache optimization controls
 */

import React, { useState, useEffect } from 'react';
import { useCacheMetrics, useCacheHealth } from '../hooks/useDataCache';

const CacheMonitor = () => {
  const { 
    metrics, 
    analytics, 
    healthStatus, 
    clearCache, 
    optimizeCache, 
    warmCache 
  } = useCacheMetrics();
  
  const { 
    health, 
    recommendations, 
    isHealthy, 
    hasWarnings, 
    isCritical 
  } = useCacheHealth();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cached data?')) {
      clearCache();
    }
  };

  const handleOptimizeCache = () => {
    optimizeCache();
  };

  const handleWarmCache = async () => {
    await warmCache();
  };

  const getHealthStatusColor = () => {
    if (isCritical) return 'text-red-600 bg-red-50';
    if (hasWarnings) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getHealthStatusIcon = () => {
    if (isCritical) return '🔴';
    if (hasWarnings) return '🟡';
    return '🟢';
  };

  if (!metrics) {
    return (
      <div className="cache-monitor loading">
        <div className="animate-pulse">Loading cache metrics...</div>
      </div>
    );
  }

  return (
    <div className="cache-monitor bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Cache Monitor</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor()}`}>
            {getHealthStatusIcon()} {health?.status || 'Unknown'}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="metric-card">
          <div className="text-2xl font-bold text-blue-600">{metrics.hitRate}</div>
          <div className="text-sm text-gray-600">Hit Rate</div>
        </div>
        <div className="metric-card">
          <div className="text-2xl font-bold text-green-600">{metrics.memoryUsageMB}MB</div>
          <div className="text-sm text-gray-600">Memory Usage</div>
        </div>
        <div className="metric-card">
          <div className="text-2xl font-bold text-purple-600">{metrics.cacheEfficiencyScore}</div>
          <div className="text-sm text-gray-600">Efficiency Score</div>
        </div>
        <div className="metric-card">
          <div className="text-2xl font-bold text-orange-600">{metrics.compressionRatio}</div>
          <div className="text-sm text-gray-600">Compression</div>
        </div>
      </div>

      {/* Background Activity */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Background Activity</h4>
        <div className="flex space-x-4 text-sm">
          <div>
            <span className="text-gray-600">Refreshes:</span>
            <span className="ml-1 font-medium">{metrics.backgroundRefreshes}</span>
          </div>
          <div>
            <span className="text-gray-600">Warmings:</span>
            <span className="ml-1 font-medium">{metrics.cacheWarmings}</span>
          </div>
          <div>
            <span className="text-gray-600">Queue Size:</span>
            <span className="ml-1 font-medium">{metrics.backgroundRefreshQueueSize || 0}</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Recommendations</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleOptimizeCache}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Optimize
        </button>
        <button
          onClick={handleWarmCache}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          Warm Cache
        </button>
        <button
          onClick={handleClearCache}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Clear Cache
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Detailed Metrics */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Detailed Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Hits:</span>
                  <span className="font-medium">{metrics.hits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cache Misses:</span>
                  <span className="font-medium">{metrics.misses}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory Cache Size:</span>
                  <span className="font-medium">{metrics.memoryCacheSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Cache Size:</span>
                  <span className="font-medium">{metrics.storageCacheSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Response Time:</span>
                  <span className="font-medium">{metrics.averageResponseTimeMs}ms</span>
                </div>
              </div>
            </div>

            {/* Performance Trends */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Trends</h4>
              {metrics.recentHitRateHistory && metrics.recentHitRateHistory.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">Recent Hit Rate History:</div>
                  <div className="flex space-x-1">
                    {metrics.recentHitRateHistory.slice(-10).map((point, index) => (
                      <div
                        key={index}
                        className="w-2 bg-blue-200 rounded"
                        style={{
                          height: `${Math.max(4, (point.hitRate / 100) * 20)}px`
                        }}
                        title={`${point.hitRate.toFixed(1)}%`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No trend data available</div>
              )}
            </div>
          </div>

          {/* Top Accessed Keys */}
          {metrics.topAccessedKeys && metrics.topAccessedKeys.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Most Accessed Data</h4>
              <div className="space-y-1">
                {metrics.topAccessedKeys.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.key}</span>
                    <span className="font-medium">{item.accessCount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CacheMonitor;