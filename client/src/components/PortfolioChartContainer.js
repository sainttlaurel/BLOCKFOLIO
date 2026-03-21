import React, { useState, useEffect } from 'react';
import PortfolioPerformanceChart from './PortfolioPerformanceChart';
import TimeframeSelector from './TimeframeSelector';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const PortfolioChartContainer = ({ 
  className = '',
  portfolioValue = 0,
  portfolioHoldings = []
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7D');
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate portfolio data processing
  const processPortfolioData = async (timeframe) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate historical portfolio data based on current holdings
    const generateHistoricalData = (days) => {
      const data = [];
      const baseValue = portfolioValue || 10000;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate portfolio value changes
        const volatility = 0.015; // 1.5% daily volatility
        const trend = 0.0005; // Slight upward trend
        const randomFactor = (Math.random() - 0.5) * volatility;
        const dayValue = baseValue * (1 + (trend * i) + randomFactor);
        
        data.push({
          date: date.toISOString(),
          value: Math.max(dayValue, baseValue * 0.8), // Prevent extreme losses
          timestamp: date.getTime()
        });
      }
      
      return data;
    };

    const getDaysFromTimeframe = (tf) => {
      switch (tf) {
        case '1D': return 1;
        case '7D': return 7;
        case '1M': return 30;
        case '3M': return 90;
        case '1Y': return 365;
        default: return 7;
      }
    };

    const days = getDaysFromTimeframe(timeframe);
    const historicalData = generateHistoricalData(days);
    
    setPortfolioHistory(historicalData);
    setIsLoading(false);
  };

  // Process data when timeframe changes
  useEffect(() => {
    processPortfolioData(selectedTimeframe);
  }, [selectedTimeframe, portfolioValue]);

  const handleTimeframeChange = (newTimeframe) => {
    setSelectedTimeframe(newTimeframe);
  };

  // Calculate performance metrics
  const getPerformanceMetrics = () => {
    if (portfolioHistory.length < 2) return null;

    const firstValue = portfolioHistory[0].value;
    const lastValue = portfolioHistory[portfolioHistory.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;

    return {
      change,
      changePercent,
      isPositive: change >= 0,
      firstValue,
      lastValue
    };
  };

  const metrics = getPerformanceMetrics();

  return (
    <div className={`portfolio-chart-container bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Portfolio Performance
              </h2>
              <p className="text-sm text-gray-600">
                Track your portfolio value over time
              </p>
            </div>
          </div>
          
          {/* Timeframe Selector */}
          <TimeframeSelector
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={handleTimeframeChange}
            size="sm"
          />
        </div>

        {/* Performance Summary */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded ${
                  metrics.isPositive ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {metrics.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    {selectedTimeframe} Change
                  </p>
                  <p className={`text-lg font-semibold ${
                    metrics.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metrics.isPositive ? '+' : ''}
                    ${Math.abs(metrics.change).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                Percentage Change
              </p>
              <p className={`text-lg font-semibold ${
                metrics.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {metrics.isPositive ? '+' : ''}{metrics.changePercent.toFixed(2)}%
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                Current Value
              </p>
              <p className="text-lg font-semibold text-gray-900">
                ${metrics.lastValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading portfolio data...</p>
            </div>
          </div>
        ) : (
          <PortfolioPerformanceChart
            portfolioData={portfolioHistory}
            timeframe={selectedTimeframe}
            height={320}
          />
        )}
      </div>

      {/* Chart Info */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Portfolio Insights
              </h4>
              <p className="text-xs text-blue-700">
                This chart shows your portfolio's historical performance. 
                Hover over data points to see detailed values and use the timeframe 
                buttons to analyze different periods.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChartContainer;