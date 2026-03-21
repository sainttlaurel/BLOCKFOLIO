/**
 * Status Bar Component
 * 
 * Integrated status bar showing connection status, data freshness,
 * and system health indicators in a compact, non-intrusive format.
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Activity } from 'lucide-react';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import DataFreshnessIndicator from './DataFreshnessIndicator';
import { usePrices, useMarketData, usePortfolio, useCacheMetrics } from '../hooks/useDataCache';

const StatusBar = ({ 
  className = "",
  position = 'bottom',
  collapsible = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Data hooks for monitoring
  const { lastUpdate: pricesUpdate, isRefreshing: pricesRefreshing, refresh: refreshPrices } = usePrices();
  const { lastUpdate: marketUpdate, isRefreshing: marketRefreshing, refresh: refreshMarket } = useMarketData();
  const { lastUpdate: portfolioUpdate, isRefreshing: portfolioRefreshing, refresh: refreshPortfolio } = usePortfolio();
  const { metrics } = useCacheMetrics();

  const positionClasses = {
    top: 'top-0 left-0 right-0 border-b',
    bottom: 'bottom-0 left-0 right-0 border-t'
  };

  const getOverallHealthStatus = () => {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute
    
    let issues = 0;
    if (pricesUpdate && now - new Date(pricesUpdate).getTime() > staleThreshold) issues++;
    if (marketUpdate && now - new Date(marketUpdate).getTime() > staleThreshold) issues++;
    if (portfolioUpdate && now - new Date(portfolioUpdate).getTime() > staleThreshold) issues++;
    
    if (issues === 0) return { status: 'healthy', color: 'text-green-600' };
    if (issues <= 1) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  const healthStatus = getOverallHealthStatus();

  if (isCollapsed) {
    return (
      <div className={`
        fixed ${positionClasses[position]} z-40
        bg-white border-gray-200 shadow-sm
        ${className}
      `}>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            {/* Compact Status Indicators */}
            <div className="flex items-center space-x-2">
              <Activity className={`h-4 w-4 ${healthStatus.color}`} />
              <span className="text-sm text-gray-600">System Status</span>
            </div>
            
            <ConnectionStatusIndicator className="scale-90" />
            
            {metrics && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Cache: {metrics.hitRate}</span>
              </div>
            )}
          </div>
          
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Expand status bar"
            >
              {position === 'bottom' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`
      fixed ${positionClasses[position]} z-40
      bg-white border-gray-200 shadow-sm
      ${className}
    `}>
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className={`h-4 w-4 ${healthStatus.color}`} />
            <span className="text-sm font-medium text-gray-900">System Status</span>
            <div className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${healthStatus.status === 'healthy' ? 'text-green-700 bg-green-100' :
                healthStatus.status === 'warning' ? 'text-yellow-700 bg-yellow-100' :
                'text-red-700 bg-red-100'}
            `}>
              {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </div>
          </div>
          
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Collapse status bar"
            >
              {position === 'bottom' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Connection Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Connection
            </h4>
            <ConnectionStatusIndicator showDetails />
          </div>

          {/* Data Freshness */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              Data Freshness
            </h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Prices</span>
                <DataFreshnessIndicator
                  lastUpdate={pricesUpdate}
                  dataType="prices"
                  maxAge={10000}
                  onRefresh={refreshPrices}
                  isRefreshing={pricesRefreshing}
                  showRefreshButton={false}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Market</span>
                <DataFreshnessIndicator
                  lastUpdate={marketUpdate}
                  dataType="market"
                  maxAge={15000}
                  onRefresh={refreshMarket}
                  isRefreshing={marketRefreshing}
                  showRefreshButton={false}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Portfolio</span>
                <DataFreshnessIndicator
                  lastUpdate={portfolioUpdate}
                  dataType="portfolio"
                  maxAge={20000}
                  onRefresh={refreshPortfolio}
                  isRefreshing={portfolioRefreshing}
                  showRefreshButton={false}
                />
              </div>
            </div>
          </div>

          {/* Cache Performance */}
          {metrics && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Performance
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-green-600">{metrics.hitRate}</div>
                  <div className="text-gray-500">Cache Hit Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-700">
                    {metrics.memoryCacheSize + metrics.storageCacheSize}
                  </div>
                  <div className="text-gray-500">Cache Entries</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                refreshPrices();
                refreshMarket();
                refreshPortfolio();
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              Refresh All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;