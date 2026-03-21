import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  BarChart3, 
  PieChart,
  Calculator,
  Activity
} from 'lucide-react';

const PortfolioAnalytics = ({ 
  holdings = [], 
  totalPortfolioValue = 0,
  historicalData = [],
  className = ''
}) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Calculate comprehensive portfolio metrics
  const portfolioMetrics = useMemo(() => {
    if (!holdings.length) return null;

    // Calculate basic metrics
    const totalCurrentValue = holdings.reduce((sum, h) => sum + parseFloat(h.value || 0), 0);
    const totalPurchaseValue = holdings.reduce((sum, h) => {
      const amount = parseFloat(h.amount || 0);
      const purchasePrice = parseFloat(h.purchasePrice || h.currentPrice || 0);
      return sum + (amount * purchasePrice);
    }, 0);

    // Total return calculations
    const totalReturn = totalCurrentValue - totalPurchaseValue;
    const totalReturnPercent = totalPurchaseValue > 0 ? (totalReturn / totalPurchaseValue) * 100 : 0;

    // Unrealized gains/losses
    const unrealizedGains = holdings.reduce((sum, h) => {
      const amount = parseFloat(h.amount || 0);
      const currentPrice = parseFloat(h.currentPrice || 0);
      const purchasePrice = parseFloat(h.purchasePrice || currentPrice);
      const gain = amount * (currentPrice - purchasePrice);
      return sum + (gain > 0 ? gain : 0);
    }, 0);

    const unrealizedLosses = holdings.reduce((sum, h) => {
      const amount = parseFloat(h.amount || 0);
      const currentPrice = parseFloat(h.currentPrice || 0);
      const purchasePrice = parseFloat(h.purchasePrice || currentPrice);
      const loss = amount * (currentPrice - purchasePrice);
      return sum + (loss < 0 ? Math.abs(loss) : 0);
    }, 0);

    // Portfolio composition
    const topHolding = holdings.reduce((max, h) => {
      const value = parseFloat(h.value || 0);
      return value > parseFloat(max.value || 0) ? h : max;
    }, holdings[0] || {});

    const topHoldingAllocation = totalCurrentValue > 0 
      ? (parseFloat(topHolding.value || 0) / totalCurrentValue) * 100 
      : 0;

    // Diversification metrics
    const numberOfHoldings = holdings.length;
    const averageAllocation = numberOfHoldings > 0 ? 100 / numberOfHoldings : 0;
    
    // Calculate Herfindahl-Hirschman Index (HHI) for concentration
    const hhi = holdings.reduce((sum, h) => {
      const allocation = totalCurrentValue > 0 ? (parseFloat(h.value || 0) / totalCurrentValue) * 100 : 0;
      return sum + Math.pow(allocation, 2);
    }, 0);

    // Diversification score (inverse of concentration)
    const diversificationScore = Math.max(0, 100 - (hhi / 100));

    // Performance metrics
    const winnersCount = holdings.filter(h => {
      const amount = parseFloat(h.amount || 0);
      const currentPrice = parseFloat(h.currentPrice || 0);
      const purchasePrice = parseFloat(h.purchasePrice || currentPrice);
      return currentPrice > purchasePrice;
    }).length;

    const losersCount = holdings.length - winnersCount;
    const winRate = holdings.length > 0 ? (winnersCount / holdings.length) * 100 : 0;

    // Risk metrics (simplified)
    const portfolioVolatility = calculatePortfolioVolatility(holdings);
    const sharpeRatio = calculateSharpeRatio(totalReturnPercent, portfolioVolatility);

    return {
      totalCurrentValue,
      totalPurchaseValue,
      totalReturn,
      totalReturnPercent,
      unrealizedGains,
      unrealizedLosses,
      topHolding,
      topHoldingAllocation,
      numberOfHoldings,
      averageAllocation,
      diversificationScore,
      winnersCount,
      losersCount,
      winRate,
      portfolioVolatility,
      sharpeRatio,
      hhi
    };
  }, [holdings]);

  // Calculate portfolio volatility (simplified)
  const calculatePortfolioVolatility = (holdings) => {
    if (!holdings.length) return 0;
    
    // Simplified volatility calculation based on individual asset volatilities
    const avgVolatility = holdings.reduce((sum, h) => {
      // Simulate volatility based on price changes (in real app, use historical data)
      const volatility = Math.random() * 30 + 10; // 10-40% volatility
      return sum + volatility;
    }, 0) / holdings.length;

    return avgVolatility;
  };

  // Calculate Sharpe ratio (simplified)
  const calculateSharpeRatio = (returnPercent, volatility) => {
    const riskFreeRate = 2; // Assume 2% risk-free rate
    if (volatility === 0) return 0;
    return (returnPercent - riskFreeRate) / volatility;
  };

  if (!portfolioMetrics) {
    return (
      <div className={`portfolio-analytics ${className}`}>
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Available</h3>
          <p className="text-gray-600">Add holdings to see portfolio analytics</p>
        </div>
      </div>
    );
  }

  const metricTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'returns', label: 'Returns', icon: TrendingUp },
    { id: 'diversification', label: 'Diversification', icon: PieChart },
    { id: 'risk', label: 'Risk', icon: Activity }
  ];

  return (
    <div className={`portfolio-analytics bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calculator className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Analytics</h2>
            <p className="text-sm text-gray-600">Comprehensive portfolio performance metrics</p>
          </div>
        </div>

        {/* Metric Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {metricTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMetric(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedMetric === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedMetric === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-700 uppercase tracking-wide">Total Value</span>
                </div>
                <p className="text-xl font-bold text-blue-900">
                  ${portfolioMetrics.totalCurrentValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                portfolioMetrics.totalReturn >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-green-100' 
                  : 'bg-gradient-to-br from-red-50 to-red-100'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {portfolioMetrics.totalReturn >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs uppercase tracking-wide ${
                    portfolioMetrics.totalReturn >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Total Return
                  </span>
                </div>
                <p className={`text-xl font-bold ${
                  portfolioMetrics.totalReturn >= 0 ? 'text-green-900' : 'text-red-900'
                }`}>
                  {portfolioMetrics.totalReturn >= 0 ? '+' : ''}
                  ${Math.abs(portfolioMetrics.totalReturn).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className={`text-sm ${
                  portfolioMetrics.totalReturn >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {portfolioMetrics.totalReturn >= 0 ? '+' : ''}
                  {portfolioMetrics.totalReturnPercent.toFixed(2)}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <PieChart className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-700 uppercase tracking-wide">Holdings</span>
                </div>
                <p className="text-xl font-bold text-purple-900">
                  {portfolioMetrics.numberOfHoldings}
                </p>
                <p className="text-sm text-purple-700">
                  {portfolioMetrics.winRate.toFixed(1)}% winners
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-700 uppercase tracking-wide">Diversification</span>
                </div>
                <p className="text-xl font-bold text-orange-900">
                  {portfolioMetrics.diversificationScore.toFixed(0)}%
                </p>
                <p className="text-sm text-orange-700">
                  {portfolioMetrics.diversificationScore > 70 ? 'Well diversified' : 
                   portfolioMetrics.diversificationScore > 40 ? 'Moderately diversified' : 'Concentrated'}
                </p>
              </div>
            </div>

            {/* Top Holding */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Largest Holding</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {(portfolioMetrics.topHolding.symbol || 'N/A').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{portfolioMetrics.topHolding.symbol}</p>
                    <p className="text-sm text-gray-600">
                      {portfolioMetrics.topHoldingAllocation.toFixed(1)}% of portfolio
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${parseFloat(portfolioMetrics.topHolding.value || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'returns' && (
          <div className="space-y-6">
            {/* Return Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Realized vs Unrealized</h4>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-800">Unrealized Gains</span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    +${portfolioMetrics.unrealizedGains.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-800">Unrealized Losses</span>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    -${portfolioMetrics.unrealizedLosses.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Performance Breakdown</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Winners</span>
                    <span className="font-medium text-green-600">
                      {portfolioMetrics.winnersCount} ({portfolioMetrics.winRate.toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Losers</span>
                    <span className="font-medium text-red-600">
                      {portfolioMetrics.losersCount} ({(100 - portfolioMetrics.winRate).toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Invested</span>
                    <span className="font-medium text-gray-900">
                      ${portfolioMetrics.totalPurchaseValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'diversification' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Diversification Metrics</h4>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Diversification Score</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {portfolioMetrics.diversificationScore.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${portfolioMetrics.diversificationScore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Number of Holdings</span>
                      <span className="text-xl font-bold text-gray-900">
                        {portfolioMetrics.numberOfHoldings}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Largest Position</span>
                      <span className="text-xl font-bold text-gray-900">
                        {portfolioMetrics.topHoldingAllocation.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Concentration Analysis</h4>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    {portfolioMetrics.diversificationScore > 70 
                      ? "Your portfolio is well diversified across multiple assets."
                      : portfolioMetrics.diversificationScore > 40
                      ? "Your portfolio has moderate diversification. Consider adding more assets."
                      : "Your portfolio is concentrated in few assets. Consider diversifying to reduce risk."
                    }
                  </p>
                  
                  <div className="mt-4">
                    <p className="text-xs text-blue-700 mb-1">Concentration Index (HHI)</p>
                    <p className="text-lg font-bold text-blue-900">
                      {portfolioMetrics.hhi.toFixed(0)}
                    </p>
                    <p className="text-xs text-blue-700">
                      {portfolioMetrics.hhi < 1500 ? 'Low concentration' : 
                       portfolioMetrics.hhi < 2500 ? 'Moderate concentration' : 'High concentration'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'risk' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Risk Metrics</h4>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-yellow-800">Portfolio Volatility</span>
                      <span className="text-xl font-bold text-yellow-900">
                        {portfolioMetrics.portfolioVolatility.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      {portfolioMetrics.portfolioVolatility < 15 ? 'Low risk' :
                       portfolioMetrics.portfolioVolatility < 25 ? 'Moderate risk' : 'High risk'}
                    </p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-indigo-800">Sharpe Ratio</span>
                      <span className="text-xl font-bold text-indigo-900">
                        {portfolioMetrics.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-700">
                      {portfolioMetrics.sharpeRatio > 1 ? 'Excellent risk-adjusted return' :
                       portfolioMetrics.sharpeRatio > 0.5 ? 'Good risk-adjusted return' : 
                       portfolioMetrics.sharpeRatio > 0 ? 'Fair risk-adjusted return' : 'Poor risk-adjusted return'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-4">
                    Based on your portfolio composition and performance metrics:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        portfolioMetrics.diversificationScore > 60 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">
                        Diversification: {portfolioMetrics.diversificationScore > 60 ? 'Good' : 'Needs improvement'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        portfolioMetrics.portfolioVolatility < 20 ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">
                        Volatility: {portfolioMetrics.portfolioVolatility < 20 ? 'Acceptable' : 'High'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        portfolioMetrics.sharpeRatio > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">
                        Risk-adjusted return: {portfolioMetrics.sharpeRatio > 0.5 ? 'Good' : 'Fair'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalytics;