import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import CryptocurrencyTable from '../components/CryptocurrencyTable';

const Trading = () => {
  const [coins, setCoins] = useState([]);
  const [prices, setPrices] = useState({});
  const [wallet, setWallet] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);

  useEffect(() => {
    fetchTradingData();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTradingData = async () => {
    try {
      const [coinsRes, pricesRes, walletRes] = await Promise.all([
        axios.get('/api/coins'),
        axios.get('/api/coins/prices'),
        axios.get('/api/wallet')
      ]);
      
      setCoins(coinsRes.data.filter(coin => coin.symbol !== 'USD'));
      setPrices(pricesRes.data);
      setWallet(walletRes.data);
    } catch (error) {
      console.error('Error fetching trading data:', error);
      toast.error('Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await axios.get('/api/coins/prices');
      setPrices(response.data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    
    if (!selectedCoin || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select a coin and enter a valid amount');
      return;
    }

    setTrading(true);
    
    try {
      const endpoint = tradeType === 'buy' ? '/api/transactions/buy' : '/api/transactions/sell';
      const response = await axios.post(endpoint, {
        coinSymbol: selectedCoin.symbol,
        amount: parseFloat(amount)
      });

      toast.success(`${tradeType === 'buy' ? 'Purchase' : 'Sale'} successful!`);
      setAmount('');
      setSelectedCoin(null);
      
      // Refresh wallet data
      const walletRes = await axios.get('/api/wallet');
      setWallet(walletRes.data);
      
    } catch (error) {
      const message = error.response?.data?.error || `${tradeType} failed`;
      toast.error(message);
    } finally {
      setTrading(false);
    }
  };

  const getCoinPrice = (symbol) => {
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
    
    const coinId = coinMap[symbol];
    return prices[coinId]?.usd || 0;
  };

  const getCoinChange = (symbol) => {
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
    
    const coinId = coinMap[symbol];
    return prices[coinId]?.usd_24h_change || 0;
  };

  const getUsdBalance = () => {
    const usdHolding = wallet?.holdings?.find(h => h.symbol === 'USD');
    return usdHolding ? parseFloat(usdHolding.amount) : 0;
  };

  const getCoinBalance = (symbol) => {
    const coinHolding = wallet?.holdings?.find(h => h.symbol === symbol);
    return coinHolding ? parseFloat(coinHolding.amount) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Trading</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">Available Balance</p>
          <p className="text-xl font-bold text-gray-900">
            ${getUsdBalance().toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Market Table */}
        <div className="lg:col-span-2">
          <CryptocurrencyTable
            coins={coins}
            prices={prices}
            onCoinSelect={setSelectedCoin}
            selectedCoin={selectedCoin}
            showHoldings={true}
            wallet={wallet}
            className="professional-crypto-table"
          />
        </div>

        {/* Trading Panel */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {selectedCoin ? `Trade ${selectedCoin.symbol}` : 'Select a Coin'}
          </h2>
          
          {selectedCoin ? (
            <form onSubmit={handleTrade} className="space-y-4">
              {/* Trade Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTradeType('buy')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      tradeType === 'buy'
                        ? 'bg-success-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('sell')}
                    className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                      tradeType === 'sell'
                        ? 'bg-danger-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ({selectedCoin.symbol})
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder={`Enter ${selectedCoin.symbol} amount`}
                />
              </div>

              {/* Price Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per {selectedCoin.symbol}:</span>
                  <span className="font-medium">${getCoinPrice(selectedCoin.symbol).toLocaleString()}</span>
                </div>
                {amount && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Total {tradeType === 'buy' ? 'Cost' : 'Value'}:</span>
                    <span className="font-medium">
                      ${(parseFloat(amount) * getCoinPrice(selectedCoin.symbol)).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Balance Info */}
              <div className="text-sm text-gray-600">
                {tradeType === 'buy' ? (
                  <p>Available USD: ${getUsdBalance().toLocaleString()}</p>
                ) : (
                  <p>Available {selectedCoin.symbol}: {getCoinBalance(selectedCoin.symbol).toFixed(6)}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={trading || !amount}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  tradeType === 'buy'
                    ? 'btn-success'
                    : 'btn-danger'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {trading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedCoin.symbol}`}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select a cryptocurrency from the market table to start trading</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trading;