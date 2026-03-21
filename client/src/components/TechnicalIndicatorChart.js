import React, { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import chartDataService from '../services/chartDataService';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/technicalIndicators';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Tooltip,
  Legend
);

const TechnicalIndicatorChart = ({ 
  data = [], 
  symbol = 'BTC',
  timeframe = '1D',
  indicator = 'RSI', 
  height = 200,
  className = ''
}) => {
  const chartData = useMemo(() => {
    // Use provided data or generate sample data
    const indicatorData = data.length > 0 ? data : chartDataService.generateSampleOHLCVData(symbol, timeframe, 100);
    
    if (!indicatorData || indicatorData.length === 0) return { datasets: [] };
    
    const closePrices = indicatorData.map(d => d.c);
    const labels = indicatorData.map(d => d.x);
    
    const datasets = [];
    
    switch (indicator) {
      case 'RSI':
        const rsi = calculateRSI(closePrices, 14);
        const rsiData = rsi.map((value, index) => ({
          x: labels[index + 14], // RSI starts after 14 periods
          y: value
        })).filter(d => d.x !== undefined);
        
        datasets.push({
          label: 'RSI (14)',
          data: rsiData,
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0
        });
        
        // Add overbought/oversold lines
        datasets.push({
          label: 'Overbought (70)',
          data: rsiData.map(d => ({ x: d.x, y: 70 })),
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        });
        
        datasets.push({
          label: 'Oversold (30)',
          data: rsiData.map(d => ({ x: d.x, y: 30 })),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        });
        break;
        
      case 'MACD':
        const macd = calculateMACD(closePrices);
        const macdStartIndex = closePrices.length - macd.macd.length;
        
        // MACD Line
        datasets.push({
          label: 'MACD',
          data: macd.macd.map((value, index) => ({
            x: labels[macdStartIndex + index],
            y: value
          })),
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0
        });
        
        // Signal Line
        const signalStartIndex = macd.macd.length - macd.signal.length;
        datasets.push({
          label: 'Signal',
          data: macd.signal.map((value, index) => ({
            x: labels[macdStartIndex + signalStartIndex + index],
            y: value
          })),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 0
        });
        
        // Histogram
        const histogramStartIndex = macd.macd.length - macd.histogram.length;
        datasets.push({
          label: 'Histogram',
          type: 'bar',
          data: macd.histogram.map((value, index) => ({
            x: labels[macdStartIndex + histogramStartIndex + index],
            y: value
          })),
          backgroundColor: macd.histogram.map(value => 
            value >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
          ),
          borderColor: macd.histogram.map(value => 
            value >= 0 ? '#10b981' : '#ef4444'
          ),
          borderWidth: 1,
          barThickness: 4
        });
        break;
        
      case 'BOLLINGER':
        const bb = calculateBollingerBands(closePrices, 20, 2);
        const bbStartIndex = closePrices.length - bb.upper.length;
        
        // Upper Band
        datasets.push({
          label: 'Upper Band',
          data: bb.upper.map((value, index) => ({
            x: labels[bbStartIndex + index],
            y: value
          })),
          borderColor: '#ef4444',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0
        });
        
        // Middle Band (SMA)
        datasets.push({
          label: 'Middle Band (SMA)',
          data: bb.middle.map((value, index) => ({
            x: labels[bbStartIndex + index],
            y: value
          })),
          borderColor: '#6b7280',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          pointRadius: 0
        });
        
        // Lower Band
        datasets.push({
          label: 'Lower Band',
          data: bb.lower.map((value, index) => ({
            x: labels[bbStartIndex + index],
            y: value
          })),
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderWidth: 1,
          fill: false,
          pointRadius: 0
        });
        
        // Price line for context
        datasets.push({
          label: 'Price',
          data: indicatorData.slice(bbStartIndex).map((d, index) => ({
            x: labels[bbStartIndex + index],
            y: d.c
          })),
          borderColor: '#3b82f6',
          backgroundColor: 'transparent',
          borderWidth: 2,
          fill: false,
          pointRadius: 0
        });
        break;
        
      default:
        break;
    }
    
    return { datasets };
  }, [data, symbol, timeframe, indicator]);

  const getYAxisConfig = () => {
    switch (indicator) {
      case 'RSI':
        return {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: (value) => `${value}`
          }
        };
      case 'MACD':
        return {
          ticks: {
            callback: (value) => value.toFixed(4)
          }
        };
      case 'BOLLINGER':
        return {
          ticks: {
            callback: (value) => `$${value.toLocaleString()}`
          }
        };
      default:
        return {};
    }
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            family: 'Inter, sans-serif'
          }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (indicator === 'RSI') {
              return `${context.dataset.label}: ${value.toFixed(2)}`;
            } else if (indicator === 'MACD') {
              return `${context.dataset.label}: ${value.toFixed(4)}`;
            } else if (indicator === 'BOLLINGER') {
              return `${context.dataset.label}: $${value.toLocaleString()}`;
            }
            return `${context.dataset.label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
            family: 'Inter, sans-serif'
          },
          maxTicksLimit: 8
        }
      },
      y: {
        type: 'linear',
        position: 'right',
        grid: {
          display: true,
          color: 'rgba(156, 163, 175, 0.1)'
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 10,
            family: 'Inter, sans-serif'
          },
          ...getYAxisConfig().ticks
        },
        ...getYAxisConfig()
      }
    }
  };

  return (
    <div className={`technical-indicator-chart ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">{indicator}</h4>
        <div className="text-xs text-gray-500">
          {indicator === 'RSI' && 'Relative Strength Index'}
          {indicator === 'MACD' && 'Moving Average Convergence Divergence'}
          {indicator === 'BOLLINGER' && 'Bollinger Bands'}
        </div>
      </div>
      <div style={{ height: `${height}px` }}>
        <Chart type="line" data={chartData} options={options} />
      </div>
    </div>
  );
};

export default TechnicalIndicatorChart;