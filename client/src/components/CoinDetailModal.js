import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign,
  Globe,
  ExternalLink,
  Star,
  StarOff,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Clock,
  Volume2,
  Users,
  Zap
} from 'lucide-react';
import InteractivePriceChart from './InteractivePriceChart';
import QuickTradePanel from './QuickTradePanel';
import { usePrices } from '../hooks/useDataCache';

const CoinDetailModal = ({ 
  coin, 
  isOpen, 
  onClose, 
  onCoinChange,
  availableCoins = [],
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [timeframe, setTimeframe] = useState('24h');
  
  const { data: prices = {} } = usePrices();
  
  // Get current coin index for navigation
  const currentIndex = availableCoins.findIndex(c => c.id === coin?.id);
  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < availableCoins.length - 1;

  // Load favorite status
  useEffect(() => {
    if (coin) {
      const favorites = JSON.parse(localStorage.getItem('coinFavorites') || '[]');
      setIsFavorite(favorites.includes(coin.id));
    }
  }, [coin]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (canNavigatePrev) {
            onCoinChange(availableCoins[currentIndex - 1]);
          }
          break;
        case 'ArrowRight':
          if (canNavigateNext) {
            onCoinChange(availableCoins[currentIndex + 1]);
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canNavigatePrev, canNavigateNext, currentIndex, availableCoins, onCoinChange, onClose, isFullscreen]);

  // Toggle favorite
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('coinFavorites') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(id => id !== coin.id);
    } else {
      newFavorites = [...favorites, coin.id];
    }
    
    localStorage.setItem('coinFavorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  if (!isOpen || !coin) return null;

  const priceData = prices[coin.id] || {};
  const currentPrice = priceData.usd || coin.price || 0;
  const priceChange24h = priceData.usd_24h_change || coin.change24h || 0;
  const isPositiveChange = priceChange24h >= 0;

  // Mock additional data (in real app, this would come from API)
  const coinDetails = {
    description: `${coin.name} is a leading cryptocurrency that has gained significant adoption in the digital asset space. It offers innovative features and has a strong community backing.`,
    website: `https://${coin.name.toLowerCase().replace(/\s+/g, '')}.org`,
    explorer: `https://explorer.${coin.name.toLowerCase().replace(/\s+/g, '')}.org`,
    whitepaper: `https://${coin.name.toLowerCase().replace(/\s+/g, '')}.org/whitepaper.pdf`,
    totalSupply: Math.floor(Math.random() * 1000000000),
    circulatingSupply: Math.floor(Math.random() * 500000000),
    maxSupply: Math.floor(Math.random() * 1000000000),
    allTimeHigh: currentPrice * (1 + Math.random() * 2),
    allTimeLow: currentPrice * (0.1 + Math.random() * 0.5),
    marketCapRank: coin.rank || Math.floor(Math.random() * 100) + 1,
    volume24h: priceData.usd_24h_vol || Math.floor(Math.random() * 1000000000),
    marketCap: priceData.usd_market_cap || Math.floor(Math.random() * 10000000000)
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'chart', label: 'Chart', icon: TrendingUp },
    { id: 'trade', label: 'Trade', icon: DollarSign },
    { id: 'details', label: 'Details', icon: Globe }
  ];

  const formatLargeNumber = (num) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${
        isFullscreen 
          ? 'w-full h-full rounded-none' 
          : 'max-w-6xl w-full mx-4 max-h-[90vh]'
      } overflow-hidden ${className}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => canNavigatePrev && onCoinChange(availableCoins[currentIndex - 1])}
                disabled={!canNavigatePrev}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous coin (←)"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => canNavigateNext && onCoinChange(availableCoins[currentIndex + 1])}
                disabled={!canNavigateNext}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next coin (→)"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Coin Info */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-700">
                  {coin.symbol?.substring(0, 2) || coin.name?.substring(0, 2)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{coin.name}</h2>
                <p className="text-sm text-gray-500">{coin.symbol}</p>
              </div>
            </div>

            {/* Price Info */}
            <div className="ml-8">
              <div className="text-2xl font-bold text-gray-900">
                ${currentPrice.toLocaleString()}
              </div>
              <div className={`flex items-center text-sm ${
                isPositiveChange ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {isPositiveChange ? '+' : ''}{priceChange24h.toFixed(2)}% (24h)
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-50'
              }`}
              title="Toggle favorite"
            >
              {isFavorite ? (
                <Star className="h-5 w-5 fill-current" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen (Ctrl+F)`}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'max-h-[60vh]'}`}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">Market Cap</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${formatLargeNumber(coinDetails.marketCap)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Rank #{coinDetails.marketCapRank}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Volume2 className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-600">24h Volume</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${formatLargeNumber(coinDetails.volume24h)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">All-Time High</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${coinDetails.allTimeHigh.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-600">All-Time Low</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${coinDetails.allTimeLow.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About {coin.name}</h3>
                <p className="text-gray-600 leading-relaxed">{coinDetails.description}</p>
              </div>

              {/* Supply Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Supply Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-600 mb-1">Circulating Supply</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatLargeNumber(coinDetails.circulatingSupply)} {coin.symbol}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-600 mb-1">Total Supply</div>
                    <div className="text-lg font-bold text-purple-900">
                      {formatLargeNumber(coinDetails.totalSupply)} {coin.symbol}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-600 mb-1">Max Supply</div>
                    <div className="text-lg font-bold text-green-900">
                      {coinDetails.maxSupply ? `${formatLargeNumber(coinDetails.maxSupply)} ${coin.symbol}` : 'No Limit'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Price Chart</h3>
                <div className="flex space-x-2">
                  {['1H', '4H', '1D', '1W', '1M'].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        timeframe === tf
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-96">
                <InteractivePriceChart 
                  coinId={coin.id}
                  timeframe={timeframe}
                  height={384}
                />
              </div>
            </div>
          )}

          {/* Trade Tab */}
          {activeTab === 'trade' && (
            <div className="p-6">
              <QuickTradePanel 
                selectedCoin={coin.id}
                onTradeExecuted={(result) => {
                  console.log('Trade executed from modal:', result);
                }}
              />
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Links & Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href={coinDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Official Website</div>
                      <div className="text-sm text-gray-500">Visit the official website</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>

                  <a
                    href={coinDetails.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">Block Explorer</div>
                      <div className="text-sm text-gray-500">View blockchain data</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>

                  <a
                    href={coinDetails.whitepaper}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Whitepaper</div>
                      <div className="text-sm text-gray-500">Technical documentation</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract Address</span>
                    <span className="font-mono text-sm text-gray-900">0x1234...5678</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Blockchain</span>
                    <span className="text-gray-900">Ethereum</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Standard</span>
                    <span className="text-gray-900">ERC-20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Decimals</span>
                    <span className="text-gray-900">18</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Use ← → arrow keys to navigate between coins
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Real-time data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetailModal;