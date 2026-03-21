import React, { useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const InteractivePriceChart = ({ 
  symbol = 'BTC',
  data = [],
  timeframe = '1D',
  onTimeframeChange,
  className = '',
  height = 400
}) => {
  const chartRef = useRef(null);
  const [indicators, setIndicators] = useState({
    sma: false,
    ema: false,
    rsi: false,
    macd: false
  });

  // Generate mock data if none provided
  const mockData = data.length > 0 ? data : generateMockData();

  function generateMockData() {
    const points = [];
    let price = 43000;
    
    for (let i = 0; i < 24; i++) {
      price += (Math.random() - 0.5) * 1000;
      points.push({
        x: new Date(Date.now() - (24 - i) * 60 * 60 * 1000).toISOString(),
        y: price
      });
    }
    
    return points;
  }

  const chartData = {
    labels: mockData.map(point => new Date(point.x).toLocaleTimeString()),
    datasets: [
      {
        label: `${symbol} Price`,
        data: mockData.map(point => point.y),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: `${symbol} Price Chart - ${timeframe}`
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const timeframes = ['1H', '4H', '1D', '1W', '1M'];

  const toggleIndicator = (indicator) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: !prev[indicator]
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {symbol} Price Chart
            </h3>
            <div className="flex space-x-2">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange && onTimeframeChange(tf)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleIndicator('sma')}
              className={`px-2 py-1 text-xs rounded ${
                indicators.sma ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              SMA
            </button>
            <button
              onClick={() => toggleIndicator('rsi')}
              className={`px-2 py-1 text-xs rounded ${
                indicators.rsi ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              RSI
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="p-4">
        <div style={{ height: `${height}px` }}>
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      </div>

      {/* Chart Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div>
            Current: ${mockData[mockData.length - 1]?.y.toLocaleString() || '0'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractivePriceChart;