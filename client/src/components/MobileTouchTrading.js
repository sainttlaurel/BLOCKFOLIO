import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Zap,
  Info
} from 'lucide-react';
import { usePrices, usePortfolio } from '../hooks/useDataCache';
import { useTouchGestures } from '../hooks/useTouchGestures';
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';

/**
 * MobileTouchTrading - Touch-optimized trading component for mobile devices
 * 
 * Features:
 * - 44x44px minimum touch targets (WCAG 2.5.5 Level AAA)
 * - Swipe gestures for quick actions
 * - Haptic feedback for touch interactions
 * - Large, thumb-friendly buttons
 * - Touch-optimized number inputs
 * - Visual feedback for all interactions
 */
const MobileTouchTrading = ({ 
  selectedCoin = 'bitcoin',
  onTradeExecuted,
  className = '' 
}) => {
  const { isMobile } = useResponsiveBreakpoints();
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState(null);
  const [showQuickAmount, setShowQuickAmount] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState(null);

  const confirmPanelRef = useRef(null);
  const tradeButtonRef = useRef(null);

  const { data: prices = {}, refresh: refreshPrices } = usePrices();
  const { data: portfolioData, refresh: refreshPortfolio } = usePortfolio();

  const currentPrice = (prices && prices[selectedCoin]?.usd) || 0;
  const priceChange24h = (prices && prices[selectedCoin]?.usd_24h_change) || 0;
  const availableBalance = portfolioData?.usdBalance || 0;
  const currentHolding = portfolioData?.holdings?.find(h => h.coinId === selectedCoin);

  // Touch gesture handlers for swipe-to-confirm
  const { touchHandlers, triggerHaptic } = useTouchGestures({
    onSwipeRight: (event, swipeData) => {
      if (showConfirmation && tradeType === 'buy') {
        confirmTrade();
      }
    },
    onSwipeLeft: (event, swipeData) => {
      if (showConfirmation && tradeType === 'sell') {
        confirmTrade();
      }
    },
    onSwipeDown: () => {
      if (showConfirmation) {
        setShowConfirmation(false);
        triggerHaptic('light');
      }
    },
    enableHaptic: true
  });

  // Calculate trade details
  const tradeDetails = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const total = numAmount * currentPrice;
    const fee = total * 0.001;
    const totalWithFee = tradeType === 'buy' ? total + fee : total - fee;

    return {
      amount: numAmount,
      price: currentPrice,
      total,
      fee,
      totalWithFee,
      canAfford: tradeType === 'buy' 
        ? totalWithFee <= availableBalance 
        : numAmount <= (currentHolding?.amount || 0)
    };
  }, [amount, currentPrice, tradeType, availableBalance, currentHolding]);

  // Quick amount presets
  const quickAmounts = useMemo(() => {
    if (tradeType === 'buy') {
      const maxAmount = availableBalance / currentPrice * 0.999;
      return [
        { label: '25%', value: (maxAmount * 0.25).toFixed(6) },
        { label: '50%', value: (maxAmount * 0.50).toFixed(6) },
        { label: '75%', value: (maxAmount * 0.75).toFixed(6) },
        { label: 'MAX', value: maxAmount.toFixed(6) }
      ];
    } else {
      const maxAmount = currentHolding?.amount || 0;
      return [
        { label: '25%', value: (maxAmount * 0.25).toFixed(6) },
        { label: '50%', value: (maxAmount * 0.50).toFixed(6) },
        { label: '75%', value: (maxAmount * 0.75).toFixed(6) },
        { label: 'MAX', value: maxAmount.toFixed(6) }
      ];
    }
  }, [tradeType, availableBalance, currentPrice, currentHolding]);

  // Handle quick amount selection
  const handleQuickAmount = (value) => {
    setAmount(value);
    triggerHaptic('light');
    setShowQuickAmount(false);
  };

  // Handle trade type change with haptic feedback
  const handleTradeTypeChange = (type) => {
    setTradeType(type);
    triggerHaptic('medium');
    setTouchFeedback(type);
    setTimeout(() => setTouchFeedback(null), 200);
  };

  // Handle trade initiation
  const handleTrade = () => {
    if (!tradeDetails.canAfford || !amount) return;
    
    triggerHaptic('medium');
    setShowConfirmation(true);
  };

  // Confirm and execute trade
  const confirmTrade = async () => {
    setIsLoading(true);
    setShowConfirmation(false);
    triggerHaptic('heavy');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = {
        success: true,
        transactionId: `tx_${Date.now()}`,
        type: tradeType,
        coin: selectedCoin,
        amount: tradeDetails.amount,
        price: tradeDetails.price,
        total: tradeDetails.total,
        fee: tradeDetails.fee,
        timestamp: new Date()
      };

      setTradeResult(result);
      triggerHaptic('success');
      onTradeExecuted?.(result);
      
      setAmount('');
      refreshPortfolio();

      setTimeout(() => setTradeResult(null), 5000);
    } catch (error) {
      setTradeResult({
        success: false,
        error: error.message || 'Trade execution failed'
      });
      triggerHaptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Number pad for touch-friendly input
  const NumberPad = () => (
    <div className="grid grid-cols-3 gap-2 mt-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((key) => (
        <button
          key={key}
          onClick={() => {
            triggerHaptic('light');
            if (key === '⌫') {
              setAmount(prev => prev.slice(0, -1));
            } else if (key === '.') {
              if (!amount.includes('.')) {
                setAmount(prev => prev + '.');
              }
            } else {
              setAmount(prev => prev + key);
            }
          }}
          className="min-h-[56px] min-w-[56px] bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg font-semibold text-lg transition-colors touch-manipulation"
          aria-label={key === '⌫' ? 'Delete' : `Enter ${key}`}
        >
          {key}
        </button>
      ))}
    </div>
  );

  if (!isMobile) {
    return null; // Only render on mobile
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Trade Result Notification */}
      {tradeResult && (
        <div 
          className={`p-4 border-b ${
            tradeResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center space-x-3">
            {tradeResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" aria-hidden="true" />
            )}
            <div className="flex-1">
              <p className={`font-semibold text-base ${
                tradeResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {tradeResult.success 
                  ? `${tradeResult.type === 'buy' ? 'Purchase' : 'Sale'} Successful!`
                  : 'Trade Failed'
                }
              </p>
              {tradeResult.success && (
                <p className="text-sm text-green-700 mt-1">
                  {tradeResult.type === 'buy' ? 'Bought' : 'Sold'} {tradeResult.amount.toFixed(6)} {selectedCoin.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Current Price Display */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600">{selectedCoin.toUpperCase()}</h4>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                ${currentPrice.toLocaleString()}
              </p>
            </div>
            <div className={`flex items-center space-x-1 px-3 py-2 rounded-lg ${
              priceChange24h >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {priceChange24h >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" aria-hidden="true" />
              )}
              <span className={`font-bold text-base ${
                priceChange24h >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Trade Type Selection - Large Touch Targets */}
        <div className="flex gap-3">
          <button
            onClick={() => handleTradeTypeChange('buy')}
            className={`flex-1 min-h-[56px] rounded-xl font-bold text-lg transition-all touch-manipulation ${
              tradeType === 'buy'
                ? 'bg-green-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600'
            } ${touchFeedback === 'buy' ? 'scale-95' : ''}`}
            aria-label="Buy cryptocurrency"
            aria-pressed={tradeType === 'buy'}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
              <span>Buy</span>
            </div>
          </button>
          <button
            onClick={() => handleTradeTypeChange('sell')}
            className={`flex-1 min-h-[56px] rounded-xl font-bold text-lg transition-all touch-manipulation ${
              tradeType === 'sell'
                ? 'bg-red-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-600'
            } ${touchFeedback === 'sell' ? 'scale-95' : ''}`}
            aria-label="Sell cryptocurrency"
            aria-pressed={tradeType === 'sell'}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingDown className="h-5 w-5" aria-hidden="true" />
              <span>Sell</span>
            </div>
          </button>
        </div>

        {/* Amount Input with Quick Amounts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="mobile-trade-amount" className="text-base font-semibold text-gray-900">
              Amount ({selectedCoin.toUpperCase()})
            </label>
            <button
              onClick={() => {
                setShowQuickAmount(!showQuickAmount);
                triggerHaptic('light');
              }}
              className="flex items-center space-x-1 text-blue-600 font-medium min-h-[44px] px-3"
              aria-label="Toggle quick amount selection"
              aria-expanded={showQuickAmount}
            >
              <span className="text-sm">Quick</span>
              {showQuickAmount ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Quick Amount Buttons */}
          {showQuickAmount && (
            <div className="grid grid-cols-4 gap-2 animate-fade-in">
              {quickAmounts.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleQuickAmount(preset.value)}
                  className="min-h-[48px] bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-colors touch-manipulation"
                  aria-label={`Set amount to ${preset.label}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Large Touch-Friendly Input */}
          <input
            id="mobile-trade-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full min-h-[56px] px-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-center touch-manipulation"
            aria-label={`Enter amount of ${selectedCoin.toUpperCase()} to ${tradeType}`}
          />

          {/* Number Pad */}
          <NumberPad />
        </div>

        {/* Trade Summary */}
        {amount && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="h-4 w-4 text-gray-600" aria-hidden="true" />
              <h5 className="font-semibold text-gray-900">Summary</h5>
            </div>
            <div className="space-y-2 text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">{tradeDetails.amount.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-semibold">${tradeDetails.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee:</span>
                <span className="font-semibold">${tradeDetails.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg">${tradeDetails.totalWithFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Available Balance */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <span className="font-medium text-gray-700">Available:</span>
          </div>
          <span className="font-bold text-gray-900">
            {tradeType === 'buy' 
              ? `$${availableBalance.toLocaleString()}`
              : `${(currentHolding?.amount || 0).toFixed(6)} ${selectedCoin.toUpperCase()}`
            }
          </span>
        </div>

        {/* Large Trade Button */}
        <button
          ref={tradeButtonRef}
          onClick={handleTrade}
          disabled={!tradeDetails.canAfford || !amount || isLoading}
          className={`w-full min-h-[64px] rounded-xl font-bold text-xl transition-all touch-manipulation ${
            !tradeDetails.canAfford || !amount || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : tradeType === 'buy'
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-lg active:shadow-xl'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-lg active:shadow-xl'
          }`}
          aria-label={`${tradeType === 'buy' ? 'Buy' : 'Sell'} ${amount || '0'} ${selectedCoin.toUpperCase()}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" aria-hidden="true"></div>
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Zap className="h-6 w-6" aria-hidden="true" />
              <span>{tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCoin.toUpperCase()}</span>
            </div>
          )}
        </button>
      </div>

      {/* Swipe-to-Confirm Bottom Sheet with Enhanced Features */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setShowConfirmation(false)}
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div
            ref={confirmPanelRef}
            {...touchHandlers}
            className="bg-white rounded-t-3xl w-full p-6 animate-slide-up touch-manipulation shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-trade-title"
            style={{ zIndex: 1000 }}
          >
            {/* Drag Handle for Better Discoverability */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-1.5 bg-gray-400 rounded-full" aria-hidden="true" role="presentation"></div>
            </div>

            <h3 id="confirm-trade-title" className="text-2xl font-bold text-gray-900 mb-4">
              Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
            </h3>

            <div className="space-y-3 mb-6 text-base">
              <div className="flex justify-between">
                <span className="text-gray-600">Action:</span>
                <span className={`font-bold ${
                  tradeType === 'buy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCoin.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">{tradeDetails.amount.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-semibold">${tradeDetails.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-xl">${tradeDetails.totalWithFee.toLocaleString()}</span>
              </div>
            </div>

            {/* Swipe Instruction */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-blue-700 font-medium">
                Swipe {tradeType === 'buy' ? 'right' : 'left'} to confirm or swipe down to cancel
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  triggerHaptic('light');
                }}
                className="flex-1 min-h-[56px] border-2 border-gray-300 rounded-xl text-gray-700 font-bold text-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                aria-label="Cancel trade"
              >
                Cancel
              </button>
              <button
                onClick={confirmTrade}
                className={`flex-1 min-h-[56px] rounded-xl text-white font-bold text-lg transition-colors touch-manipulation ${
                  tradeType === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                }`}
                aria-label={`Confirm ${tradeType === 'buy' ? 'purchase' : 'sale'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTouchTrading;
