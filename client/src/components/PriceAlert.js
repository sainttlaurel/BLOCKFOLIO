import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';

const PriceAlert = ({ className = '' }) => {
  const [alerts, setAlerts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    coin: 'bitcoin',
    symbol: 'BTC',
    condition: 'above', // 'above' or 'below'
    targetPrice: '',
    currentPrice: 0,
    enabled: true
  });

  const coinOptions = {
    bitcoin: { symbol: 'BTC', name: 'Bitcoin', price: 45000 },
    ethereum: { symbol: 'ETH', name: 'Ethereum', price: 3200 },
    solana: { symbol: 'SOL', name: 'Solana', price: 120 },
    cardano: { symbol: 'ADA', name: 'Cardano', price: 0.65 },
    polkadot: { symbol: 'DOT', name: 'Polkadot', price: 8.5 }
  };

  // Generate sample alerts
  useEffect(() => {
    const sampleAlerts = [
      {
        id: 1,
        coin: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        condition: 'above',
        targetPrice: 50000,
        currentPrice: 45000,
        enabled: true,
        triggered: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        coin: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        condition: 'below',
        targetPrice: 3000,
        currentPrice: 3200,
        enabled: true,
        triggered: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        coin: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        condition: 'above',
        targetPrice: 100,
        currentPrice: 120,
        enabled: false,
        triggered: true,
        triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
    setAlerts(sampleAlerts);
  }, []);

  const handleCreateAlert = () => {
    if (!newAlert.targetPrice || parseFloat(newAlert.targetPrice) <= 0) {
      return;
    }

    const alert = {
      id: Date.now(),
      ...newAlert,
      name: coinOptions[newAlert.coin].name,
      currentPrice: coinOptions[newAlert.coin].price,
      targetPrice: parseFloat(newAlert.targetPrice),
      triggered: false,
      createdAt: new Date()
    };

    setAlerts(prev => [alert, ...prev]);
    setShowCreateModal(false);
    setNewAlert({
      coin: 'bitcoin',
      symbol: 'BTC',
      condition: 'above',
      targetPrice: '',
      currentPrice: 0,
      enabled: true
    });
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleToggleAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, enabled: !alert.enabled }
        : alert
    ));
  };

  const getAlertStatus = (alert) => {
    if (alert.triggered) {
      return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, text: 'Triggered' };
    }
    if (!alert.enabled) {
      return { color: 'text-gray-500', bg: 'bg-gray-50', icon: Settings, text: 'Disabled' };
    }
    
    const isClose = Math.abs(alert.currentPrice - alert.targetPrice) / alert.targetPrice < 0.05;
    if (isClose) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle, text: 'Close' };
    }
    
    return { color: 'text-blue-600', bg: 'bg-blue-50', icon: Bell, text: 'Active' };
  };

  const getProgressPercentage = (alert) => {
    const { currentPrice, targetPrice, condition } = alert;
    
    if (condition === 'above') {
      const progress = (currentPrice / targetPrice) * 100;
      return Math.min(progress, 100);
    } else {
      const progress = ((targetPrice - currentPrice) / targetPrice) * 100 + 100;
      return Math.max(Math.min(progress, 100), 0);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Price Alerts</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {alerts.filter(a => a.enabled && !a.triggered).length} Active
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Alert</span>
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-gray-200">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const status = getAlertStatus(alert);
            const StatusIcon = status.icon;
            const progress = getProgressPercentage(alert);
            
            return (
              <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Coin Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {alert.symbol.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.name}</h4>
                        <p className="text-sm text-gray-500">{alert.symbol}</p>
                      </div>
                    </div>

                    {/* Alert Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {alert.condition === 'above' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.targetPrice.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Current: ${alert.currentPrice.toLocaleString()}</span>
                        <span>•</span>
                        <span>Created: {alert.createdAt.toLocaleDateString()}</span>
                        {alert.triggered && alert.triggeredAt && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">
                              Triggered: {alert.triggeredAt.toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {!alert.triggered && alert.enabled && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                alert.condition === 'above' ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{status.text}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        alert.enabled
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={alert.enabled ? 'Disable Alert' : 'Enable Alert'}
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Price Alerts</h3>
            <p className="text-sm">Create your first alert to get notified when prices hit your targets</p>
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Price Alert</h3>
              
              <div className="space-y-4">
                {/* Cryptocurrency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cryptocurrency
                  </label>
                  <select
                    value={newAlert.coin}
                    onChange={(e) => {
                      const coin = e.target.value;
                      const coinData = coinOptions[coin];
                      setNewAlert(prev => ({
                        ...prev,
                        coin,
                        symbol: coinData.symbol,
                        currentPrice: coinData.price
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(coinOptions).map(([id, data]) => (
                      <option key={id} value={id}>
                        {data.name} ({data.symbol}) - ${data.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Condition
                  </label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setNewAlert(prev => ({ ...prev, condition: 'above' }))}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-colors ${
                        newAlert.condition === 'above'
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>Above</span>
                    </button>
                    <button
                      onClick={() => setNewAlert(prev => ({ ...prev, condition: 'below' }))}
                      className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-colors ${
                        newAlert.condition === 'below'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TrendingDown className="h-4 w-4" />
                      <span>Below</span>
                    </button>
                  </div>
                </div>

                {/* Target Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Price (USD)
                  </label>
                  <input
                    type="number"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, targetPrice: e.target.value }))}
                    placeholder="Enter target price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current price: ${coinOptions[newAlert.coin]?.price.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  disabled={!newAlert.targetPrice}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceAlert;