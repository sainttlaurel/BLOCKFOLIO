import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { usePrices } from '../hooks/useDataCache';
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';

/**
 * SwipeableMarketCards - Horizontal swipeable carousel for mobile market data
 * 
 * Features:
 * - Horizontal swipe navigation between cryptocurrencies
 * - Smooth scroll snap for card-based layouts
 * - Visual indicators for swipeable content
 * - Touch-optimized interactions
 * - Responsive to different screen sizes
 */
const SwipeableMarketCards = ({ 
  coins = [],
  onCoinSelect,
  className = '' 
}) => {
  const { isMobile } = useResponsiveBreakpoints();
  const { data: prices = {} } = usePrices();
  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  // Prepare market data
  const marketData = Object.entries(prices || {})
    .map(([coinId, data]) => ({
      id: coinId,
      name: coinDisplayNames[coinId] || coinId.toUpperCase(),
      fullName: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      price: data.usd,
      change24h: data.usd_24h_change || 0,
      volume24h: data.usd_24h_vol || 0,
      marketCap: data.usd_market_cap || 0
    }))
    .filter(coin => coin.price > 0)
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));

  // Touch gesture handlers
  const { touchHandlers, triggerHaptic } = useTouchGestures({
    onSwipeLeft: () => {
      scrollToNext();
    },
    onSwipeRight: () => {
      scrollToPrevious();
    },
    enableHaptic: true
  });

  // Update scroll indicators
  const updateScrollIndicators = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll to next card
  const scrollToNext = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector('.market-card')?.offsetWidth || 0;
    const gap = 16; // gap-4 = 16px
    
    container.scrollBy({
      left: cardWidth + gap,
      behavior: 'smooth'
    });
    
    triggerHaptic('light');
  };

  // Scroll to previous card
  const scrollToPrevious = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const cardWidth = container.querySelector('.market-card')?.offsetWidth || 0;
    const gap = 16;
    
    container.scrollBy({
      left: -(cardWidth + gap),
      behavior: 'smooth'
    });
    
    triggerHaptic('light');
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      updateScrollIndicators();
      
      // Calculate current index based on scroll position
      const cardWidth = container.querySelector('.market-card')?.offsetWidth || 0;
      const gap = 16;
      const index = Math.round(container.scrollLeft / (cardWidth + gap));
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    updateScrollIndicators();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [marketData.length]);

  if (!isMobile || marketData.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Movers</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Swipe to explore</span>
          <div className="flex space-x-1">
            {marketData.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-6 bg-blue-600' 
                    : 'w-1.5 bg-gray-300'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Swipeable Container */}
      <div className="relative">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={scrollToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label="Scroll to previous cryptocurrency"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" aria-hidden="true" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={scrollToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label="Scroll to next cryptocurrency"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" aria-hidden="true" />
          </button>
        )}

        {/* Scrollable Cards Container */}
        <div
          ref={scrollContainerRef}
          {...touchHandlers}
          className="swipeable overflow-x-auto scrollbar-hide px-4 pb-2"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
          role="region"
          aria-label="Swipeable cryptocurrency market cards"
        >
          <div className="flex space-x-4">
            {marketData.map((coin) => (
              <div
                key={coin.id}
                className="market-card flex-shrink-0 w-[280px] bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                style={{ scrollSnapAlign: 'start' }}
                onClick={() => {
                  onCoinSelect?.(coin.id);
                  triggerHaptic('medium');
                }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${coin.fullName}`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">
                        {coin.name.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{coin.name}</h4>
                      <p className="text-sm text-gray-500">{coin.fullName}</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                    coin.change24h >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {coin.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className="mb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    ${coin.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: coin.price < 1 ? 6 : 2
                    })}
                  </div>
                  <div className={`text-lg font-semibold ${
                    coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                  </div>
                </div>

                {/* Market Stats */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Volume (24h)</span>
                    <span className="font-medium text-gray-900">
                      ${(coin.volume24h / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Market Cap</span>
                    <span className="font-medium text-gray-900">
                      ${(coin.marketCap / 1000000000).toFixed(2)}B
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Swipe Hint (shows on first render) */}
      <div className="mt-3 px-4">
        <div className="bg-blue-50 rounded-lg p-3 flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </div>
          <p className="text-sm text-blue-700">
            Swipe left or right to view more cryptocurrencies
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwipeableMarketCards;
