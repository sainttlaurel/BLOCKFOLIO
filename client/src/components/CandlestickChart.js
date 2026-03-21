import React, { useMemo } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useDegradationAware } from '../hooks/useGracefulDegradation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const CandlestickChart = ({ 
  data = [], 
  width = 800, 
  height = 400,
  showVolume = true,
  className = ''
}) => {
  const { 
    componentConfig, 
    shouldAnimate, 
    degradationLevel 
  } = useDegradationAware('CandlestickChart');

  // Apply degradation-aware data filtering
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Limit data points based on degradation level
    const maxDataPoints = componentConfig.dataPoints || data.length;
    if (data.length > maxDataPoints) {
      // Sample data to reduce load
      const step = Math.ceil(data.length / maxDataPoints);
      return data.filter((_, index) => index % step === 0);
    }
    
    return data;
  }, [data, componentConfig.dataPoints]);
  // Calculate chart statistics for accessibility
  const chartStats = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;
    
    const opens = processedData.map(d => d.o);
    const closes = processedData.map(d => d.c);
    const highs = processedData.map(d => d.h);
    const lows = processedData.map(d => d.l);
    
    const firstOpen = opens[0];
    const lastClose = closes[closes.length - 1];
    const highestPrice = Math.max(...highs);
    const lowestPrice = Math.min(...lows);
    const priceChange = lastClose - firstOpen;
    const priceChangePercent = ((priceChange / firstOpen) * 100).toFixed(2);
    const trend = priceChange >= 0 ? 'upward' : 'downward';
    
    const bullishCandles = processedData.filter(d => d.c >= d.o).length;
    const bearishCandles = processedData.filter(d => d.c < d.o).length;
    
    return {
      firstOpen,
      lastClose,
      highestPrice,
      lowestPrice,
      priceChange,
      priceChangePercent,
      trend,
      bullishCandles,
      bearishCandles,
      totalCandles: processedData.length
    };
  }, [processedData]);

  const chartData = useMemo(() => {
    if (!processedData || processedData.length === 0) return { datasets: [] };

    // Create candlestick visualization using bar charts
    const candlestickData = processedData.map((candle, index) => {
      const isGreen = candle.c >= candle.o;
      return {
        x: candle.x || index,
        y: [candle.l, candle.o, candle.c, candle.h], // [low, open, close, high]
        o: candle.o,
        h: candle.h,
        l: candle.l,
        c: candle.c,
        v: candle.v,
        color: isGreen ? '#10b981' : '#ef4444', // Green for bullish, red for bearish
        borderColor: isGreen ? '#059669' : '#dc2626'
      };
    });

    const datasets = [];

    // High-Low lines (wicks)
    datasets.push({
      label: 'High-Low',
      type: 'line',
      data: candlestickData.map(d => ({ x: d.x, y: d.h })),
      borderColor: 'rgba(107, 114, 128, 0.6)',
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      showLine: false,
      order: 1
    });

    datasets.push({
      label: 'Low Line',
      type: 'line',
      data: candlestickData.map(d => ({ x: d.x, y: d.l })),
      borderColor: 'rgba(107, 114, 128, 0.6)',
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      showLine: false,
      order: 1
    });

    // Open-Close bodies (candle bodies)
    const greenCandles = candlestickData
      .filter(d => d.c >= d.o)
      .map(d => ({ x: d.x, y: Math.abs(d.c - d.o), base: Math.min(d.o, d.c) }));
    
    const redCandles = candlestickData
      .filter(d => d.c < d.o)
      .map(d => ({ x: d.x, y: Math.abs(d.c - d.o), base: Math.min(d.o, d.c) }));

    if (greenCandles.length > 0) {
      datasets.push({
        label: 'Bullish Candles',
        type: 'bar',
        data: greenCandles,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#059669',
        borderWidth: 1,
        barThickness: 8,
        order: 2
      });
    }

    if (redCandles.length > 0) {
      datasets.push({
        label: 'Bearish Candles',
        type: 'bar',
        data: redCandles,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#dc2626',
        borderWidth: 1,
        barThickness: 8,
        order: 2
      });
    }

    // Volume bars (if enabled and not in minimal mode)
    if (showVolume && componentConfig.enableTooltips) {
      datasets.push({
        label: 'Volume',
        type: 'bar',
        data: candlestickData.map(d => ({ x: d.x, y: d.v })),
        backgroundColor: candlestickData.map(d => 
          d.c >= d.o ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        ),
        borderColor: candlestickData.map(d => 
          d.c >= d.o ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
        ),
        borderWidth: 1,
        yAxisID: 'volume',
        barThickness: 4,
        order: 3
      });
    }

    return { datasets };
  }, [processedData, showVolume, componentConfig.enableTooltips]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: shouldAnimate ? {
      duration: componentConfig.renderQuality === 'high' ? 750 : 300,
      easing: 'easeInOutQuart'
    } : false,
    interaction: {
      mode: componentConfig.enableTooltips ? 'index' : 'none',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          filter: (legendItem) => {
            // Hide individual wick lines from legend
            return !['High-Low', 'Low Line'].includes(legendItem.text);
          },
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, sans-serif'
          }
        }
      },
      tooltip: {
        enabled: componentConfig.enableTooltips,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const dataIndex = context[0].dataIndex;
            const candle = processedData[dataIndex];
            return candle?.x || `Candle ${dataIndex + 1}`;
          },
          label: (context) => {
            const dataIndex = context.dataIndex;
            const candle = processedData[dataIndex];
            
            if (!candle) return '';
            
            if (context.dataset.label === 'Volume') {
              return `Volume: ${(candle.v / 1000000).toFixed(2)}M`;
            }
            
            return [
              `Open: $${candle.o.toLocaleString()}`,
              `High: $${candle.h.toLocaleString()}`,
              `Low: $${candle.l.toLocaleString()}`,
              `Close: $${candle.c.toLocaleString()}`,
              `Change: ${candle.c >= candle.o ? '+' : ''}${((candle.c - candle.o) / candle.o * 100).toFixed(2)}%`
            ];
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
            size: 11,
            family: 'Inter, sans-serif'
          },
          maxTicksLimit: 10
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
            size: 11,
            family: 'Inter, sans-serif'
          },
          callback: (value) => `$${value.toLocaleString()}`
        }
      },
      volume: {
        type: 'linear',
        position: 'left',
        display: showVolume && componentConfig.enableTooltips,
        max: (context) => {
          if (!showVolume || !processedData.length) return undefined;
          const maxVolume = Math.max(...processedData.map(d => d.v || 0));
          return maxVolume * 4; // Make volume bars smaller relative to price
        },
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    }
  };

  // Generate accessible description for the chart
  const getChartDescription = () => {
    if (!chartStats) return 'Candlestick chart with no data';
    
    return `Candlestick chart showing ${chartStats.totalCandles} periods. ` +
           `Price ${chartStats.trend} from $${chartStats.firstOpen.toLocaleString()} to $${chartStats.lastClose.toLocaleString()}, ` +
           `a change of ${chartStats.priceChangePercent}%. ` +
           `Range: $${chartStats.lowestPrice.toLocaleString()} to $${chartStats.highestPrice.toLocaleString()}. ` +
           `${chartStats.bullishCandles} bullish candles (green), ${chartStats.bearishCandles} bearish candles (red).` +
           (showVolume ? ' Volume bars displayed below price action.' : '');
  };

  return (
    <div 
      className={`candlestick-chart relative ${className}`} 
      style={{ width, height }}
      role="region"
      aria-label="Candlestick price chart"
    >
      {degradationLevel !== 'full' && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs" role="status">
          {degradationLevel === 'offline' ? 'Offline Mode' : 
           degradationLevel === 'minimal' ? 'Minimal Mode' : 'Reduced Mode'}
        </div>
      )}
      <div role="img" aria-label={getChartDescription()}>
        <Chart type="bar" data={chartData} options={options} aria-hidden="true" />
      </div>
      
      {/* Text alternative for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {chartStats && (
          <>
            <p>{getChartDescription()}</p>
            <p>
              Each candlestick shows: opening price, closing price, highest price, and lowest price for the period.
              Green candles indicate price increased (bullish), red candles indicate price decreased (bearish).
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CandlestickChart;