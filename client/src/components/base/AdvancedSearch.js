import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  Star, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  Bookmark,
  History
} from 'lucide-react';

const AdvancedSearch = ({ 
  data = [], 
  onResults, 
  placeholder = "Search cryptocurrencies...",
  className = '',
  showFilters = true,
  showHistory = true 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all', // 'all', 'defi', 'layer1', 'layer2', 'meme', 'stablecoin'
    marketCap: 'all', // 'all', 'large', 'mid', 'small'
    priceChange: 'all', // 'all', 'gainers', 'losers'
    volume: 'all' // 'all', 'high', 'medium', 'low'
  });
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Load search history and saved searches from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const saved = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    setSearchHistory(history);
    setSavedSearches(saved);
  }, []);

  // Cryptocurrency categories
  const categories = {
    all: 'All Categories',
    defi: 'DeFi',
    layer1: 'Layer 1',
    layer2: 'Layer 2', 
    meme: 'Meme Coins',
    stablecoin: 'Stablecoins',
    exchange: 'Exchange Tokens',
    gaming: 'Gaming',
    nft: 'NFT'
  };

  // Filter and search logic
  const filteredResults = useMemo(() => {
    if (!query && filters.category === 'all' && filters.marketCap === 'all' && 
        filters.priceChange === 'all' && filters.volume === 'all') {
      return [];
    }

    let results = [...data];

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(item => 
        item.name?.toLowerCase().includes(searchTerm) ||
        item.symbol?.toLowerCase().includes(searchTerm) ||
        item.id?.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      results = results.filter(item => {
        const category = item.category?.toLowerCase() || '';
        return category === filters.category || 
               (filters.category === 'defi' && (category.includes('defi') || category.includes('decentralized'))) ||
               (filters.category === 'layer1' && (category.includes('layer-1') || category.includes('blockchain'))) ||
               (filters.category === 'layer2' && category.includes('layer-2')) ||
               (filters.category === 'meme' && category.includes('meme')) ||
               (filters.category === 'stablecoin' && category.includes('stablecoin'));
      });
    }

    // Market cap filter
    if (filters.marketCap !== 'all') {
      results = results.filter(item => {
        const marketCap = item.market_cap || 0;
        if (filters.marketCap === 'large') return marketCap > 10000000000; // > $10B
        if (filters.marketCap === 'mid') return marketCap > 1000000000 && marketCap <= 10000000000; // $1B - $10B
        if (filters.marketCap === 'small') return marketCap <= 1000000000; // < $1B
        return true;
      });
    }

    // Price change filter
    if (filters.priceChange !== 'all') {
      results = results.filter(item => {
        const change = item.price_change_percentage_24h || 0;
        if (filters.priceChange === 'gainers') return change > 0;
        if (filters.priceChange === 'losers') return change < 0;
        return true;
      });
    }

    // Volume filter
    if (filters.volume !== 'all') {
      results = results.filter(item => {
        const volume = item.total_volume || 0;
        if (filters.volume === 'high') return volume > 1000000000; // > $1B
        if (filters.volume === 'medium') return volume > 100000000 && volume <= 1000000000; // $100M - $1B
        if (filters.volume === 'low') return volume <= 100000000; // < $100M
        return true;
      });
    }

    return results.slice(0, 10); // Limit to 10 results
  }, [query, filters, data]);

  // Handle search input
  const handleSearch = (value) => {
    setQuery(value);
    setHighlightedIndex(-1);
    
    if (value.trim()) {
      setIsOpen(true);
    }
  };

  // Handle search submission
  const handleSubmit = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    
    // Trigger results callback
    onResults?.(filteredResults, { query: searchQuery, filters });
    
    setIsOpen(false);
  };

  // Save current search
  const saveSearch = () => {
    if (!query.trim()) return;
    
    const searchConfig = {
      id: Date.now(),
      query,
      filters: { ...filters },
      timestamp: new Date(),
      name: `${query} (${Object.values(filters).filter(f => f !== 'all').length} filters)`
    };
    
    const newSaved = [searchConfig, ...savedSearches].slice(0, 5);
    setSavedSearches(newSaved);
    localStorage.setItem('savedSearches', JSON.stringify(newSaved));
  };

  // Load saved search
  const loadSavedSearch = (saved) => {
    setQuery(saved.query);
    setFilters(saved.filters);
    handleSubmit(saved.query);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredResults[highlightedIndex]) {
          onResults?.([filteredResults[highlightedIndex]], { query, filters });
          setIsOpen(false);
        } else {
          handleSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search shortcut
  useEffect(() => {
    const handleGlobalSearch = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalSearch);
    return () => document.removeEventListener('keydown', handleGlobalSearch);
  }, []);

  const hasActiveFilters = Object.values(filters).some(f => f !== 'all');

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(true)}
          placeholder={placeholder}
          data-search-input
          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {hasActiveFilters && (
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter(f => f !== 'all').length}
            </div>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(categories).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          
          <select
            value={filters.marketCap}
            onChange={(e) => setFilters(prev => ({ ...prev, marketCap: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Market Caps</option>
            <option value="large">Large Cap (&gt;$10B)</option>
            <option value="mid">Mid Cap ($1B-$10B)</option>
            <option value="small">Small Cap (&lt;$1B)</option>
          </select>
          
          <select
            value={filters.priceChange}
            onChange={(e) => setFilters(prev => ({ ...prev, priceChange: e.target.value }))}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Changes</option>
            <option value="gainers">Gainers Only</option>
            <option value="losers">Losers Only</option>
          </select>
          
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ category: 'all', marketCap: 'all', priceChange: 'all', volume: 'all' })}
              className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Search Results Dropdown */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {/* Search History */}
          {!query && showHistory && searchHistory.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <History className="h-4 w-4 mr-2" />
                Recent Searches
              </h4>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(historyItem);
                      handleSubmit(historyItem);
                    }}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center"
                  >
                    <Clock className="h-3 w-3 mr-2 text-gray-400" />
                    {historyItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Searches */}
          {!query && showHistory && savedSearches.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved Searches
              </h4>
              <div className="space-y-1">
                {savedSearches.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => loadSavedSearch(saved)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <div className="flex items-center justify-between">
                      <span>{saved.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(saved.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {filteredResults.length > 0 ? (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-sm font-medium text-gray-700">
                  {filteredResults.length} Results
                </span>
                {query && (
                  <button
                    onClick={saveSearch}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Save Search
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {filteredResults.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onResults?.([result], { query, filters });
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      index === highlightedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {result.symbol?.substring(0, 2) || result.name?.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {result.name} ({result.symbol})
                          </div>
                          <div className="text-sm text-gray-500">
                            ${result.current_price?.toLocaleString() || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center text-sm ${
                          (result.price_change_percentage_24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(result.price_change_percentage_24h || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {(result.price_change_percentage_24h || 0).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;