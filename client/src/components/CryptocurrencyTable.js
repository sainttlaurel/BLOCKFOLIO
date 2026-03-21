import React, { useState, useMemo } from 'react';
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
  Grid,
  List
} from 'lucide-react';
import Sparkline from './base/Sparkline';
import AdvancedSearch from './base/AdvancedSearch';
import SearchHighlight from './base/SearchHighlight';
import VirtualScrollTable from './base/VirtualScrollTable';
import Pagination from './base/Pagination';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';
import { usePrices } from '../hooks/useDataCache';
import { useDegradationAware } from '../hooks/useGracefulDegradation';

const CryptocurrencyTable = ({ 
  coins = [], 
  onCoinSelect, 
  selectedCoin = null,
  showHoldings = false,
  wallet = null,
  className = "",
  loadingMode = 'virtual', // 'virtual' | 'pagination' | 'traditional'
  pageSize = 50,
  enableProgressiveLoading = true
}) => {
  // Graceful degradation awareness
  const { 
    componentConfig
  } = useDegradationAware('CryptocurrencyTable');
  
  // Use cached price data
  const { 
    data: prices = {}, 
    loading: pricesLoading
  } = usePrices();
  const [sortConfig, setSortConfig] = useState({ key: 'rank', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Adapt view mode based on degradation level
  const [viewMode, setViewMode] = useState(() => {
    if (componentConfig.enableVirtualScrolling) return loadingMode;
    return 'pagination'; // Fall back to pagination in degraded mode
  });

  // Enhanced coin data with market metrics
  const enhancedCoins = useMemo(() => {
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
        // Generate mock sparkline data (in real app, this would come from API)
        sparklineData: Array.from({ length: 24 }, (_, i) => {
          const basePrice = priceData.usd || 100;
          const volatility = 0.02;
          return basePrice * (1 + (Math.random() - 0.5) * volatility);
        })
      };
    });
  }, [coins, prices, wallet]);

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

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle string values
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
  }, [enhancedCoins, searchTerm, showFavoritesOnly, favorites, sortConfig]);

  // Progressive loading hook (moved after processedCoins definition)
  const {
    displayData,
    totalItems,
    totalPages,
    currentPage,
    goToPage
  } = useProgressiveLoading({
    data: processedCoins,
    mode: viewMode,
    pageSize,
    searchTerm,
    sortConfig,
    filters: { showFavoritesOnly }
  });

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle favorites
  const toggleFavorite = (symbol) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      return newFavorites;
    });
  };

  // Get table columns configuration
  const getTableColumns = () => {
    const columns = [
      {
        key: 'rank',
        title: '#',
        width: '16',
        sortable: true,
        render: (value, coin) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(coin.symbol);
              }}
              className="text-gray-400 hover:text-yellow-500 transition-colors"
              aria-label={favorites.has(coin.symbol) ? `Remove ${coin.name} from favorites` : `Add ${coin.name} to favorites`}
              aria-pressed={favorites.has(coin.symbol)}
            >
              {favorites.has(coin.symbol) ? (
                <Star className="h-4 w-4 fill-current text-yellow-500" aria-hidden="true" />
              ) : (
                <StarOff className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
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
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-primary-700">
                  {coin.symbol.substring(0, 2)}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-semibold text-gray-900">
                <SearchHighlight text={coin.name} searchTerm={searchTerm} />
              </div>
              <div className="text-sm text-gray-500 font-medium">
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
        key: 'change1h',
        title: '1h %',
        align: 'right',
        sortable: true,
        render: (value) => formatPercentage(value)
      },
      {
        key: 'change24h',
        title: '24h %',
        align: 'right',
        sortable: true,
        render: (value) => formatPercentage(value)
      },
      {
        key: 'change7d',
        title: '7d %',
        align: 'right',
        sortable: true,
        render: (value) => formatPercentage(value)
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
          <div className="w-20 h-8" role="img" aria-label={`7 day price trend for ${coin.name}: ${coin.change7d >= 0 ? 'up' : 'down'} ${Math.abs(coin.change7d).toFixed(2)} percent`}>
            <Sparkline 
              data={value}
              color={coin.change7d >= 0 ? '#16a34a' : '#dc2626'}
              width={80}
              height={32}
            />
          </div>
        )
      }
    ];

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
                {formatLargeNumber(value)}
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

    // Add action column
    columns.push({
      key: 'action',
      title: 'Action',
      align: 'center',
      render: (value, coin) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCoinSelect && onCoinSelect(coin);
          }}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          aria-label={`Trade ${coin.name}`}
        >
          <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
          Trade
        </button>
      )
    });

    return columns;
  };

  // Render traditional table (fallback)
  const renderTraditionalTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full" role="table" aria-label="Cryptocurrency market data">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200" role="row">
            {getTableColumns().map((column) => (
              <th key={column.key} className="px-6 py-4 text-left" role="columnheader" aria-sort={
                sortConfig.key === column.key 
                  ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending')
                  : column.sortable ? 'none' : undefined
              }>
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className={`flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200 rounded-md px-2 py-1 -mx-2 -my-1 ${
                      sortConfig.key === column.key 
                        ? 'text-primary-700 bg-primary-50 hover:bg-primary-100' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label={`Sort by ${column.title} ${
                      sortConfig.key === column.key 
                        ? (sortConfig.direction === 'asc' ? 'descending' : 'ascending')
                        : 'ascending'
                    }`}
                  >
                    <span>{column.title}</span>
                    {getSortIcon(column.key)}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {column.title}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {processedCoins.map((coin) => (
            <tr 
              key={coin.id}
              className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                selectedCoin?.id === coin.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
              }`}
              onClick={() => onCoinSelect && onCoinSelect(coin)}
              role="row"
              aria-selected={selectedCoin?.id === coin.id}
            >
              {getTableColumns().map((column) => (
                <td key={column.key} className={`px-6 py-4 whitespace-nowrap ${
                  column.align === 'right' ? 'text-right' : 
                  column.align === 'center' ? 'text-center' : 'text-left'
                }`} role="cell">
                  {column.render ? column.render(coin[column.key], coin, 0, processedCoins) : coin[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty State */}
      {processedCoins.length === 0 && (
        <div className="text-center py-12" role="status">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cryptocurrencies found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No data available'}
          </p>
        </div>
      )}
    </div>
  );

  // Get sort icon with enhanced visual feedback
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400 transition-colors duration-200" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary-600 transition-all duration-200 transform scale-110" />
      : <ArrowDown className="h-4 w-4 text-primary-600 transition-all duration-200 transform scale-110" />;
  };

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format percentage change
  const formatPercentage = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center font-medium ${
        isPositive ? 'text-success-600' : 'text-danger-500'
      }`}>
        {isPositive ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {isPositive ? '+' : ''}{value.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 ${className}`} role="region" aria-label="Cryptocurrency market table">
      {/* Table Header with Controls */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cryptocurrency Market</h2>
          <div className="flex items-center space-x-3">
            {/* Progressive Loading Mode Toggle */}
            {enableProgressiveLoading && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1" role="group" aria-label="View mode selection">
                <button
                  onClick={() => setViewMode('virtual')}
                  className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'virtual' 
                      ? 'bg-white text-primary-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Virtual Scrolling"
                  aria-label="Switch to virtual scrolling view"
                  aria-pressed={viewMode === 'virtual'}
                >
                  <Grid className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setViewMode('pagination')}
                  className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'pagination' 
                      ? 'bg-white text-primary-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Pagination"
                  aria-label="Switch to pagination view"
                  aria-pressed={viewMode === 'pagination'}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showFavoritesOnly 
                  ? 'bg-primary-100 text-primary-700 border border-primary-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label={showFavoritesOnly ? 'Show all cryptocurrencies' : 'Show only favorites'}
              aria-pressed={showFavoritesOnly}
            >
              <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} aria-hidden="true" />
              <span className="text-sm font-medium">Favorites</span>
            </button>
            <div className="text-sm text-gray-500" role="status" aria-live="polite">
              {processedCoins.length} of {enhancedCoins.length} coins
            </div>
          </div>
        </div>

        {/* Advanced Search */}
        <AdvancedSearch
          data={enhancedCoins}
          onResults={(results, searchConfig) => {
            if (results.length > 0) {
              onCoinSelect?.(results[0]);
            }
            setSearchTerm(searchConfig.query);
          }}
          placeholder="Search cryptocurrencies..."
          showFilters={true}
          showHistory={true}
        />
      </div>

      {/* Progressive Loading Table */}
      {enableProgressiveLoading ? (
        <div>
          {viewMode === 'virtual' ? (
            <VirtualScrollTable
              data={processedCoins}
              columns={getTableColumns()}
              height={600}
              itemHeight={72}
              loading={pricesLoading}
              onRowClick={onCoinSelect}
              selectedRowId={selectedCoin?.id}
              sortConfig={sortConfig}
              onSort={handleSort}
              searchTerm={searchTerm}
              highlightSearchTerm={true}
            />
          ) : viewMode === 'pagination' ? (
            <>
              <VirtualScrollTable
                data={displayData}
                columns={getTableColumns()}
                height={600}
                itemHeight={72}
                loading={pricesLoading}
                onRowClick={onCoinSelect}
                selectedRowId={selectedCoin?.id}
                sortConfig={sortConfig}
                onSort={handleSort}
                searchTerm={searchTerm}
                highlightSearchTerm={true}
              />
              <div className="p-4 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={pageSize}
                  onPageChange={goToPage}
                  loading={pricesLoading}
                />
              </div>
            </>
          ) : (
            // Traditional table fallback
            renderTraditionalTable()
          )}
        </div>
      ) : (
        renderTraditionalTable()
      )}

      {/* Table Footer with Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {processedCoins.length} of {enhancedCoins.length} cryptocurrencies
          </div>
          <div className="flex items-center space-x-4">
            <span>
              Total Market Cap: {formatLargeNumber(processedCoins.reduce((sum, coin) => sum + coin.marketCap, 0))}
            </span>
            <span>
              Total Volume: {formatLargeNumber(processedCoins.reduce((sum, coin) => sum + coin.volume24h, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptocurrencyTable;