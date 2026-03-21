import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Layers,
  Activity,
  Target
} from 'lucide-react';

const OrderBook = ({ 
  symbol = 'BTC',
  currentPrice = 45000,
  className = '' 
}) => {
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] });
  const [spread, setSpread] = useState(0);
  const [spreadPercentage, setSpreadPercentage] = useState(0);
  const [depth, setDepth] = useState(10); // Number of levels to show
  const [grouping, setGrouping] = useState(1); // Price grouping

  // Generate realistic order book data
  useEffect(() => {
    const generateOrderBook = () => {
      const bids = [];
      const asks = [];
      
      // Generate bids (buy orders) - below current price
      for (let i = 0; i < 20; i++) {
        const price = currentPrice - (i + 1) * (Math.random() * 50 + 10);
        const size = Math.random() * 5 + 0.1;
        bids.push({
          price: parseFloat(price.toFixed(2)),
          size: parseFloat(size.toFixed(6)),
          total: 0 // Will be calculated
        });
      }

      // Generate asks (sell orders) - above current price
      for (let i = 0; i < 20; i++) {
        const price = currentPrice + (i + 1) * (Math.random() * 50 + 10);
        const size = Math.random() * 5 + 0.1;
        asks.push({
          price: parseFloat(price.toFixed(2)),
          size: parseFloat(size.toFixed(6)),
          total: 0 // Will be calculated
        });
      }

      // Sort and calculate cumulative totals
      bids.sort((a, b) => b.price - a.price); // Highest bid first
      asks.sort((a, b) => a.price - b.price); // Lowest ask first

      let bidTotal = 0;
      bids.forEach(bid => {
        bidTotal += bid.size;
        bid.total = bidTotal;
      });

      let askTotal = 0;
      asks.forEach(ask => {
        askTotal += ask.size;
        ask.total = askTotal;
      });

      // Calculate spread
      const bestBid = bids[0]?.price || 0;
      const bestAsk = asks[0]?.price || 0;
      const newSpread = bestAsk - bestBid;
      const newSpreadPercentage = ((newSpread / currentPrice) * 100);

      setOrderBookData({ bids, asks });
      setSpread(newSpread);
      setSpreadPercentage(newSpreadPercentage);
    };

    generateOrderBook();
    
    // Update order book every 2 seconds
    const interval = setInterval(generateOrderBook, 2000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  // Get visible orders based on depth setting
  const visibleOrders = useMemo(() => {
    return {
      bids: orderBookData.bids.slice(0, depth),
      asks: orderBookData.asks.slice(0, depth)
    };
  }, [orderBookData, depth]);

  // Calculate max total for bar width scaling
  const maxTotal = useMemo(() => {
    const allTotals = [
      ...visibleOrders.bids.map(b => b.total),
      ...visibleOrders.asks.map(a => a.total)
    ];
    return Math.max(...allTotals, 1);
  }, [visibleOrders]);

  const formatPrice = (price) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatSize = (size) => {
    return size.toFixed(6);
  };

  const getBarWidth = (total) => {
    return (total / maxTotal) * 100;
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      role="region"
      aria-label={`Order book for ${symbol}/USD trading pair`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Order Book</h3>
            <span className="text-sm text-gray-500">{symbol}/USD</span>
          </div>
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="text-sm text-gray-600">Market Depth</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="depth-select" className="text-sm font-medium text-gray-700">Depth:</label>
              <select
                id="depth-select"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select order book depth"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label htmlFor="grouping-select" className="text-sm font-medium text-gray-700">Group:</label>
              <select
                id="grouping-select"
                value={grouping}
                onChange={(e) => setGrouping(parseFloat(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select price grouping"
              >
                <option value={0.01}>0.01</option>
                <option value={0.1}>0.1</option>
                <option value={1}>1.0</option>
                <option value={10}>10.0</option>
              </select>
            </div>
          </div>
          
          {/* Spread Display */}
          <div className="text-right" role="status" aria-live="polite" aria-label={`Bid-ask spread: ${spread.toFixed(2)} dollars, ${spreadPercentage.toFixed(3)} percent`}>
            <div className="text-sm font-medium text-gray-900">
              Spread: ${spread.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              {spreadPercentage.toFixed(3)}%
            </div>
          </div>
        </div>
      </div>

      {/* Order Book Table */}
      <div className="overflow-hidden" role="table" aria-label="Order book data">
        {/* Header */}
        <div className="grid grid-cols-3 gap-4 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider" role="row">
          <div className="text-left" role="columnheader">Price (USD)</div>
          <div className="text-right" role="columnheader">Size ({symbol})</div>
          <div className="text-right" role="columnheader">Total ({symbol})</div>
        </div>

        {/* Asks (Sell Orders) */}
        <div className="relative" role="rowgroup" aria-label="Sell orders (asks)">
          {visibleOrders.asks.slice().reverse().map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="relative grid grid-cols-3 gap-4 px-4 py-1 text-sm hover:bg-red-50 transition-colors"
              role="row"
              aria-label={`Sell order: ${formatPrice(ask.price)} dollars, size ${formatSize(ask.size)} ${symbol}, cumulative total ${formatSize(ask.total)} ${symbol}`}
            >
              {/* Background bar */}
              <div
                className="absolute inset-y-0 right-0 bg-red-50 opacity-60"
                style={{ width: `${getBarWidth(ask.total)}%` }}
                aria-hidden="true"
              />
              
              {/* Content */}
              <div className="relative text-red-600 font-medium" role="cell">
                ${formatPrice(ask.price)}
              </div>
              <div className="relative text-right text-gray-900" role="cell">
                {formatSize(ask.size)}
              </div>
              <div className="relative text-right text-gray-600" role="cell">
                {formatSize(ask.total)}
              </div>
            </div>
          ))}
        </div>

        {/* Current Price */}
        <div className="px-4 py-3 bg-gray-100 border-y border-gray-200" role="status" aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-700">Current Price</span>
            </div>
            <div className="text-lg font-bold text-gray-900" aria-label={`Current market price: ${formatPrice(currentPrice)} dollars`}>
              ${formatPrice(currentPrice)}
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="relative" role="rowgroup" aria-label="Buy orders (bids)">
          {visibleOrders.bids.map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="relative grid grid-cols-3 gap-4 px-4 py-1 text-sm hover:bg-green-50 transition-colors"
              role="row"
              aria-label={`Buy order: ${formatPrice(bid.price)} dollars, size ${formatSize(bid.size)} ${symbol}, cumulative total ${formatSize(bid.total)} ${symbol}`}
            >
              {/* Background bar */}
              <div
                className="absolute inset-y-0 right-0 bg-green-50 opacity-60"
                style={{ width: `${getBarWidth(bid.total)}%` }}
                aria-hidden="true"
              />
              
              {/* Content */}
              <div className="relative text-green-600 font-medium" role="cell">
                ${formatPrice(bid.price)}
              </div>
              <div className="relative text-right text-gray-900" role="cell">
                {formatSize(bid.size)}
              </div>
              <div className="relative text-right text-gray-600" role="cell">
                {formatSize(bid.total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="p-4 border-t border-gray-200 bg-gray-50" role="region" aria-label="Order book summary">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Best Bid:</span>
              <span className="font-medium text-green-600" aria-label={`Best bid price: ${formatPrice(visibleOrders.bids[0]?.price || 0)} dollars`}>
                ${formatPrice(visibleOrders.bids[0]?.price || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bid Volume:</span>
              <span className="font-medium" aria-label={`Total bid volume: ${formatSize(visibleOrders.bids[visibleOrders.bids.length - 1]?.total || 0)} ${symbol}`}>
                {formatSize(visibleOrders.bids[visibleOrders.bids.length - 1]?.total || 0)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Best Ask:</span>
              <span className="font-medium text-red-600" aria-label={`Best ask price: ${formatPrice(visibleOrders.asks[0]?.price || 0)} dollars`}>
                ${formatPrice(visibleOrders.asks[0]?.price || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ask Volume:</span>
              <span className="font-medium" aria-label={`Total ask volume: ${formatSize(visibleOrders.asks[visibleOrders.asks.length - 1]?.total || 0)} ${symbol}`}>
                {formatSize(visibleOrders.asks[visibleOrders.asks.length - 1]?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;