/**
 * Offline-Capable Portfolio View Component
 * 
 * Demonstrates comprehensive offline functionality with cached data access,
 * offline analytics, data export, and seamless online/offline transitions.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Search, 
  Filter,
  BarChart3,
  PieChart,
  Clock,
  Database,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { 
  withOfflineAwareness, 
  OfflineDataDisplay, 
  OfflineFeatureGuard,
  OfflineActionButton 
} from './OfflineAwareComponent';
import { useOfflineMode } from '../hooks/useOfflineMode';

const OfflinePortfolioView = ({ 
  data, 
  loading, 
  error, 
  isOffline, 
  isFromCache, 
  refresh 
}) => {
  const { 
    queueAction, 
    isFeatureAvailable,
    getComprehensiveOfflineStatus 
  } = useOfflineMode();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [filterBy, setFilterBy] = useState('all');
  const [offlineStatus, setOfflineStatus] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');

  // Get comprehensive offline status
  useEffect(() => {
    if (isOffline && window.offlineService) {
      const status = window.offlineService.getComprehensiveOfflineStatus();
      setOfflineStatus(status);
    }
  }, [isOffline]);

  // Handle offline search
  const handleOfflineSearch = async (query) => {
    if (!isOffline || !window.offlineService) return [];
    
    try {
      const results = await window.offlineService.searchOfflineData(query, {
        dataTypes: ['portfolioData', 'marketData'],
        maxResults: 20,
        includeStale: true
      });
      return results;
    } catch (error) {
      console.error('Offline search failed:', error);
      return [];
    }
  };

  // Handle data export
  const handleExport = async () => {
    if (!isOffline || !window.offlineService) {
      // Online export - queue action
      queueAction('export_data', { 
        format: exportFormat, 
        dataTypes: ['portfolioData'],
        timestamp: Date.now()
      });
      return;
    }

    try {
      const exportData = await window.offlineService.exportCachedData({
        dataTypes: ['portfolioData', 'marketData', 'transactionHistory'],
        format: exportFormat,
        includeMetadata: true
      });

      // Create download
      const blob = new Blob([
        exportFormat === 'json' ? JSON.stringify(exportData, null, 2) : exportData
      ], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-data-${Date.now()}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Filter and sort portfolio data
  const processPortfolioData = (portfolioData) => {
    if (!portfolioData || !portfolioData.holdings) return [];
    
    let holdings = [...portfolioData.holdings];
    
    // Apply search filter
    if (searchQuery) {
      holdings = holdings.filter(holding => 
        holding.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        holding.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterBy !== 'all') {
      holdings = holdings.filter(holding => {
        switch (filterBy) {
          case 'gainers':
            return holding.percentageChange > 0;
          case 'losers':
            return holding.percentageChange < 0;
          case 'large':
            return holding.value > 1000;
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    holdings.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.value - a.value;
        case 'change':
          return b.percentageChange - a.percentageChange;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    return holdings;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">
          {isOffline ? 'Loading cached data...' : 'Loading portfolio...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Portfolio</h3>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const portfolioData = data?.data || data;
  const holdings = processPortfolioData(portfolioData);

  return (
    <OfflineDataDisplay 
      data={portfolioData} 
      isFromCache={isFromCache} 
      dataAge={data?.age}
      className="space-y-6"
    >
      {/* Header with Offline Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
          {isOffline && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 rounded-full">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Offline Mode</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Export Button */}
          <OfflineFeatureGuard feature="data_export">
            <div className="flex items-center space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              
              <OfflineActionButton
                action={{ type: 'export_data', data: { format: exportFormat } }}
                onlineAction={handleExport}
                offlineAction={handleExport}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </OfflineActionButton>
            </div>
          </OfflineFeatureGuard>
          
          {/* Refresh Button */}
          <button
            onClick={refresh}
            disabled={isOffline}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              isOffline 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolioData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolioData.totalValue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className={`flex items-center space-x-1 ${
                portfolioData.percentageChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioData.percentageChange24h >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {Math.abs(portfolioData.percentageChange24h || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Holdings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {holdings.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Status</p>
                <p className="text-sm text-gray-700">
                  {isFromCache ? 'Cached Data' : 'Live Data'}
                </p>
              </div>
              {isFromCache ? (
                <Database className="h-8 w-8 text-yellow-600" />
              ) : (
                <Wifi className="h-8 w-8 text-green-600" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={isOffline ? "Search cached holdings..." : "Search holdings..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="value">Sort by Value</option>
            <option value="change">Sort by Change</option>
            <option value="name">Sort by Name</option>
          </select>
          
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Holdings</option>
            <option value="gainers">Gainers</option>
            <option value="losers">Losers</option>
            <option value="large">Large Holdings</option>
          </select>
        </div>
      </div>

      {/* Holdings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Holdings</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {holdings.length > 0 ? (
            holdings.map((holding, index) => (
              <HoldingRow 
                key={holding.symbol || index} 
                holding={holding} 
                isOffline={isOffline}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <PieChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No holdings found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offline Analytics */}
      {isOffline && offlineStatus?.analytics && (
        <OfflineAnalyticsPanel analytics={offlineStatus.analytics} />
      )}
    </OfflineDataDisplay>
  );
};

// Individual Holding Row Component
const HoldingRow = ({ holding, isOffline }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value?.toFixed(2) || '0.00'}%`;
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {holding.symbol?.substring(0, 2) || '??'}
            </span>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-900">{holding.name || 'Unknown'}</h4>
            <p className="text-sm text-gray-500">{holding.symbol || 'N/A'}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(holding.value)}
          </p>
          <div className={`flex items-center justify-end space-x-1 ${
            holding.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {holding.percentageChange >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="text-sm font-medium">
              {formatPercentage(holding.percentageChange)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Offline Data Indicator */}
      {isOffline && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>Cached data - may not reflect current prices</span>
        </div>
      )}
    </div>
  );
};

// Offline Analytics Panel Component
const OfflineAnalyticsPanel = ({ analytics }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-blue-900">Offline Session Analytics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Session Duration</div>
          <div className="text-xl font-bold text-gray-900">
            {Math.round(analytics.offlineSessionDuration / 60000)}m
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Data Quality</div>
          <div className="text-xl font-bold text-gray-900">
            {analytics.cacheEfficiency?.dataFreshness?.toFixed(0) || 0}%
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-600">Cache Efficiency</div>
          <div className="text-xl font-bold text-gray-900">
            {analytics.cacheEfficiency?.hitRate || 0}%
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced with offline awareness
export default withOfflineAwareness(OfflinePortfolioView, {
  dataType: 'portfolioData',
  dataFetcher: async () => {
    // This would be replaced with actual data fetching logic
    const response = await fetch('/api/portfolio');
    if (!response.ok) throw new Error('Failed to fetch portfolio data');
    return response.json();
  },
  showOfflineIndicator: true,
  showDataAge: true,
  enableCacheFallback: true,
  maxCacheAge: 900000, // 15 minutes
  offlineMessage: 'Portfolio data is from cache while offline'
});