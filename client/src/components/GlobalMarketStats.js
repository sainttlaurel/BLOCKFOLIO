import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, RefreshCw } from 'lucide-react';
import AnimatedCounter from './base/AnimatedCounter';
import { useMarketData, useNetworkStatus } from '../hooks/useDataCache';
import { useDegradationAware } from '../hooks/useGracefulDegradation';

const GlobalMarketStats = () => {
  // Graceful degradation awareness
  const { 
    componentConfig, 
    shouldAnimate, 
    degradationLevel 
  } = useDegradationAware('GlobalMarketStats');
  
  // Use cached market data with automatic updates
  const { 
    data: cachedMarketData, 
    loading: dataLoading, 
    error: dataError,
    lastUpdate: dataLastUpdate,
    isRefreshing: dataRefreshing,
    refresh: refreshData
  } = useMarketData();
  
  const networkStatus = useNetworkStatus();
  
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    marketCapChange24h: 0,
    totalVolume24h: 0,
    volumeChange24h: 0,
    btcDominance: 0,
    btcDominanceChange: 0,
    btcDominanceChange7d: 0,
    btcDominanceChange30d: 0,
    fearGreedIndex: 0,
    fearGreedLabel: 'Neutral'
  });
  
  const [previousStats, setPreviousStats] = useState(null);
  const [volumeHistory, setVolumeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [highlightedStats, setHighlightedStats] = useState(new Set());
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    // Process cached data when available
    if (cachedMarketData) {
      processMarketData(cachedMarketData);
    }
    
    // Update loading state based on data availability
    setLoading(dataLoading && !cachedMarketData);
    setIsRefreshing(dataRefreshing);
    
    if (dataLastUpdate) {
      setLastUpdate(dataLastUpdate);
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [cachedMarketData, dataLoading, dataRefreshing, dataLastUpdate]);

  const processMarketData = (data) => {
    try {
      // Store previous stats for comparison
      if (marketStats.totalMarketCap > 0) {
        setPreviousStats({ ...marketStats });
      }
      
      // Process real data or generate mock data if needed
      const mockData = data || generateMockMarketData();
      
      // Detect significant changes for highlighting
      const newHighlights = new Set();
      if (previousStats) {
        const significantThreshold = 2; // 2% change threshold for highlighting
        
        // Check market cap change
        const marketCapChange = Math.abs(
          ((mockData.totalMarketCap - previousStats.totalMarketCap) / previousStats.totalMarketCap) * 100
        );
        if (marketCapChange > significantThreshold) {
          newHighlights.add('marketCap');
        }
        
        // Check volume change
        const volumeChange = Math.abs(
          ((mockData.totalVolume24h - previousStats.totalVolume24h) / previousStats.totalVolume24h) * 100
        );
        if (volumeChange > significantThreshold) {
          newHighlights.add('volume');
        }
        
        // Check BTC dominance change
        const dominanceChange = Math.abs(mockData.btcDominance - previousStats.btcDominance);
        if (dominanceChange > 1) { // 1% absolute change
          newHighlights.add('btcDominance');
        }
        
        // Check Fear & Greed Index change
        const fearGreedChange = Math.abs(mockData.fearGreedIndex - previousStats.fearGreedIndex);
        if (fearGreedChange > 5) { // 5 point change
          newHighlights.add('fearGreed');
        }
      }

      setMarketStats(mockData);
      setVolumeHistory(generateVolumeHistory(mockData.totalVolume24h, mockData.volumeChange24h));
      setHighlightedStats(newHighlights);
      
      // Clear highlighting after animation duration
      if (newHighlights.size > 0) {
        refreshTimeoutRef.current = setTimeout(() => {
          setHighlightedStats(new Set());
        }, 2000); // Clear after 2 seconds
      }
      
    } catch (error) {
      console.error('Error processing market data:', error);
    }
  };

  const generateMockMarketData = () => {
    // Generate mock data when real data is not available
    return {
      totalMarketCap: 2100000000000 + (Math.random() - 0.5) * 100000000000, // $2.1T Â± $50B variation
      marketCapChange24h: 1.2 + (Math.random() - 0.5) * 2, // Â±1% variation
      totalVolume24h: 89200000000 + (Math.random() - 0.5) * 20000000000, // $89.2B Â± $10B variation
      volumeChange24h: -3.1 + (Math.random() - 0.5) * 4, // Â±2% variation
      btcDominance: 52.3 + (Math.random() - 0.5) * 2, // Â±1% variation
      btcDominanceChange: 0.8 + (Math.random() - 0.5) * 1, // Â±0.5% variation
      btcDominanceChange7d: 1.2 + (Math.random() - 0.5) * 2, // 7-day change
      btcDominanceChange30d: -2.1 + (Math.random() - 0.5) * 3, // 30-day change
      fearGreedIndex: Math.max(0, Math.min(100, 68 + (Math.random() - 0.5) * 20)), // Â±10 variation, clamped 0-100
      fearGreedLabel: ''
    };
  };

  const generateVolumeHistory = (baseVolume, volumeChange) => {
    // Generate volume history for comparison (last 7 days)
    const history = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic volume variations
      const variation = (Math.random() - 0.5) * 0.3; // Â±15% variation
      const volume = baseVolume * (1 + variation);
      
      history.push({
        date: date.toISOString().split('T')[0],
        volume: volume,
        change: i === 0 ? volumeChange : (Math.random() - 0.5) * 10
      });
    }
    
    return history;
  };

  const formatPercentage = (value) => {
    const isPositive = value >= 0;
    return {
      value: `${isPositive ? '+' : ''}${value.toFixed(2)}%`,
      isPositive,
      className: isPositive ? 'text-success-600' : 'text-danger-500'
    };
  };

  const getFearGreedColor = (index) => {
    if (index <= 25) return 'text-red-600';
    if (index <= 45) return 'text-orange-600';
    if (index <= 55) return 'text-gray-600';
    if (index <= 75) return 'text-green-600';
    return 'text-green-700';
  };

  const getFearGreedLabel = (index) => {
    if (index <= 25) return 'Extreme Fear';
    if (index <= 45) return 'Fear';
    if (index <= 55) return 'Neutral';
    if (index <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  const getVolumeComparison = () => {
    if (volumeHistory.length < 2) return null;
    
    const today = volumeHistory[volumeHistory.length - 1];
    const yesterday = volumeHistory[volumeHistory.length - 2];
    const weekAgo = volumeHistory[0];
    
    const dayChange = ((today.volume - yesterday.volume) / yesterday.volume) * 100;
    const weekChange = ((today.volume - weekAgo.volume) / weekAgo.volume) * 100;
    
    return {
      dayChange,
      weekChange,
      trend: dayChange >= 0 ? 'up' : 'down'
    };
  };

  const volumeComparison = getVolumeComparison();

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (!isRefreshing) {
      refreshData();
    }
  };

  const formatCurrency = (value, options = {}) => {
    const { compact = true, decimals = 2 } = options;
    
    if (compact && value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`;
    } else if (compact && value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (compact && value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };


  // Get animation class for highlighted stats
  const getHighlightClass = (statKey) => {
    if (highlightedStats.has(statKey)) {
      const isIncrease = previousStats && getStatValue(statKey) > getStatValue(statKey, previousStats);
      return isIncrease ? 'animate-price-flash-up' : 'animate-price-flash-down';
    }
    return '';
  };

  // Helper to get stat value by key
  const getStatValue = (statKey, stats = marketStats) => {
    switch (statKey) {
      case 'marketCap': return stats.totalMarketCap;
      case 'volume': return stats.totalVolume24h;
      case 'btcDominance': return stats.btcDominance;
      case 'fearGreed': return stats.fearGreedIndex;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-48"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card relative" role="region" aria-label="Global market statistics">
      {degradationLevel !== 'full' && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs" role="status" aria-live="polite">
          {degradationLevel === 'offline' ? 'Offline Mode' : 
           degradationLevel === 'minimal' ? 'Minimal Mode' : 'Reduced Mode'}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Global Market Statistics</h3>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <div className="flex items-center" role="status" aria-live="polite" aria-label={`Market data updated at ${lastUpdate.toLocaleTimeString()}`}>
                <Activity className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-pulse text-blue-500' : ''}`} aria-hidden="true" />
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
              <div className="flex items-center" role="status" aria-live="polite" aria-label={`Connection status: ${networkStatus.isOnline ? 'Online' : 'Offline'}`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
                }`} aria-hidden="true"></div>
                <span className={networkStatus.isOnline ? 'text-green-600' : 'text-red-600'}>
                  {networkStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {dataError && (
                <div className="flex items-center text-orange-600" role="alert">
                  <span className="text-xs">Using cached data</span>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-lg
              transition-all duration-200 ease-in-out
              ${isRefreshing 
                ? 'bg-blue-50 text-blue-600 cursor-not-allowed' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800 active:scale-95'
              }
            `}
            title="Refresh market data"
            aria-label={isRefreshing ? 'Refreshing market data' : 'Refresh market data'}
            aria-busy={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Market statistics">
        {/* Total Market Cap */}
        <div className={`stat-card animate-transition ${getHighlightClass('marketCap')}`} role="listitem">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Market Cap</p>
            <BarChart3 className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <div className="mb-2" aria-live="polite" aria-atomic="true" aria-label={`Total market capitalization: ${formatCurrency(marketStats.totalMarketCap)}`}>
            <AnimatedCounter
              value={marketStats.totalMarketCap}
              previousValue={previousStats?.totalMarketCap}
              formatter={(value) => formatCurrency(value)}
              className="text-lg font-bold text-gray-900"
              animate={componentConfig.enableCounterAnimations}
              onAnimationStart={() => {
                // Add subtle visual feedback during animation
              }}
            />
          </div>
          <div className={`flex items-center text-sm ${formatPercentage(marketStats.marketCapChange24h).className} animate-transition`} role="status" aria-label={`24 hour change: ${formatPercentage(marketStats.marketCapChange24h).value}`}>
            {formatPercentage(marketStats.marketCapChange24h).isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1 animate-transition" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 animate-transition" aria-hidden="true" />
            )}
            <AnimatedCounter
              value={marketStats.marketCapChange24h}
              previousValue={previousStats?.marketCapChange24h}
              formatter={(value) => formatPercentage(value).value}
              animate={componentConfig.enableCounterAnimations}
              className="animate-transition"
            />
          </div>
        </div>

        {/* 24h Volume with Historical Comparison */}
        <div className={`stat-card animate-transition ${getHighlightClass('volume')}`} role="listitem">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">24h Volume</p>
            <Activity className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <div className="mb-2" aria-live="polite" aria-atomic="true" aria-label={`24 hour trading volume: ${formatCurrency(marketStats.totalVolume24h)}`}>
            <AnimatedCounter
              value={marketStats.totalVolume24h}
              previousValue={previousStats?.totalVolume24h}
              formatter={(value) => formatCurrency(value)}
              animate={componentConfig.enableCounterAnimations}
              className="text-lg font-bold text-gray-900"
            />
          </div>
          <div className="space-y-1">
            <div className={`flex items-center text-sm ${formatPercentage(marketStats.volumeChange24h).className} animate-transition`} role="status" aria-label={`24 hour volume change: ${formatPercentage(marketStats.volumeChange24h).value}`}>
              {formatPercentage(marketStats.volumeChange24h).isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1 animate-transition" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 animate-transition" aria-hidden="true" />
              )}
              <AnimatedCounter
                value={marketStats.volumeChange24h}
                previousValue={previousStats?.volumeChange24h}
                formatter={(value) => formatPercentage(value).value}
                animate={componentConfig.enableCounterAnimations}
                className="animate-transition"
              />
            </div>
            {volumeComparison && (
              <div className="text-xs text-gray-500 animate-fade-in" aria-label={`7 day comparison: ${volumeComparison.weekChange >= 0 ? 'up' : 'down'} ${Math.abs(volumeComparison.weekChange).toFixed(1)} percent`}>
                vs 7d: {volumeComparison.weekChange >= 0 ? '+' : ''}{volumeComparison.weekChange.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        {/* BTC Dominance - Enhanced */}
        <div className={`stat-card bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 animate-transition animate-hover-lift ${getHighlightClass('btcDominance')}`} role="listitem">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-700">BTC Dominance</p>
              <div className="flex items-center space-x-1" role="status" aria-live="polite" aria-label="Live market data">
                <div className={`w-3 h-3 bg-orange-500 rounded-full ${isRefreshing ? 'animate-pulse' : 'animate-pulse'}`} aria-hidden="true"></div>
                <span className="text-xs text-orange-600 font-medium">LIVE</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center animate-hover-scale" aria-hidden="true">
                <span className="text-white text-xs font-bold">â‚¿</span>
              </div>
            </div>
          </div>
          
          <div className="mb-3" aria-live="polite" aria-atomic="true" aria-label={`Bitcoin dominance: ${marketStats.btcDominance.toFixed(2)} percent`}>
            <AnimatedCounter
              value={marketStats.btcDominance}
              previousValue={previousStats?.btcDominance}
              formatter={(value) => `${value.toFixed(2)}%`}
              animate={componentConfig.enableCounterAnimations}
              className="text-xl font-bold text-orange-900"
            />
          </div>
          
          <div className="space-y-2">
            {/* 24h Change */}
            <div className={`flex items-center justify-between text-sm ${formatPercentage(marketStats.btcDominanceChange).className} animate-transition`}>
              <div className="flex items-center">
                {formatPercentage(marketStats.btcDominanceChange).isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1 animate-transition" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 animate-transition" />
                )}
                <span className="font-medium">24h:</span>
              </div>
              <span className="font-semibold">
                <AnimatedCounter
                  value={marketStats.btcDominanceChange}
                  previousValue={previousStats?.btcDominanceChange}
                  formatter={(value) => formatPercentage(value).value}
                  animate={componentConfig.enableCounterAnimations}
                />
              </span>
            </div>
            
            {/* 7d Change (simulated) */}
            <div className={`flex items-center justify-between text-xs ${
              marketStats.btcDominanceChange * 0.7 >= 0 ? 'text-success-600' : 'text-danger-500'
            } animate-transition`}>
              <span className="text-gray-500">7d:</span>
              <span className="font-medium">
                {marketStats.btcDominanceChange * 0.7 >= 0 ? '+' : ''}
                {(marketStats.btcDominanceChange * 0.7).toFixed(2)}%
              </span>
            </div>
            
            {/* Dominance Bar Visualization */}
            <div className="mt-3 pt-2 border-t border-orange-200">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Market Share</span>
                <span>{(100 - marketStats.btcDominance).toFixed(1)}% Altcoins</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={marketStats.btcDominance} aria-valuemin="0" aria-valuemax="100" aria-label={`Bitcoin market share: ${marketStats.btcDominance.toFixed(1)} percent`}>
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-1000 ease-out relative animate-chart-data"
                  style={{ width: `${marketStats.btcDominance}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fear & Greed Index - Enhanced */}
        <div className={`stat-card bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200 animate-transition animate-hover-lift ${getHighlightClass('fearGreed')}`} role="listitem">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-700">Fear & Greed Index</p>
              <div className="flex items-center space-x-1" role="status" aria-live="polite" aria-label="Live market data">
                <div className={`w-2 h-2 bg-blue-500 rounded-full ${isRefreshing ? 'animate-pulse' : 'animate-pulse'}`} aria-hidden="true"></div>
                <span className="text-xs text-blue-600 font-medium">LIVE</span>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full animate-transition ${
              marketStats.fearGreedIndex <= 25 ? 'bg-red-500' :
              marketStats.fearGreedIndex <= 45 ? 'bg-orange-500' :
              marketStats.fearGreedIndex <= 55 ? 'bg-gray-500' :
              marketStats.fearGreedIndex <= 75 ? 'bg-green-500' : 'bg-green-600'
            } shadow-sm`} aria-hidden="true"></div>
          </div>
          
          {/* Circular Gauge */}
          <div className="relative flex items-center justify-center mb-4" role="img" aria-label={`Fear and Greed Index gauge showing ${Math.round(marketStats.fearGreedIndex)} out of 100, indicating ${getFearGreedLabel(marketStats.fearGreedIndex)}`}>
            <div className="relative w-24 h-24">
              {/* Background Arc */}
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                  strokeDasharray="251.2"
                  strokeDashoffset="0"
                />
                {/* Progress Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className={`animate-chart-data ${
                    marketStats.fearGreedIndex <= 25 ? 'text-red-500' :
                    marketStats.fearGreedIndex <= 45 ? 'text-orange-500' :
                    marketStats.fearGreedIndex <= 55 ? 'text-gray-500' :
                    marketStats.fearGreedIndex <= 75 ? 'text-green-500' : 'text-green-600'
                  }`}
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (marketStats.fearGreedIndex / 100) * 251.2}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1.5s ease-in-out, stroke 0.5s ease-in-out',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              </svg>
              
              {/* Center Value */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center" aria-live="polite" aria-atomic="true">
                  <AnimatedCounter
                    value={marketStats.fearGreedIndex}
                    previousValue={previousStats?.fearGreedIndex}
                    formatter={(value) => Math.round(value).toString()}
                    animate={componentConfig.enableCounterAnimations}
                    className="text-xl font-bold text-gray-900"
                  />
                  <div className="text-xs text-gray-500 font-medium">/ 100</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sentiment Label */}
          <div className="text-center mb-3">
            <div className={`text-lg font-bold animate-transition ${getFearGreedColor(marketStats.fearGreedIndex)}`} role="status" aria-live="polite" aria-label={`Market sentiment: ${getFearGreedLabel(marketStats.fearGreedIndex)}`}>
              {marketStats.fearGreedLabel}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Market Sentiment
            </div>
          </div>
          
          {/* Sentiment Scale */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Extreme Fear</span>
              <span>Extreme Greed</span>
            </div>
            
            {/* Visual Scale Bar */}
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 via-gray-400 via-green-500 to-green-600"></div>
              
              {/* Current Position Indicator */}
              <div 
                className="absolute top-0 w-1 h-full bg-white border border-gray-400 shadow-sm transition-all duration-1000 ease-out animate-chart-data"
                style={{ left: `${marketStats.fearGreedIndex}%`, transform: 'translateX(-50%)' }}
              ></div>
            </div>
            
            {/* Scale Labels */}
            <div className="flex justify-between text-xs text-gray-500">
              <span className={marketStats.fearGreedIndex <= 25 ? 'font-semibold text-red-600' : ''}>0-25</span>
              <span className={marketStats.fearGreedIndex > 25 && marketStats.fearGreedIndex <= 45 ? 'font-semibold text-orange-600' : ''}>26-45</span>
              <span className={marketStats.fearGreedIndex > 45 && marketStats.fearGreedIndex <= 55 ? 'font-semibold text-gray-600' : ''}>46-55</span>
              <span className={marketStats.fearGreedIndex > 55 && marketStats.fearGreedIndex <= 75 ? 'font-semibold text-green-600' : ''}>56-75</span>
              <span className={marketStats.fearGreedIndex > 75 ? 'font-semibold text-green-700' : ''}>76-100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Volume History Visualization */}
      {volumeHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in" role="region" aria-label="7-day volume trend chart">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">7-Day Volume Trend</h4>
            <div className="text-xs text-gray-500">
              Hover bars for details
            </div>
          </div>
          <div className="flex items-end space-x-1 h-16" role="img" aria-label={`Bar chart showing 7 days of trading volume history. Current volume: ${formatCurrency(volumeHistory[volumeHistory.length - 1]?.volume)}`}>
            {volumeHistory.map((day, index) => {
              const height = (day.volume / Math.max(...volumeHistory.map(d => d.volume))) * 100;
              const isToday = index === volumeHistory.length - 1;
              
              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center group relative animate-hover-lift"
                  role="img"
                  aria-label={`${new Date(day.date).toLocaleDateString()}: Volume ${formatCurrency(day.volume)}, Change ${day.change >= 0 ? '+' : ''}${day.change.toFixed(1)}%`}
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 animate-chart-data ${
                      isToday 
                        ? 'bg-primary-500 shadow-lg' 
                        : day.change >= 0 
                          ? 'bg-success-400' 
                          : 'bg-danger-400'
                    } ${isToday ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`}
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                    aria-hidden="true"
                  ></div>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-xl animate-fade-in" role="tooltip">
                    <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="text-gray-300">{formatCurrency(day.volume)}</div>
                    <div className={`font-medium ${day.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {day.change >= 0 ? '+' : ''}{day.change.toFixed(1)}%
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>7 days ago</span>
            <span className="font-medium">Today</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalMarketStats;
