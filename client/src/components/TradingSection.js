import React, { useState, useEffect, Suspense } from 'react';
import { BarChart3, Activity, TrendingUp, Bell } from 'lucide-react';
import { createLazyComponent, useRenderTime } from '../utils/performanceOptimization';
import { usePrices } from '../hooks/useDataCache';
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';

// Lazy load trading components for better performance
const QuickTradePanel = createLazyComponent(
  () => import('./QuickTradePanel'),
  <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
);

const MobileTouchTrading = createLazyComponent(
  () => import('./MobileTouchTrading'),
  <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
);

const OrderHistory = createLazyComponent(
  () => import('./OrderHistory'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const OrderBook = createLazyComponent(
  () => import('./OrderBook'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const PriceAlert = createLazyComponent(
  () => import('./PriceAlert'),
  <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
);

const TradingSection = () => {
  // Track component render performance
  useRenderTime('TradingSection');
  
  const { isMobile } = useResponsiveBreakpoints();
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [activeTab, setActiveTab] = useState('trade'); // 'trade', 'history', 'orderbook', 'alerts'
  
  const { data: prices = {} } = usePrices();
  const currentPrice = (prices && prices[selectedCoin]?.usd) || 0;

  const coinOptions = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    solana: 'SOL',
    cardano: 'ADA',
    polkadot: 'DOT',
    chainlink: 'LINK',
    litecoin: 'LTC',
    stellar: 'XLM'
  };

  const handleTradeExecuted = (tradeResult) => {
    console.log('Trade executed:', tradeResult);
    // Handle trade execution result
    // Could trigger portfolio refresh, show notifications, etc.
  };

  const tabs = [
    { id: 'trade', label: 'Quick Trade', icon: TrendingUp },
    { id: 'history', label: 'Order History', icon: Activity },
    { id: 'orderbook', label: 'Order Book', icon: BarChart3 },
    { id: 'alerts', label: 'Price Alerts', icon: Bell }
  ];

  return (
    <div className="space-y-6">
      {/* Cryptocurrency Selection */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Trading</h3>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(coinOptions).map(([id, symbol]) => (
              <option key={id} value={id}>
                {symbol} - ${(prices && prices[id]?.usd?.toFixed(2)) || '0.00'}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'trade' && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
            {isMobile ? (
              <MobileTouchTrading
                selectedCoin={selectedCoin}
                onTradeExecuted={handleTradeExecuted}
              />
            ) : (
              <QuickTradePanel
                selectedCoin={selectedCoin}
                onTradeExecuted={handleTradeExecuted}
              />
            )}
          </Suspense>
        )}
        
        {activeTab === 'history' && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
            <OrderHistory />
          </Suspense>
        )}
        
        {activeTab === 'orderbook' && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
            <OrderBook
              symbol={coinOptions[selectedCoin]}
              currentPrice={currentPrice}
            />
          </Suspense>
        )}
        
        {activeTab === 'alerts' && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
            <PriceAlert />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default TradingSection;