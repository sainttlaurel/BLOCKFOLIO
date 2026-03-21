import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PortfolioPerformanceChart = ({ 
  portfolioData = [], 
  timeframe = '7D',
  className = '',
  height = 300 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState(null);

  // Generate sample portfolio performance data
  const generatePortfolioData = (days) => {
    const data = [];
    const labels = [];
    const now = new Date();
    let baseValue = 10000; // Starting portfolio value

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic portfolio fluctuations
      const volatility = 0.02; // 2% daily volatility
      const trend = 0.001; // Slight upward trend
      const randomChange = (Math.random() - 0.5) * volatility;
      baseValue = baseValue * (1 + trend + randomChange);
      
      data.push(Math.round(baseValue * 100) / 100);
      
      // Format labels based on timeframe
      if (days <= 7) {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else if (days <= 30) {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      } else {
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      }
    }

    return { data, labels };
  };

  // Get number of days based on timeframe
  const getDaysFromTimeframe = (timeframe) => {
    switch (timeframe) {
      case '1D': return 1;
      case '7D': return 7;
      case '1M': return 30;
      case '3M': return 90;
      case '1Y': return 365;
      default: return 7;
    }
  };

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!chartData?.datasets?.[0]?.data?.length) return null;

    const data = chartData.datasets[0].data;
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const change = lastValue - firstValue;
    const changePercent = ((change / firstValue) * 100);

    return {
      change,
      changePercent,
      isPositive: change >= 0,
      firstValue,
      lastValue
    };
  }, [chartData]);

  // Update chart data when timeframe changes
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const days = getDaysFromTimeframe(timeframe);
      const { data, labels } = generatePortfolioData(days);
      
      const isPositive = data[data.length - 1] >= data[0];
      
      setChartData({
        labels,
        datasets: [
          {
            label: 'Portfolio Value',
            data,
            borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            backgroundColor: isPositive 
              ? 'rgba(34, 197, 94, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          }
        ]
      });
      
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [timeframe]);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => {
            return context[0].label;
          },
          label: (context) => {
            const value = context.parsed.y;
            return `Portfolio Value: $${value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
          maxTicksLimit: timeframe === '1D' ? 24 : 8,
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
          callback: (value) => {
            return '$' + value.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            });
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      }
    },
    animation: {
      duration: 750,
      easing: 'easeInOutQuart',
    }
  };

  if (isLoading) {
    return (
      <div className={`portfolio-performance-chart ${className}`}>
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`portfolio-performance-chart ${className}`}>
      {/* Performance Summary */}
      {performanceMetrics && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Portfolio Performance
            </h3>
            <p className="text-sm text-gray-600">{timeframe} Period</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${performanceMetrics.lastValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className={`text-sm font-medium ${
              performanceMetrics.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {performanceMetrics.isPositive ? '+' : ''}
              ${Math.abs(performanceMetrics.change).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} ({performanceMetrics.isPositive ? '+' : ''}
              {performanceMetrics.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="relative" style={{ height: `${height}px` }}>
        {chartData && (
          <Line 
            data={chartData} 
            options={options}
            className="portfolio-performance-line-chart"
          />
        )}
      </div>
    </div>
  );
};

export default PortfolioPerformanceChart;