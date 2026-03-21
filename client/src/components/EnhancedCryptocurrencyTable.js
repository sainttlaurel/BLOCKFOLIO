import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  BarChart3,
  Eye,
  Star,
  StarOff,
  Filter,
  Search,
  Settings,
  Grid,
  List
} from 'lucide-react';
import VirtualScrollTable from './base/VirtualScrollTable';
import Pagination from './base/Pagination';
import IncrementalLoader, { useIncrementalLoader } from './base/IncrementalLoader';
import Sparkline from './base/Sparkline';
import AdvancedSearch from './base/AdvancedSearch';
import SearchHighlight from './base/SearchHighlight';
import SkeletonScreen from './base/SkeletonScreen';
import { usePrices, useNetworkStatus } from '../hooks/useDataCache';

/**
 * EnhancedCryptocurrencyTable - High-performance table with progressive loading
 * Supports virtual scrolling, pagination, and incremental loading for large datasets
 * Requirements: 11.4 - Progressive loading for large datasets
 */
const EnhancedCryptocurrencyTable = ({ 
  coins = [], 
  onCoinSelect, 
  selectedCoin = null,
  showHoldings = false,
  wallet = null,
  className = "",
  loadingMode = 'virtual', // 'virtual' | 'pagination' | 'infinite'
  pageSize = 50,
  virtualHeight = 600,
  enableSearch = true,
  enableFilters = true,
  enableSorting = true,
  enableFavorites = true
}) => {
  // Use cached price data
  const { 
    data: prices = {}, 
    loading: pricesLoading, 
    error: pricesError,
    lastUpdate: pricesLastUpdate 
  } = usePrices();
  
  const networkStatus = useNetworkStatus();
  
  // State management
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(pageSize);
  const [viewMode, setViewMode] = useState(loadingMode);
  const [filters, setFilters] = useState({
    minMarketCap: null,
    maxMarketCap: null,
    minPrice: null,
    maxPrice: null,
    minVolume: null,
    maxVolume: null
  });

  // Coin mapping for price data
  const coinMap = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum', 
    'SOL': 'solana',
    'ADA': 'cardano',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
    'LTC': 'litecoin',
    'XLM': 'stellar'
  };

  // Enhanced coin data with market metrics
  const enhancedCoins = useMemo(() => {
    return coins.map((coin, index) => {
      const coinId = coinMap[coin.symbol];
      const priceData = prices[coinId] || {};
      const holdings = wallet?.holdings?.find(h => h.symbol === coin.symbol);
      
      return {
        ...coin,
        rank: index + 1,
        price: priceData.usd || 0,
        change1h: priceData.usd_1h_change || 0,
        change24h: priceData.usd_24h_change || 0,
        change7d: priceData.usd_7d_change || 0,
        volume24h: priceData.usd_24h_vol || 0,
        marketCap: priceData.usd_market_cap || 0,
        holdings: holdings ? parseFloat(holdings.amount) : 0,
        holdingsValue: holdings ? parseFloat(holdings.amount) * (priceData.usd || 0) : 0,
        // Generate mock sparkline data
        sparklineData: Array.from({ length: 24 }, (_, i) => {
          const basePrice = priceData.usd || 100;
          const volatility = 0.02;
          return basePrice * (1 + (Math.random() - 0.5) * volatility);
        })
      };
    });
  }, [coins, prices, wallet, coinMap]);

  // Filter and sort coins
  const processedCoins = useMemo(() => {
    let filtered = enhancedCoins;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(coin => favorites.has(coin.symbol));
    }

    // Apply numeric filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null) {
        const field = key.replace('min', '').replace('max', '').toLowerCase();
        const fieldMap = {
          marketcap: 'marketCap',
          price: 'price',
          volume: 'volume24h'
        };
        const actualField = fieldMap[field] || field;
        
        if (key.startsWith('min')) {
          filtered = filtered.filter(coin => coin[actualField] >= value);
        } else if (key.startsWith('max')) {
          filtered = filtered.filter(coin => coin[actualField] <= value);
        }
      }
    });

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [enhancedCoins, searchTerm, showFavoritesOnly, favorites, sortConfig, filters]);

  // Paginated data for pagination mode
  const paginatedCoins = useMemo(() => {
    if (viewMode !== 'pagination') return processedCoins;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return processedCoins.slice(startIndex, endIndex);
  }, [processedCoins, currentPage, itemsPerPage, viewMode]);

  // Incremental loader for infinite scroll
  const {
    data: infiniteData,
    loading: infiniteLoading,
    hasMore,
    loadMore,
    reset: resetInfinite
  } = useIncrementalLoader({
    fetchData: useCallback(async (page, batchSize) => {
      // Simulate API call with processed coins
      const startIndex = page * batchSize;
      const endIndex = startIndex + batchSize;
      const batch = processedCoins.slice(startIndex, endIndex);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return batch;
    }, [processedCoins]),
    batchSize: 20
  });

  // Reset infinite loader when data changes
  useEffect(() => {
    if (viewMode === 'infinite') {
      resetInfinite();
    }
  }, [processedCoins, viewMode, resetInfinite]);

  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'rank',
      title: '#',
      width: '16',
      sortable: true,
      render: (value, coin) => (
        <div className="flex items-center space-x-2">
          {enableFavorites && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(coin.symbol);
              }}
              className="text-gray-400 hover:text-yellow-500 transition-colors"
            >
              {favorites.has(coin.symbol) ? (
                <Star className="h-4 w-4 fill-current text-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4" />
              )}
            </button>
          )}
          <span className="text-sm font-medium text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value, coin) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-700">
                {coin.symbol.substring(0, 2)}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-semibold text-gray-900">
              <SearchHighlight text={coin.name} searchTerm={searchTerm} />
            </div>
            <div className="text-xs text-gray-500 font-medium">
              <SearchHighlight text={coin.symbol} searchTerm={searchTerm} />
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      title: 'Price',
      align: 'right',
      sortable: true,
      render: (value) => (
        <div className="text-sm font-semibold text-gray-900">
          ${value.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: value < 1 ? 6 : 2 
          })}
        </div>
      )
    },
    {
      key: 'change24h',
      title: '24h %',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span className={`flex items-center justify-end font-medium ${
          value >= 0 ? 'text-success-600' : 'text-danger-500'
        }`}>
          {value >= 0 ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      )
    },
    {
      key: 'volume24h',
      title: '24h Volume',
      align: 'right',
      sortable: true,
      render: (value, coin, index, allCoins) => {
        const maxVolume = Math.max(...allCoins.map(c => c.volume24h));
        const percentage = (value / maxVolume) * 100;
        
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatLargeNumber(value)}
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'marketCap',
      title: 'Market Cap',
      align: 'right',
      sortable: true,
      render: (value, coin, index, allCoins) => {
        const maxMarketCap = Math.max(...allCoins.map(c => c.marketCap));
        const percentage = (value / maxMarketCap) * 100;
        
        return (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {formatLargeNumber(value)}
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-brand-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'sparklineData',
      title: '7d Chart',
      align: 'center',
      render: (value, coin) => (
        <div className="w-20 h-8">
          <Sparkline 
            data={value}
            color={coin.change7d >= 0 ? '#16a34a' : '#dc2626'}
            width={80}
            height={32}
          />
        </div>
      )
    }
  ], [favorites, enableFavorites, searchTerm]);

  // Add holdings column if enabled
  if (showHoldings) {
    columns.splice(-1, 0, {
      key: 'holdingsValue',
      title: 'Holdings',
      align: 'right',
      sortable: true,
      render: (value, coin) => (
        coin.holdings > 0 ? (
          <div>
            <div className="text-sm font-medium text-gray-900">
              ${formatLargeNumber(value)}
            </div>
            <div className="text-xs text-gray-500">
              {coin.holdings.toFixed(6)} {coin.symbol}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )
      )
    });
  }

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Handle favorites
  const toggleFavorite = useCallback((symbol) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  }, []);

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Handle row click
  const handleRowClick = useCallback((coin) => {
    onCoinSelect?.(coin);
  }, [onCoinSelect]);

  // Render controls
  const renderControls = () => (
    <div className="p-6 border-b border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Cryptocurrency Market</h2>
        <div className="flex items-center space-x-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {['virtual', 'pagination', 'infinite'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode 
                    ? 'bg-white text-primary-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode === 'virtual' && <Grid className="h-4 w-4" />}
                {mode === 'pagination' && <List className="h-4 w-4" />}
                {mode === 'infinite' && <ArrowDown className="h-4 w-4" />}
              </button>
            ))}
          </div>

          {enableFavorites && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFavoritesOnly 
                  ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">Favorites</span>
            </button>
          )}

          <div className="text-sm text-gray-500">
            {processedCoins.length} of {enhancedCoins.length} coins
          </div>
        </div>
      </div>

      {enableSearch && (
        <AdvancedSearch
          data={enhancedCoins}
          onResults={(results, searchConfig) => {
            if (results.length > 0) {
              onCoinSelect?.(results[0]);
            }
            setSearchTerm(searchConfig.query);
          }}
          placeholder="Search cryptocurrencies..."
          showFilters={enableFilters}
          showHistory={true}
        />
      )}
    </div>
  );

  // Render based on view mode
  const renderTable = () => {
    const dataToRender = viewMode === 'pagination' ? paginatedCoins : 
                        viewMode === 'infinite' ? infiniteData : 
                        processedCoins;

    switch (viewMode) {
      case 'virtual':
        return (
          <VirtualScrollTable
            data={processedCoins}
            columns={columns}
            height={virtualHeight}
            itemHeight={60}
            loading={pricesLoading}
            onRowClick={handleRowClick}
            selectedRowId={selectedCoin?.id}
            sortConfig={sortConfig}
            onSort={enableSorting ? handleSort : undefined}
            searchTerm={searchTerm}
            highlightSearchTerm={true}
          />
        );

      case 'pagination':
        return (
          <>
            <VirtualScrollTable
              data={paginatedCoins}
              columns={columns}
              height={virtualHeight}
              itemHeight={60}
              loading={pricesLoading}
              onRowClick={handleRowClick}
              selectedRowId={selectedCoin?.id}
              sortConfig={sortConfig}
              onSort={enableSorting ? handleSort : undefined}
              searchTerm={searchTerm}
              highlightSearchTerm={true}
            />
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(processedCoins.length / itemsPerPage)}
                totalItems={processedCoins.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                loading={pricesLoading}
              />
            </div>
          </>
        );

      case 'infinite':
        return (
          <IncrementalLoader
            data={infiniteData}
            loadMore={loadMore}
            hasMore={hasMore}
            loading={infiniteLoading}
            renderItem={(coin, index) => (
              <div
                key={coin.id}
                className="flex items-center border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleRowClick(coin)}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={`
                      px-4 py-3 flex-shrink-0
                      ${column.width ? `w-${column.width}` : 'flex-1'}
                      ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                    `}
                  >
                    {column.render ? column.render(coin[column.key], coin, index, infiniteData) : coin[column.key]}
                  </div>
                ))}
              </div>
            )}
            containerClassName="max-h-96 overflow-auto"
            mode="infinite"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`}>
      {renderControls()}
      {renderTable()}
    </div>
  );
};

export default EnhancedCryptocurrencyTable;