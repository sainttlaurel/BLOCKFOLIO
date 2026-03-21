import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Calculator,
  Zap
} from 'lucide-react';
import { usePrices, usePortfolio } from '../hooks/useDataCache';
import { useTradingShortcuts } from '../hooks/useKeyboardShortcuts';

const QuickTradePanel = ({ 
  selectedCoin = 'bitcoin',
  onTradeExecuted,
  className = '' 
}) => {
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('market'); // 'market' or 'limit'
  const [limitPrice, setLimitPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tradeResult, setTradeResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Get real-time price and portfolio data
  const { data: prices = {}, refresh: refreshPrices } = usePrices();
  const { data: portfolioData, refresh: refreshPortfolio } = usePortfolio();

  // Setup trading keyboard shortcuts
  useTradingShortcuts(
    () => setTradeType('buy'),
    () => setTradeType('sell'),
    refreshPrices
  );

  // Listen for global quick trade events
  useEffect(() => {
    const handleQuickTrade = (event) => {
      const { type } = event.detail;
      setTradeType(type);
    };

    document.addEventListener('quickTrade', handleQuickTrade);
    return () => document.removeEventListener('quickTrade', handleQuickTrade);
  }, []);

  const currentPrice = (prices && prices[selectedCoin]?.usd) || 0;
  const priceChange24h = (prices && prices[selectedCoin]?.usd_24h_change) || 0;
  const availableBalance = portfolioData?.usdBalance || 0;
  const currentHolding = portfolioData?.holdings?.find(h => h.coinId === selectedCoin);

  // Calculate trade details
  const tradeDetails = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const price = orderType === 'limit' ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
    const total = numAmount * price;
    const fee = total * 0.001; // 0.1% trading fee
    const totalWithFee = tradeType === 'buy' ? total + fee : total - fee;

    return {
      amount: numAmount,
      price,
      total,
      fee,
      totalWithFee,
      canAfford: tradeType === 'buy' ? totalWithFee <= availableBalance : numAmount <= (currentHolding?.amount || 0)
    };
  }, [amount, limitPrice, currentPrice, orderType, tradeType, availableBalance, currentHolding]);

  // Validation
  useEffect(() => {
    const newErrors = {};

    if (amount && parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (tradeType === 'buy' && tradeDetails.totalWithFee > availableBalance) {
      newErrors.balance = 'Insufficient balance';
    }

    if (tradeType === 'sell' && tradeDetails.amount > (currentHolding?.amount || 0)) {
      newErrors.holding = 'Insufficient holdings';
    }

    if (orderType === 'limit' && limitPrice && parseFloat(limitPrice) <= 0) {
      newErrors.limitPrice = 'Limit price must be greater than 0';
    }

    setErrors(newErrors);
  }, [amount, tradeType, tradeDetails, availableBalance, currentHolding, orderType, limitPrice]);

  const handleTrade = async () => {
    if (Object.keys(errors).length > 0) return;

    setShowConfirmation(true);
  };

  const confirmTrade = async () => {
    setIsLoading(true);
    setShowConfirmation(false);

    try {
      // Simulate API call
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
      onTradeExecuted?.(result);
      
      // Reset form
      setAmount('');
      setLimitPrice('');
      
      // Refresh portfolio data
      refreshPortfolio();

      // Clear result after 5 seconds
      setTimeout(() => setTradeResult(null), 5000);

    } catch (error) {
      setTradeResult({
        success: false,
        error: error.message || 'Trade execution failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTradeButtonText = () => {
    if (isLoading) return 'Processing...';
    if (Object.keys(errors).length > 0) return 'Invalid Order';
    return `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedCoin.toUpperCase()}`;
  };

  const isTradeDisabled = Object.keys(errors).length > 0 || isLoading || !amount;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} role="region" aria-label="Quick trade panel">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quick Trade</h3>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span className="text-sm text-gray-600">Instant Execution</span>
          </div>
        </div>
      </div>

      {/* Trade Result Notification */}
      {tradeResult && (
        <div className={`p-4 border-b border-gray-200 ${
          tradeResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`} role="alert" aria-live="assertive">
          <div className="flex items-center space-x-2">
            {tradeResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            )}
            <div>
              <p className={`font-medium ${
                tradeResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {tradeResult.success 
                  ? `${tradeResult.type === 'buy' ? 'Purchase' : 'Sale'} Successful!`
                  : 'Trade Failed'
                }
              </p>
              {tradeResult.success && (
                <p className="text-sm text-green-600">
                  {tradeResult.type === 'buy' ? 'Bought' : 'Sold'} {tradeResult.amount} {selectedCoin.toUpperCase()} 
                  at ${tradeResult.price.toLocaleString()}
                </p>
              )}
              {!tradeResult.success && (
                <p className="text-sm text-red-600">{tradeResult.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Current Price Display */}
        <div className="bg-gray-50 rounded-lg p-4" role="status" aria-live="polite" aria-label={`Current ${selectedCoin.toUpperCase()} price: $${currentPrice.toLocaleString()}, 24 hour change: ${priceChange24h >= 0 ? 'up' : 'down'} ${Math.abs(priceChange24h).toFixed(2)} percent`}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">{selectedCoin.toUpperCase()}</h4>
              <p className="text-2xl font-bold text-gray-900">
                ${currentPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`flex items-center space-x-1 ${
                priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {priceChange24h >= 0 ? (
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="font-medium">
                  {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
              </div>
              <p className="text-sm text-gray-500">24h Change</p>
            </div>
          </div>
        </div>

        {/* Trade Type Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1" role="group" aria-label="Trade type selection">
          <button
            onClick={() => setTradeType('buy')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              tradeType === 'buy'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Buy cryptocurrency"
            aria-pressed={tradeType === 'buy'}
          >
            Buy
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              tradeType === 'sell'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Sell cryptocurrency"
            aria-pressed={tradeType === 'sell'}
          >
            Sell
          </button>
        </div>

        {/* Order Type Selection */}
        <div className="flex bg-gray-100 rounded-lg p-1" role="group" aria-label="Order type selection">
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              orderType === 'market'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Market order - Execute at current market price"
            aria-pressed={orderType === 'market'}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              orderType === 'limit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Limit order - Execute at specified price"
            aria-pressed={orderType === 'limit'}
          >
            Limit
          </button>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label htmlFor="trade-amount" className="block text-sm font-medium text-gray-700">
            Amount ({selectedCoin.toUpperCase()})
          </label>
          <div className="relative">
            <input
              id="trade-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount || errors.balance || errors.holding
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              aria-invalid={!!(errors.amount || errors.balance || errors.holding)}
              aria-describedby={errors.amount || errors.balance || errors.holding ? "amount-error" : undefined}
              aria-label={`Enter amount of ${selectedCoin.toUpperCase()} to ${tradeType}`}
            />
            <button
              onClick={() => {
                if (tradeType === 'buy') {
                  const maxAmount = availableBalance / currentPrice * 0.999; // Leave room for fees
                  setAmount(maxAmount.toFixed(6));
                } else {
                  setAmount((currentHolding?.amount || 0).toString());
                }
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium"
              aria-label={`Set to maximum available ${tradeType === 'buy' ? 'balance' : 'holdings'}`}
            >
              MAX
            </button>
          </div>
          {(errors.amount || errors.balance || errors.holding) && (
            <p id="amount-error" className="text-sm text-red-600" role="alert">
              {errors.amount || errors.balance || errors.holding}
            </p>
          )}
        </div>

        {/* Limit Price Input (if limit order) */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <label htmlFor="limit-price" className="block text-sm font-medium text-gray-700">
              Limit Price (USD)
            </label>
            <input
              id="limit-price"
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toString()}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.limitPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.limitPrice}
              aria-describedby={errors.limitPrice ? "limit-price-error" : undefined}
              aria-label="Enter limit price in USD"
            />
            {errors.limitPrice && (
              <p id="limit-price-error" className="text-sm text-red-600" role="alert">{errors.limitPrice}</p>
            )}
          </div>
        )}

        {/* Trade Summary */}
        {amount && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2" role="region" aria-label="Trade summary">
            <h5 className="font-medium text-gray-900 flex items-center">
              <Calculator className="h-4 w-4 mr-2" aria-hidden="true" />
              Trade Summary
            </h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{tradeDetails.amount.toFixed(6)} {selectedCoin.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">${tradeDetails.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${tradeDetails.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trading Fee (0.1%):</span>
                <span className="font-medium">${tradeDetails.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1">
                <span className="text-gray-900 font-medium">Total:</span>
                <span className="font-bold">${tradeDetails.totalWithFee.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Available Balance */}
        <div className="flex items-center justify-between text-sm" role="status" aria-live="polite">
          <div className="flex items-center space-x-2 text-gray-600">
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span>Available:</span>
          </div>
          <div className="text-right">
            {tradeType === 'buy' ? (
              <span className="font-medium" aria-label={`Available balance: $${availableBalance.toLocaleString()}`}>${availableBalance.toLocaleString()}</span>
            ) : (
              <span className="font-medium" aria-label={`Available holdings: ${(currentHolding?.amount || 0).toFixed(6)} ${selectedCoin.toUpperCase()}`}>
                {(currentHolding?.amount || 0).toFixed(6)} {selectedCoin.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Trade Button */}
        <button
          onClick={handleTrade}
          disabled={isTradeDisabled}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isTradeDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : tradeType === 'buy'
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl'
          }`}
          aria-label={isTradeDisabled ? getTradeButtonText() : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${amount || '0'} ${selectedCoin.toUpperCase()}`}
          aria-disabled={isTradeDisabled}
        >
          {isLoading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
              <span>Processing...</span>
            </div>
          )}
          {!isLoading && getTradeButtonText()}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="presentation">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-trade-title"
            aria-describedby="confirm-trade-description"
          >
            <div className="p-6">
              <h3 id="confirm-trade-title" className="text-lg font-semibold text-gray-900 mb-4">
                Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
              </h3>
              
              <div id="confirm-trade-description" className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Action:</span>
                  <span className={`font-medium ${
                    tradeType === 'buy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedCoin.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{tradeDetails.amount.toFixed(6)} {selectedCoin.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">${tradeDetails.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold">${tradeDetails.totalWithFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Cancel trade"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTrade}
                  className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                    tradeType === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  aria-label={`Confirm ${tradeType === 'buy' ? 'purchase' : 'sale'} of ${tradeDetails.amount.toFixed(6)} ${selectedCoin.toUpperCase()}`}
                >
                  Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickTradePanel;