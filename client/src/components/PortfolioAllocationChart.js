import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const PortfolioAllocationChart = ({ 
  holdings = [], 
  totalPortfolioValue = 0,
  className = '',
  showLegend = true,
  size = 'md'
}) => {
  // Generate colors for each holding
  const generateColors = (count) => {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
      '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  // Process holdings data for chart
  const chartData = useMemo(() => {
    if (!holdings.length || totalPortfolioValue === 0) {
      return null;
    }

    // Calculate allocations and sort by value
    const processedHoldings = holdings
      .map(holding => {
        const value = parseFloat(holding.value || 0);
        const allocation = (value / totalPortfolioValue) * 100;
        return {
          ...holding,
          value,
          allocation
        };
      })
      .sort((a, b) => b.value - a.value);

    // Group small holdings (< 2%) into "Others"
    const significantHoldings = processedHoldings.filter(h => h.allocation >= 2);
    const smallHoldings = processedHoldings.filter(h => h.allocation < 2);
    
    const labels = significantHoldings.map(h => h.symbol || 'Unknown');
    const data = significantHoldings.map(h => h.allocation);
    
    if (smallHoldings.length > 0) {
      const othersAllocation = smallHoldings.reduce((sum, h) => sum + h.allocation, 0);
      labels.push('Others');
      data.push(othersAllocation);
    }

    const colors = generateColors(labels.length);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 4
        }
      ],
      processedHoldings: significantHoldings,
      smallHoldings
    };
  }, [holdings, totalPortfolioValue]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create a custom legend
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const absoluteValue = (value / 100) * totalPortfolioValue;
            return [
              `${label}: ${value.toFixed(1)}%`,
              `Value: $${absoluteValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            ];
          }
        }
      }
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  const sizeClasses = {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-80'
  };

  if (!chartData) {
    return (
      <div className={`portfolio-allocation-chart ${className}`}>
        <div className="text-center py-12">
          <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Allocation Data</h3>
          <p className="text-gray-600">Add holdings to see portfolio allocation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`portfolio-allocation-chart ${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <PieChart className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h3>
              <p className="text-sm text-gray-600">Asset distribution by value</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="relative">
            <div className={`relative ${sizeClasses[size]}`}>
              <Doughnut data={chartData} options={chartOptions} />
              
              {/* Center Label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${totalPortfolioValue.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Holdings Breakdown</h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {chartData.processedHoldings.map((holding, index) => {
                  const color = chartData.datasets[0].backgroundColor[index];
                  const isPositive = parseFloat(holding.change24h || 0) >= 0;
                  
                  return (
                    <div key={holding.symbol} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{holding.symbol}</p>
                          <p className="text-xs text-gray-500">
                            {parseFloat(holding.amount || 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4
                            })} {holding.symbol}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {holding.allocation.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          ${holding.value.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {/* Others group */}
                {chartData.smallHoldings.length > 0 && (
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: chartData.datasets[0].backgroundColor[chartData.datasets[0].backgroundColor.length - 1] }}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Others</p>
                        <p className="text-xs text-gray-500">
                          {chartData.smallHoldings.length} small holdings
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {chartData.smallHoldings.reduce((sum, h) => sum + h.allocation, 0).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        ${chartData.smallHoldings.reduce((sum, h) => sum + h.value, 0).toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Allocation Insights */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Allocation Insights</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700 uppercase tracking-wide mb-1">Largest Position</p>
              <p className="text-sm font-semibold text-blue-900">
                {chartData.processedHoldings[0]?.symbol} ({chartData.processedHoldings[0]?.allocation.toFixed(1)}%)
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-700 uppercase tracking-wide mb-1">Diversification</p>
              <p className="text-sm font-semibold text-green-900">
                {chartData.processedHoldings.length > 5 ? 'Well diversified' : 
                 chartData.processedHoldings.length > 2 ? 'Moderately diversified' : 'Concentrated'}
              </p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs text-purple-700 uppercase tracking-wide mb-1">Holdings Count</p>
              <p className="text-sm font-semibold text-purple-900">
                {holdings.length} total assets
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAllocationChart;