import React, { useState, useEffect, useRef, Suspense } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, Filter, X, ChevronRight, Maximize2 } from 'lucide-react';
import { createLazyComponent, useRenderTime } from '../utils/performanceOptimization';
import { usePrices, usePortfolio, useNetworkStatus } from '../hooks/useDataCache';
import SwipeableMarketCards from './SwipeableMarketCards';
import '../styles/market-movement-animations.css';

// Lazy load heavy components for better performance
const PortfolioChartContainer = createLazyComponent(
  () => import('./PortfolioChartContainer'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const PortfolioAnalytics = createLazyComponent(
  () => import('./PortfolioAnalytics'),
  <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
);

const PortfolioAllocationChart = createLazyComponent(
  () => import('./PortfolioAllocationChart'),
  <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
);

const GlobalMarketStats = createLazyComponent(
  () => import('./GlobalMarketStats'),
  <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
);

const CryptocurrencyTable = createLazyComponent(
  () => import('./CryptocurrencyTable'),
  <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
);

const InteractivePriceChart = createLazyComponent(
  () => import('./InteractivePriceChart'),
  <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
);

const TechnicalIndicatorChart = createLazyComponent(
  () => import('./TechnicalIndicatorChart'),
  <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
);

// Cache Status Indicator component
const CacheStatusIndicator = ({ className }) => {
  const networkStatus = useNetworkStatus();
  
  if (networkStatus.isOnline) return null;
  
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm ${className}`}>
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
      <span>Using cached data (offline)</span>
    </div>
  );
};

const MarketSection = () => {
  // Track component render performance
  useRenderTime('MarketSection');
  
  // Use cached data with automatic updates
  const { 
    data: prices = {}, 
    loading: pricesLoading, 
    error: pricesError,
    lastUpdate: pricesLastUpdate,
    refresh: refreshPrices 
  } = usePrices();
  
  const { 
    data: portfolioData, 
    loading: portfolioLoading, 
    refresh: refreshPortfolio 
  } = usePortfolio();
  
  const networkStatus = useNetworkStatus();
  
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [previousPrices, setPreviousPrices] = useState({});
  const [animatingCoins, setAnimatingCoins] = useState(new Set());
  const animationTimeouts = useRef(new Map());
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    marketCap: { min: '', max: '' },
    volume: { min: '', max: '' },
    priceChange: { min: '', max: '' }
  });

  // View All states
  const [expandedSections, setExpandedSections] = useState({
    gainers: false,
    losers: false,
    volume: false
  });

  // Interactive Price Chart states
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [chartTimeframe, setChartTimeframe] = useState('1D');
  const [showPriceChart, setShowPriceChart] = useState(true);
  useEffect(() => {
    // Update loading state based on data availability
    setLoading(pricesLoading && portfolioLoading);
    
    // Update last update time
    if (pricesLastUpdate) {
      setLastUpdate(pricesLastUpdate);
    }
    
    // Handle price changes for animations
    if (prices && Object.keys(prices).length > 0) {
      handlePriceChanges(prices);
    }
    
    return () => {
      // Clear any pending animation timeouts
      animationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [prices, pricesLoading, portfolioLoading, pricesLastUpdate]);

  const handlePriceChanges = (newPrices) => {
    if (Object.keys(previousPrices).length === 0) {
      setPreviousPrices(newPrices);
      return;
    }

    const newAnimatingCoins = new Set();
    
    Object.keys(newPrices).forEach(coinId => {
      const currentPrice = newPrices[coinId]?.usd;
      const previousPrice = previousPrices[coinId]?.usd;
      
      if (isSignificantChange(currentPrice, previousPrice)) {
        newAnimatingCoins.add(coinId);
        
        // Clear existing timeout for this coin
        if (animationTimeouts.current.has(coinId)) {
          clearTimeout(animationTimeouts.current.get(coinId));
        }
        
        // Set timeout to remove animation
        const timeout = setTimeout(() => {
          setAnimatingCoins(prev => {
            const updated = new Set(prev);
            updated.delete(coinId);
            return updated;
          });
          animationTimeouts.current.delete(coinId);
        }, 2000);
        
        animationTimeouts.current.set(coinId, timeout);
      }
    });
    
    if (newAnimatingCoins.size > 0) {
      setAnimatingCoins(prev => new Set([...prev, ...newAnimatingCoins]));
    }
    
    setPreviousPrices(newPrices);
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    refreshPrices();
    refreshPortfolio();
  };

  // Animation helper functions
  const isSignificantChange = (current, previous, type = 'price') => {
    if (!previous || !current) return false;
    
    const changePercent = Math.abs((current - previous) / previous * 100);
    
    switch (type) {
      case 'price':
        return changePercent >= 5; // 5% price change threshold
      case 'volume':
        return changePercent >= 20; // 20% volume change threshold
      case 'marketCap':
        return changePercent >= 10; // 10% market cap change threshold
      default:
        return false;
    }
  };

  const triggerAnimation = (coinId, changeType, isPositive) => {
    setAnimatingCoins(prev => new Set([...prev, `${coinId}-${changeType}`]));
    
    // Clear existing timeout for this coin/type combination
    const timeoutKey = `${coinId}-${changeType}`;
    if (animationTimeouts.current.has(timeoutKey)) {
      clearTimeout(animationTimeouts.current.get(timeoutKey));
    }
    
    // Set new timeout to remove animation class
    const timeout = setTimeout(() => {
      setAnimatingCoins(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${coinId}-${changeType}`);
        return newSet;
      });
      animationTimeouts.current.delete(timeoutKey);
    }, 2000); // Animation duration
    
    animationTimeouts.current.set(timeoutKey, timeout);
  };

  const checkForSignificantMovements = (newPrices, oldPrices) => {
    Object.entries(newPrices).forEach(([coinId, newData]) => {
      const oldData = oldPrices[coinId];
      if (!oldData) return;

      // Check price changes
      if (isSignificantChange(newData.usd, oldData.usd, 'price')) {
        const isPositive = newData.usd > oldData.usd;
        triggerAnimation(coinId, 'price', isPositive);
      }

      // Check volume changes
      if (newData.usd_24h_vol && oldData.usd_24h_vol && 
          isSignificantChange(newData.usd_24h_vol, oldData.usd_24h_vol, 'volume')) {
        const isPositive = newData.usd_24h_vol > oldData.usd_24h_vol;
        triggerAnimation(coinId, 'volume', isPositive);
      }

      // Check market cap changes
      if (newData.usd_market_cap && oldData.usd_market_cap && 
          isSignificantChange(newData.usd_market_cap, oldData.usd_market_cap, 'marketCap')) {
        const isPositive = newData.usd_market_cap > oldData.usd_market_cap;
        triggerAnimation(coinId, 'marketCap', isPositive);
      }
    });
  };

  const coinDisplayNames = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    solana: 'SOL',
    cardano: 'ADA',
    polkadot: 'DOT',
    chainlink: 'LINK',
    litecoin: 'LTC',
    stellar: 'XLM'
  };

  // Portfolio chart data - removed old chart implementation

  // Get comprehensive top movers data
  const topMoversData = Object.entries(prices || {})
    .map(([coinId, data]) => ({
      id: coinId,
      name: coinDisplayNames[coinId] || coinId.toUpperCase(),
      fullName: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      price: data.usd,
      change24h: data.usd_24h_change || 0,
      volume24h: data.usd_24h_vol || 0,
      marketCap: data.usd_market_cap || 0,
      priceChange1h: data.usd_1h_change || 0,
      priceChange7d: data.usd_7d_change || 0
    }))
    .filter(coin => coin.volume24h > 0); // Only include coins with volume data

  // Apply filters to the data
  const applyFilters = (data) => {
    return data.filter(coin => {
      // Market cap filter (in millions)
      const marketCapMillion = coin.marketCap / 1000000;
      if (filters.marketCap.min && marketCapMillion < parseFloat(filters.marketCap.min)) return false;
      if (filters.marketCap.max && marketCapMillion > parseFloat(filters.marketCap.max)) return false;
      
      // Volume filter (in millions)
      const volumeMillion = coin.volume24h / 1000000;
      if (filters.volume.min && volumeMillion < parseFloat(filters.volume.min)) return false;
      if (filters.volume.max && volumeMillion > parseFloat(filters.volume.max)) return false;
      
      // Price change filter (percentage)
      if (filters.priceChange.min && coin.change24h < parseFloat(filters.priceChange.min)) return false;
      if (filters.priceChange.max && coin.change24h > parseFloat(filters.priceChange.max)) return false;
      
      return true;
    });
  };

  const filteredData = applyFilters(topMoversData).sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));

  // Separate gainers and losers from filtered data
  const topGainers = filteredData
    .filter(coin => coin.change24h > 0)
    .slice(0, expandedSections.gainers ? 20 : 5);
  
  const topLosers = filteredData
    .filter(coin => coin.change24h < 0)
    .slice(0, expandedSections.losers ? 20 : 5);

  // Get highest volume movers from filtered data
  const highestVolume = filteredData
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, expandedSections.volume ? 20 : 5);

  // Filter management functions
  const updateFilter = (category, type, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      marketCap: { min: '', max: '' },
      volume: { min: '', max: '' },
      priceChange: { min: '', max: '' }
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(filter => 
      Object.values(filter).some(value => value !== '')
    );
  };

  // Get animation classes for a coin
  const getAnimationClasses = (coinId) => {
    const classes = [];
    
    if (animatingCoins.has(`${coinId}-price`)) {
      const currentPrice = prices[coinId]?.usd;
      const previousPrice = previousPrices[coinId]?.usd;
      if (currentPrice && previousPrice) {
        classes.push(currentPrice > previousPrice ? 'animate-price-flash-up' : 'animate-price-flash-down');
      }
    }
    
    if (animatingCoins.has(`${coinId}-volume`)) {
      classes.push('animate-data-refresh');
    }
    
    if (animatingCoins.has(`${coinId}-marketCap`)) {
      classes.push('animate-market-cap-change');
    }
    
    return classes.join(' ');
  };

  // Get movement indicator for significant changes
  const getMovementIndicator = (coinId) => {
    const hasSignificantMovement = 
      animatingCoins.has(`${coinId}-price`) || 
      animatingCoins.has(`${coinId}-volume`) || 
      animatingCoins.has(`${coinId}-marketCap`);
    
    if (!hasSignificantMovement) return null;
    
    const currentPrice = prices[coinId]?.usd;
    const previousPrice = previousPrices[coinId]?.usd;
    const isPositive = currentPrice && previousPrice && currentPrice > previousPrice;
    
    return (
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-live-pulse ${
        isPositive ? 'bg-success-500 movement-indicator-up' : 'bg-danger-500 movement-indicator-down'
      }`} />
    );
  };

  // Get volume bar animation class
  const getVolumeBarAnimation = (coinId) => {
    if (animatingCoins.has(`${coinId}-volume`)) {
      return 'animate-volume-bar-significant';
    }
    return 'animate-volume-bar';
  };

  // Toggle expanded view for sections
  const toggleExpandedSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get available data counts for each section
  const getAvailableCounts = () => {
    const gainersCount = filteredData.filter(coin => coin.change24h > 0).length;
    const losersCount = filteredData.filter(coin => coin.change24h < 0).length;
    const volumeCount = filteredData.length;
    
    return { gainersCount, losersCount, volumeCount };
  };

  const { gainersCount, losersCount, volumeCount } = getAvailableCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cache Status Indicator */}
      <CacheStatusIndicator className="mb-4" />
      
      {/* Portfolio Performance Chart - Enhanced Version */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <PortfolioChartContainer 
          portfolioValue={parseFloat(portfolioData?.totalValue || 0)}
          portfolioHoldings={portfolioData?.holdings || []}
        />
      </Suspense>

      {/* Portfolio Analytics */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg" />}>
        <PortfolioAnalytics 
          holdings={portfolioData?.holdings || []}
          totalPortfolioValue={parseFloat(portfolioData?.totalValue || 0)}
        />
      </Suspense>

      {/* Portfolio Allocation Chart */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg" />}>
        <PortfolioAllocationChart 
          holdings={portfolioData?.holdings || []}
          totalPortfolioValue={parseFloat(portfolioData?.totalValue || 0)}
          size="md"
        />
      </Suspense>

      {/* Global Market Statistics */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-24 rounded-lg" />}>
        <GlobalMarketStats />
      </Suspense>

      {/* Swipeable Market Cards for Mobile */}
      <SwipeableMarketCards 
        coins={topMoversData}
        onCoinSelect={(coinId) => setSelectedCoin(coinId)}
        className="mb-6 md:hidden"
      />

      {/* Comprehensive Top Movers Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Market Movers</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters || hasActiveFilters() 
                  ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
              {hasActiveFilters() && (
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              )}
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BarChart3 className="h-4 w-4" />
              <span>24h Analysis</span>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700">Filter Options</h4>
              <div className="flex items-center space-x-2">
                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Market Cap Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Market Cap (Millions)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.marketCap.min}
                    onChange={(e) => updateFilter('marketCap', 'min', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.marketCap.max}
                    onChange={(e) => updateFilter('marketCap', 'max', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Volume Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  24h Volume (Millions)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.volume.min}
                    onChange={(e) => updateFilter('volume', 'min', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.volume.max}
                    onChange={(e) => updateFilter('volume', 'max', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Price Change Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  24h Change (%)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceChange.min}
                    onChange={(e) => updateFilter('priceChange', 'min', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceChange.max}
                    onChange={(e) => updateFilter('priceChange', 'max', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter Results Summary */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing {filteredData.length} of {topMoversData.length} cryptocurrencies
                </span>
                {hasActiveFilters() && (
                  <span className="text-primary-600 font-medium">
                    Filters active
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Gainers Section */}
        {topGainers.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800 flex items-center">
                <TrendingUp className="h-5 w-5 text-success-600 mr-2" />
                Top Gainers
                <span className="ml-2 text-sm text-gray-500">
                  ({topGainers.length} of {gainersCount})
                </span>
              </h4>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">24h Change</span>
                {gainersCount > 5 && (
                  <button
                    onClick={() => toggleExpandedSection('gainers')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>{expandedSections.gainers ? 'Show Less' : 'View All'}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedSections.gainers ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`space-y-3 transition-all duration-300 ${expandedSections.gainers ? 'max-h-none' : 'max-h-96 overflow-hidden'}`}>
              {topGainers.map((coin, index) => {
                const animationClasses = getAnimationClasses(coin.id);
                const movementIndicator = getMovementIndicator(coin.id);
                
                return (
                  <div 
                    key={coin.id} 
                    className={`relative flex items-center justify-between p-4 bg-gradient-to-r from-success-50 to-transparent rounded-lg hover:from-success-100 transition-all duration-200 cursor-pointer group ${animationClasses}`}
                  >
                    {movementIndicator}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-success-100 text-success-700 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-success-700 transition-colors">
                          {coin.name}
                        </div>
                        <div className="text-sm text-gray-500">{coin.fullName}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ${coin.price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: coin.price < 1 ? 6 : 2 
                        })}
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <div className="text-sm font-semibold text-success-600">
                          +{coin.change24h.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Vol: ${(coin.volume24h / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      {/* Additional data for expanded view */}
                      {expandedSections.gainers && (
                        <div className="flex items-center justify-end space-x-2 mt-1">
                          <div className="text-xs text-gray-400">
                            MCap: ${(coin.marketCap / 1000000).toFixed(0)}M
                          </div>
                          {coin.priceChange7d !== 0 && (
                            <div className={`text-xs ${coin.priceChange7d > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              7d: {coin.priceChange7d > 0 ? '+' : ''}{coin.priceChange7d.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800 flex items-center">
                <TrendingUp className="h-5 w-5 text-success-600 mr-2" />
                Top Gainers
              </h4>
              <span className="text-sm text-gray-500">24h Change</span>
            </div>
            <div className="p-8 text-center text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No gainers match your current filters</p>
            </div>
          </div>
        )}

        {/* Top Losers Section */}
        {topLosers.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800 flex items-center">
                <TrendingDown className="h-5 w-5 text-danger-500 mr-2" />
                Top Losers
                <span className="ml-2 text-sm text-gray-500">
                  ({topLosers.length} of {losersCount})
                </span>
              </h4>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">24h Change</span>
                {losersCount > 5 && (
                  <button
                    onClick={() => toggleExpandedSection('losers')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>{expandedSections.losers ? 'Show Less' : 'View All'}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedSections.losers ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`space-y-3 transition-all duration-300 ${expandedSections.losers ? 'max-h-none' : 'max-h-96 overflow-hidden'}`}>
              {topLosers.map((coin, index) => {
                const animationClasses = getAnimationClasses(coin.id);
                const movementIndicator = getMovementIndicator(coin.id);
                
                return (
                  <div 
                    key={coin.id} 
                    className={`relative flex items-center justify-between p-4 bg-gradient-to-r from-danger-50 to-transparent rounded-lg hover:from-danger-100 transition-all duration-200 cursor-pointer group ${animationClasses}`}
                  >
                    {movementIndicator}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-danger-100 text-danger-700 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-danger-600 transition-colors">
                          {coin.name}
                        </div>
                        <div className="text-sm text-gray-500">{coin.fullName}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        ${coin.price.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: coin.price < 1 ? 6 : 2 
                        })}
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <div className="text-sm font-semibold text-danger-500">
                          {coin.change24h.toFixed(2)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Vol: ${(coin.volume24h / 1000000).toFixed(1)}M
                        </div>
                      </div>
                      {/* Additional data for expanded view */}
                      {expandedSections.losers && (
                        <div className="flex items-center justify-end space-x-2 mt-1">
                          <div className="text-xs text-gray-400">
                            MCap: ${(coin.marketCap / 1000000).toFixed(0)}M
                          </div>
                          {coin.priceChange7d !== 0 && (
                            <div className={`text-xs ${coin.priceChange7d > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              7d: {coin.priceChange7d > 0 ? '+' : ''}{coin.priceChange7d.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800 flex items-center">
                <TrendingDown className="h-5 w-5 text-danger-500 mr-2" />
                Top Losers
              </h4>
              <span className="text-sm text-gray-500">24h Change</span>
            </div>
            <div className="p-8 text-center text-gray-500">
              <TrendingDown className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No losers match your current filters</p>
            </div>
          </div>
        )}

        {/* Highest Volume Section */}
        {highestVolume.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800 flex items-center">
                <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                Highest Volume
                <span className="ml-2 text-sm text-gray-500">
                  ({highestVolume.length} of {volumeCount})
                </span>
              </h4>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">24h Volume</span>
                {volumeCount > 5 && (
                  <button
                    onClick={() => toggleExpandedSection('volume')}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>{expandedSections.volume ? 'Show Less' : 'View All'}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedSections.volume ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            
            <div className={`space-y-3 transition-all duration-300 ${expandedSections.volume ? 'max-h-none' : 'max-h-96 overflow-hidden'}`}>
              {highestVolume.map((coin, index) => {
                const isPositive = coin.change24h >= 0;
                const maxVolume = Math.max(...highestVolume.map(c => c.volume24h));
                const volumePercentage = (coin.volume24h / maxVolume) * 100;
                const animationClasses = getAnimationClasses(coin.id);
                const movementIndicator = getMovementIndicator(coin.id);
                
                return (
                  <div 
                    key={coin.id} 
                    className={`relative flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group ${animationClasses}`}
                  >
                    {movementIndicator}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                          {coin.name}
                        </div>
                        <div className="text-sm text-gray-500">{coin.fullName}</div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-1 max-w-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-gray-900">
                          ${coin.price.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: coin.price < 1 ? 6 : 2 
                          })}
                        </div>
                        <div className={`text-sm font-semibold ${isPositive ? 'text-success-600' : 'text-danger-500'}`}>
                          {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                        </div>
                      </div>
                      
                      {/* Volume Bar Visualization */}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`bg-primary-500 h-2 rounded-full transition-all duration-500 ${getVolumeBarAnimation(coin.id)}`}
                            style={{ width: `${volumePercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 min-w-0">
                          ${(coin.volume24h / 1000000).toFixed(1)}M
                        </div>
                      </div>

                      {/* Additional data for expanded view */}
                      {expandedSections.volume && (
                        <div className="flex items-center justify-end space-x-2 mt-2">
                          <div className="text-xs text-gray-400">
                            MCap: ${(coin.marketCap / 1000000).toFixed(0)}M
                          </div>
                          {coin.priceChange7d !== 0 && (
                            <div className={`text-xs ${coin.priceChange7d > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              7d: {coin.priceChange7d > 0 ? '+' : ''}{coin.priceChange7d.toFixed(1)}%
                            </div>
                          )}
                          {coin.priceChange1h !== 0 && (
                            <div className={`text-xs ${coin.priceChange1h > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                              1h: {coin.priceChange1h > 0 ? '+' : ''}{coin.priceChange1h.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-800 flex items-center">
                <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                Highest Volume
              </h4>
              <span className="text-sm text-gray-500">24h Volume</span>
            </div>
            <div className="p-8 text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No high volume cryptocurrencies match your current filters</p>
            </div>
          </div>
        )}

        {/* Market Summary Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Last updated: {lastUpdate?.toLocaleTimeString()}</span>
              <button
                onClick={handleManualRefresh}
                className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Refresh market data"
              >
                <RefreshCw className={`h-4 w-4 ${pricesLoading ? 'animate-spin' : ''}`} />
                <span className="text-xs">Refresh</span>
              </button>
              {!networkStatus.isOnline && (
                <span className="text-orange-600 text-xs">Using cached data (offline)</span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span>Total Volume: ${Object.values(prices).reduce((sum, coin) => sum + (coin.usd_24h_vol || 0), 0) / 1000000000 > 1 ? 
                (Object.values(prices).reduce((sum, coin) => sum + (coin.usd_24h_vol || 0), 0) / 1000000000).toFixed(1) + 'B' :
                (Object.values(prices).reduce((sum, coin) => sum + (coin.usd_24h_vol || 0), 0) / 1000000).toFixed(0) + 'M'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Cryptocurrency Table */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <CryptocurrencyTable
          coins={Object.entries(prices).map(([coinId, data], index) => ({
            id: coinId,
            name: coinDisplayNames[coinId] || coinId.charAt(0).toUpperCase() + coinId.slice(1),
            symbol: coinDisplayNames[coinId] || coinId.toUpperCase()
          }))}
          prices={prices}
          wallet={portfolioData}
          showHoldings={true}
          className="professional-crypto-table"
          onCoinSelect={(coinId) => setSelectedCoin(coinId)}
        />
      </Suspense>

      {/* Interactive Price Chart Section */}
      {showPriceChart && (
        <div className="space-y-4">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
            <InteractivePriceChart
              symbol={selectedCoin.toUpperCase()}
              timeframe={chartTimeframe}
              onTimeframeChange={setChartTimeframe}
              height={500}
              className="mb-4"
            />
          </Suspense>
          
          {/* Technical Indicators Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg" />}>
              <TechnicalIndicatorChart
                symbol={selectedCoin}
                timeframe={chartTimeframe}
                indicator="RSI"
                height={200}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              />
            </Suspense>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg" />}>
              <TechnicalIndicatorChart
                symbol={selectedCoin}
                timeframe={chartTimeframe}
                indicator="MACD"
                height={200}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              />
            </Suspense>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded-lg" />}>
              <TechnicalIndicatorChart
                symbol={selectedCoin}
                timeframe={chartTimeframe}
                indicator="BOLLINGER"
                height={200}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketSection;