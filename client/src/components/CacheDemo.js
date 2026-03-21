/**
 * Cache Demo Component
 * 
 * Demonstrates the enhanced caching features including:
 * - Background refresh notifications
 * - Predictive caching
 * - Cache warming
 * - Performance monitoring
 */

import React, { useState, useEffect } from 'react';
import { usePrices, useMarketData, usePortfolio } from '../hooks/useDataCache';
import CacheMonitor from './CacheMonitor';

const CacheDemo = () => {
  const [showMonitor, setShowMonitor] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Use enhanced hooks with different priorities
  const pricesData = usePrices({ 
    priority: 'high',
    enableBackgroundRefresh: true 
  });
  
  const marketData = useMarketData({ 
    priority: 'medium',
    enableBackgroundRefresh: true 
  });
  
  const portfolioData = usePortfolio({ 
    priority: 'high',
    enableBackgroundRefresh: true 
  });

  // Track background updates
  useEffect(() => {
    const addNotification = (message, type = 'info') => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    };

    // Monitor background updates
    if (pricesData.backgroundUpdateAvailable) {
      addNotification('New price data available in background', 'success');
    }
    
    if (marketData.backgroundUpdateAvailable) {
      addNotification('New market data available in background', 'info');
    }
    
    if (portfolioData.backgroundUpdateAvailable) {
      addNotification('New portfolio data available in background', 'warning');
    }
  }, [
    pricesData.backgroundUpdateAvailable,
    marketData.backgroundUpdateAvailable,
    portfolioData.backgroundUpdateAvailable
  ]);

  const handleApplyUpdate = (dataType) => {
    switch (dataType) {
      case 'prices':
        pricesData.applyBackgroundUpdate();
        break;
      case 'market':
        marketData.applyBackgroundUpdate();
        break;
      case 'portfolio':
        portfolioData.applyBackgroundUpdate();
        break;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="cache-demo p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Caching System Demo
        </h1>
        <p className="text-gray-600">
          Demonstrating intelligent caching with background refresh, predictive loading, and performance optimization.
        </p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border shadow-lg max-w-sm ${getNotificationColor(notification.type)}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {notification.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(prev => 
                    prev.filter(n => n.id !== notification.id)
                  )}
                  className="ml-2 text-lg leading-none opacity-50 hover:opacity-75"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cache Monitor Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowMonitor(!showMonitor)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showMonitor ? 'Hide' : 'Show'} Cache Monitor
        </button>
      </div>

      {/* Cache Monitor */}
      {showMonitor && (
        <div className="mb-6">
          <CacheMonitor />
        </div>
      )}

      {/* Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prices Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Prices {pricesData.isRefreshing && <span className="text-sm text-blue-600">(Refreshing...)</span>}
            </h2>
            {pricesData.backgroundUpdateAvailable && (
              <button
                onClick={() => handleApplyUpdate('prices')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Apply Update
              </button>
            )}
          </div>
          
          {pricesData.loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : pricesData.error ? (
            <div className="text-red-600">Error: {pricesData.error.message}</div>
          ) : (
            <div className="space-y-2">
              {pricesData.data?.slice(0, 5).map((coin, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-green-600">${coin.price?.toLocaleString()}</span>
                </div>
              ))}
              {pricesData.lastUpdate && (
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {pricesData.lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* Cache Health for Prices */}
          {pricesData.cacheHealth && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <div className="font-medium text-gray-700">Cache Health:</div>
              <div className="text-gray-600">
                Hit Rate: {pricesData.cacheHealth.hitRate} | 
                Memory: {pricesData.cacheHealth.memoryUsage}MB | 
                Efficiency: {pricesData.cacheHealth.efficiency}
              </div>
            </div>
          )}
        </div>

        {/* Market Data Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Market Data {marketData.isRefreshing && <span className="text-sm text-blue-600">(Refreshing...)</span>}
            </h2>
            {marketData.backgroundUpdateAvailable && (
              <button
                onClick={() => handleApplyUpdate('market')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Apply Update
              </button>
            )}
          </div>
          
          {marketData.loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : marketData.error ? (
            <div className="text-red-600">Error: {marketData.error.message}</div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Market Cap:</span>
                <span className="font-medium">
                  ${marketData.data?.totalMarketCap?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">24h Volume:</span>
                <span className="font-medium">
                  ${marketData.data?.totalVolume?.toLocaleString()}
                </span>
              </div>
              {marketData.lastUpdate && (
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {marketData.lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Portfolio {portfolioData.isRefreshing && <span className="text-sm text-blue-600">(Refreshing...)</span>}
            </h2>
            {portfolioData.backgroundUpdateAvailable && (
              <button
                onClick={() => handleApplyUpdate('portfolio')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Apply Update
              </button>
            )}
          </div>
          
          {portfolioData.loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : portfolioData.error ? (
            <div className="text-red-600">Error: {portfolioData.error.message}</div>
          ) : (
            <div className="space-y-3">
              <div className="text-2xl font-bold text-green-600">
                ${portfolioData.data?.totalValue?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Holdings: {portfolioData.data?.holdings?.length || 0}
              </div>
              {portfolioData.lastUpdate && (
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {portfolioData.lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Network Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Network Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <span className={`ml-2 font-medium ${
              pricesData.networkStatus?.isOnline ? 'text-green-600' : 'text-red-600'
            }`}>
              {pricesData.networkStatus?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Quality:</span>
            <span className="ml-2 font-medium">{pricesData.networkStatus?.quality || 'Unknown'}</span>
          </div>
          <div>
            <span className="text-gray-600">Response Time:</span>
            <span className="ml-2 font-medium">{pricesData.networkStatus?.responseTime || 'N/A'}ms</span>
          </div>
          <div>
            <span className="text-gray-600">Reliability:</span>
            <span className="ml-2 font-medium">{pricesData.networkStatus?.reliability || 'N/A'}%</span>
          </div>
        </div>
      </div>

      {/* Features Demonstration */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Enhanced Caching Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Background Refresh</h4>
            <p className="text-blue-700">
              Data is refreshed in the background without interrupting the user experience. 
              Users are notified when fresh data is available.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Intelligent TTL</h4>
            <p className="text-blue-700">
              Cache expiration times are automatically adjusted based on data volatility 
              and access patterns.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Predictive Caching</h4>
            <p className="text-blue-700">
              Frequently accessed data is pre-loaded based on usage patterns to 
              improve response times.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-1">Compression</h4>
            <p className="text-blue-700">
              Large datasets are automatically compressed to reduce memory usage 
              while maintaining fast access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheDemo;