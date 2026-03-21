import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Sparkline from './base/Sparkline';

const HoldingsWithSparklines = ({ holdings = [], totalPortfolioValue = 0 }) => {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h3>
        <p className="text-gray-500">No holdings found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" role="region" aria-label="Portfolio holdings with price trends">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Holdings</h3>
      <div className="space-y-4" role="list">
        {holdings.map((holding, index) => {
          const isPositive = holding.percentageChange >= 0;
          const allocation = totalPortfolioValue > 0 ? (holding.value / totalPortfolioValue) * 100 : 0;
          
          return (
            <div 
              key={holding.symbol || index} 
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              role="listitem"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center" aria-hidden="true">
                  <span className="text-xs font-medium text-gray-600">
                    {holding.symbol?.substring(0, 2) || 'N/A'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{holding.name || holding.symbol}</div>
                  <div className="text-sm text-gray-500">{holding.amount?.toFixed(4) || '0'} {holding.symbol}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-20 h-8">
                  <Sparkline 
                    data={holding.sparklineData || []} 
                    width={80} 
                    height={32}
                    color={isPositive ? '#10b981' : '#ef4444'}
                    ariaLabel={`${holding.name || holding.symbol} price trend: ${isPositive ? 'up' : 'down'} ${Math.abs(holding.percentageChange || 0).toFixed(2)}%`}
                  />
                </div>
                
                <div className="text-right">
                  <div className="font-medium text-gray-900" aria-label={`Current value: ${holding.value?.toLocaleString()} dollars`}>
                    ${holding.value?.toLocaleString() || '0'}
                  </div>
                  <div 
                    className={`text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}
                    role="status"
                    aria-label={`Price change: ${isPositive ? 'up' : 'down'} ${Math.abs(holding.percentageChange || 0).toFixed(2)} percent`}
                  >
                    {isPositive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
                    <span className="ml-1">
                      {isPositive ? '+' : ''}{holding.percentageChange?.toFixed(2) || '0'}%
                    </span>
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-500" aria-label={`Portfolio allocation: ${allocation.toFixed(1)} percent`}>
                  {allocation.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoldingsWithSparklines;