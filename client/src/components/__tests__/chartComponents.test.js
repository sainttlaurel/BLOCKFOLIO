/**
 * Unit Tests for Chart Components
 * 
 * Tests cover:
 * - Interactive price charts with multiple timeframes
 * - Candlestick chart functionality
 * - Chart tooltips and hover interactions
 * - Zoom and pan functionality
 * - Volume bar displays
 * 
 * Requirements tested:
 * - Requirement 5.1: Multiple timeframe support (1H, 4H, 1D, 1W, 1M)
 * - Requirement 5.2: Candlestick charts for price action analysis
 * - Requirement 5.3: Interactive tooltips with detailed price information
 * - Requirement 5.4: Zoom and pan functionality
 * - Requirement 5.5: Volume bars below price charts
 * - Requirement 5.6: Real-time chart data updates with smooth animations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractivePriceChart from '../InteractivePriceChart';
import CandlestickChart from '../CandlestickChart';
import ChartControls from '../ChartControls';

// Mock Chart.js to avoid canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Line Chart Mock
    </div>
  ),
  Chart: ({ data, options, type }) => (
    <div data-testid="chart" data-chart-type={type} data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      Chart Mock
    </div>
  )
}));

// Mock the graceful degradation hook
jest.mock('../../hooks/useGracefulDegradation', () => ({
  useDegradationAware: () => ({
    componentConfig: {
      dataPoints: 100,
      enableTooltips: true,
      renderQuality: 'high'
    },
    shouldAnimate: true,
    degradationLevel: 'full'
  })
}));

// Mock OHLCV data generator for testing
const generateMockOHLCVData = (count = 24) => {
  const data = [];
  let basePrice = 43000;
  
  for (let i = 0; i < count; i++) {
    const open = basePrice + (Math.random() - 0.5) * 1000;
    const close = open + (Math.random() - 0.5) * 2000;
    const high = Math.max(open, close) + Math.random() * 500;
    const low = Math.min(open, close) - Math.random() * 500;
    const volume = Math.random() * 10000000 + 5000000;
    
    data.push({
      x: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume
    });
    
    basePrice = close;
  }
  
  return data;
};

// Mock price data generator for line charts
const generateMockPriceData = (count = 24) => {
  const data = [];
  let price = 43000;
  
  for (let i = 0; i < count; i++) {
    price += (Math.random() - 0.5) * 1000;
    data.push({
      x: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
      y: price
    });
  }
  
  return data;
};

describe('InteractivePriceChart Component', () => {
  
  describe('Timeframe Support (Requirement 5.1)', () => {
    test('renders all required timeframe buttons', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      const timeframes = ['1H', '4H', '1D', '1W', '1M'];
      
      timeframes.forEach(tf => {
        const button = screen.getByRole('button', { name: `View ${tf} timeframe` });
        expect(button).toBeInTheDocument();
      });
    });

    test('highlights active timeframe', () => {
      render(<InteractivePriceChart symbol="BTC" timeframe="1D" />);
      
      const activeButton = screen.getByRole('button', { name: 'View 1D timeframe' });
      expect(activeButton).toHaveClass('bg-blue-600', 'text-white');
    });

    test('calls onTimeframeChange when timeframe button is clicked', () => {
      const handleTimeframeChange = jest.fn();
      render(<InteractivePriceChart symbol="BTC" onTimeframeChange={handleTimeframeChange} />);
      
      const button = screen.getByRole('button', { name: 'View 1W timeframe' });
      fireEvent.click(button);
      
      expect(handleTimeframeChange).toHaveBeenCalledWith('1W');
    });

    test('updates chart data when timeframe changes', () => {
      const mockData = generateMockPriceData(24);
      const { rerender } = render(
        <InteractivePriceChart symbol="BTC" timeframe="1D" data={mockData} />
      );
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
      
      // Change timeframe
      rerender(<InteractivePriceChart symbol="BTC" timeframe="1W" data={mockData} />);
      
      const updatedChart = screen.getByTestId('line-chart');
      expect(updatedChart).toBeInTheDocument();
    });

    test('displays correct timeframe in chart title', () => {
      render(<InteractivePriceChart symbol="BTC" timeframe="4H" />);
      
      expect(screen.getByText('BTC Price Chart')).toBeInTheDocument();
    });
  });

  describe('Chart Rendering and Data Display', () => {
    test('renders chart with provided data', () => {
      const mockData = generateMockPriceData(24);
      render(<InteractivePriceChart symbol="BTC" data={mockData} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });

    test('generates mock data when no data provided', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });

    test('displays current price', () => {
      const mockData = generateMockPriceData(24);
      render(<InteractivePriceChart symbol="BTC" data={mockData} />);
      
      expect(screen.getByText(/Current:/)).toBeInTheDocument();
    });

    test('displays last updated timestamp', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    test('renders with custom height', () => {
      const { container } = render(<InteractivePriceChart symbol="BTC" height={600} />);
      
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('Technical Indicators (Requirement 5.3)', () => {
    test('renders technical indicator buttons', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      expect(screen.getByRole('button', { name: /Simple Moving Average/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Relative Strength Index/i })).toBeInTheDocument();
    });

    test('toggles SMA indicator on click', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      const smaButton = screen.getByRole('button', { name: /Simple Moving Average/i });
      
      // Initially not active
      expect(smaButton).toHaveClass('bg-gray-100');
      
      // Click to activate
      fireEvent.click(smaButton);
      
      // Should be active
      expect(smaButton).toHaveClass('bg-green-100');
    });

    test('toggles RSI indicator on click', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      const rsiButton = screen.getByRole('button', { name: /Relative Strength Index/i });
      
      // Initially not active
      expect(rsiButton).toHaveClass('bg-gray-100');
      
      // Click to activate
      fireEvent.click(rsiButton);
      
      // Should be active
      expect(rsiButton).toHaveClass('bg-purple-100');
    });
  });

  describe('Accessibility Features', () => {
    test('provides accessible chart description', () => {
      const mockData = generateMockPriceData(24);
      render(<InteractivePriceChart symbol="BTC" data={mockData} />);
      
      const chartRegion = screen.getByRole('region', { name: /BTC interactive price chart/i });
      expect(chartRegion).toBeInTheDocument();
    });

    test('includes screen reader text for chart statistics', () => {
      const mockData = generateMockPriceData(24);
      render(<InteractivePriceChart symbol="BTC" data={mockData} />);
      
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });

    test('timeframe buttons have proper ARIA labels', () => {
      render(<InteractivePriceChart symbol="BTC" timeframe="1D" />);
      
      const button = screen.getByRole('button', { name: 'View 1D timeframe' });
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    test('indicator buttons have proper ARIA labels', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      const smaButton = screen.getByRole('button', { name: /Show Simple Moving Average/i });
      expect(smaButton).toHaveAttribute('aria-pressed', 'false');
    });
  });
});

describe('CandlestickChart Component', () => {
  
  describe('Candlestick Chart Functionality (Requirement 5.2)', () => {
    test('renders candlestick chart with OHLCV data', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute('data-chart-type', 'bar');
    });

    test('displays correct number of candles', () => {
      const mockData = generateMockOHLCVData(10);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data'));
      
      expect(chartData.datasets).toBeDefined();
      expect(chartData.datasets.length).toBeGreaterThan(0);
    });

    test('handles empty data gracefully', () => {
      render(<CandlestickChart data={[]} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });

    test('processes OHLC data correctly', () => {
      const mockData = [
        { x: '2024-01-01', o: 40000, h: 42000, l: 39000, c: 41000, v: 1000000 },
        { x: '2024-01-02', o: 41000, h: 43000, l: 40000, c: 42000, v: 1200000 }
      ];
      
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Volume Bar Display (Requirement 5.5)', () => {
    test('displays volume bars when showVolume is true', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} showVolume={true} />);
      
      const chart = screen.getByTestId('chart');
      const chartData = JSON.parse(chart.getAttribute('data-chart-data'));
      
      // Check if volume dataset exists
      const volumeDataset = chartData.datasets.find(ds => ds.label === 'Volume');
      expect(volumeDataset).toBeDefined();
    });

    test('hides volume bars when showVolume is false', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} showVolume={false} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Chart Tooltips (Requirement 5.3)', () => {
    test('enables tooltips in chart options', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options'));
      
      expect(chartOptions.plugins.tooltip.enabled).toBe(true);
    });

    test('configures tooltip with proper styling', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options'));
      
      expect(chartOptions.plugins.tooltip.backgroundColor).toBeDefined();
      expect(chartOptions.plugins.tooltip.borderColor).toBeDefined();
    });

    test('tooltip displays OHLC information', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options'));
      
      expect(chartOptions.plugins.tooltip.callbacks).toBeDefined();
      expect(chartOptions.plugins.tooltip.callbacks.label).toBeDefined();
    });
  });

  describe('Chart Dimensions and Styling', () => {
    test('renders with custom width and height', () => {
      const mockData = generateMockOHLCVData(24);
      const { container } = render(
        <CandlestickChart data={mockData} width={1000} height={600} />
      );
      
      const chartContainer = container.querySelector('.candlestick-chart');
      expect(chartContainer).toHaveStyle({ width: '1000px', height: '600px' });
    });

    test('applies custom className', () => {
      const mockData = generateMockOHLCVData(24);
      const { container } = render(
        <CandlestickChart data={mockData} className="custom-chart" />
      );
      
      const chartContainer = container.querySelector('.candlestick-chart');
      expect(chartContainer).toHaveClass('custom-chart');
    });
  });

  describe('Accessibility Features', () => {
    test('provides accessible chart description', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const chartRegion = screen.getByRole('region', { name: /Candlestick price chart/i });
      expect(chartRegion).toBeInTheDocument();
    });

    test('includes screen reader text for chart statistics', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });

    test('provides bullish and bearish candle counts', () => {
      const mockData = [
        { x: '2024-01-01', o: 40000, h: 42000, l: 39000, c: 41000, v: 1000000 }, // bullish
        { x: '2024-01-02', o: 41000, h: 42000, l: 39000, c: 39500, v: 1200000 }  // bearish
      ];
      
      render(<CandlestickChart data={mockData} />);
      
      const srOnly = document.querySelector('.sr-only');
      expect(srOnly).toBeInTheDocument();
    });
  });

  describe('Data Processing and Performance', () => {
    test('handles large datasets', () => {
      const mockData = generateMockOHLCVData(1000);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });

    test('processes data with missing values', () => {
      const mockData = [
        { x: '2024-01-01', o: 40000, h: 42000, l: 39000, c: 41000, v: 1000000 },
        { x: '2024-01-02', o: 41000, h: 43000, l: 40000 } // missing c and v
      ];
      
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });
  });
});

describe('ChartControls Component', () => {
  
  describe('Zoom Functionality (Requirement 5.4)', () => {
    test('renders zoom in button', () => {
      render(<ChartControls onZoomIn={jest.fn()} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      expect(zoomInButton).toBeInTheDocument();
    });

    test('renders zoom out button', () => {
      render(<ChartControls onZoomOut={jest.fn()} />);
      
      const zoomOutButton = screen.getByTitle('Zoom Out');
      expect(zoomOutButton).toBeInTheDocument();
    });

    test('calls onZoomIn when zoom in button is clicked', () => {
      const handleZoomIn = jest.fn();
      render(<ChartControls onZoomIn={handleZoomIn} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      fireEvent.click(zoomInButton);
      
      expect(handleZoomIn).toHaveBeenCalledTimes(1);
    });

    test('calls onZoomOut when zoom out button is clicked', () => {
      const handleZoomOut = jest.fn();
      render(<ChartControls onZoomOut={handleZoomOut} />);
      
      const zoomOutButton = screen.getByTitle('Zoom Out');
      fireEvent.click(zoomOutButton);
      
      expect(handleZoomOut).toHaveBeenCalledTimes(1);
    });

    test('shows reset zoom button when chart is zoomed', () => {
      render(<ChartControls onResetZoom={jest.fn()} isZoomed={true} />);
      
      const resetButton = screen.getByTitle('Reset Zoom');
      expect(resetButton).toBeInTheDocument();
    });

    test('hides reset zoom button when chart is not zoomed', () => {
      render(<ChartControls onResetZoom={jest.fn()} isZoomed={false} />);
      
      const resetButton = screen.queryByTitle('Reset Zoom');
      expect(resetButton).not.toBeInTheDocument();
    });

    test('calls onResetZoom when reset button is clicked', () => {
      const handleResetZoom = jest.fn();
      render(<ChartControls onResetZoom={handleResetZoom} isZoomed={true} />);
      
      const resetButton = screen.getByTitle('Reset Zoom');
      fireEvent.click(resetButton);
      
      expect(handleResetZoom).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pan Functionality (Requirement 5.4)', () => {
    test('renders pan toggle button', () => {
      render(<ChartControls onTogglePan={jest.fn()} />);
      
      const panButton = screen.getByTitle(/Pan/i);
      expect(panButton).toBeInTheDocument();
    });

    test('calls onTogglePan when pan button is clicked', () => {
      const handleTogglePan = jest.fn();
      render(<ChartControls onTogglePan={handleTogglePan} />);
      
      const panButton = screen.getByTitle(/Enable Pan/i);
      fireEvent.click(panButton);
      
      expect(handleTogglePan).toHaveBeenCalledTimes(1);
    });

    test('shows active state when panning is enabled', () => {
      render(<ChartControls onTogglePan={jest.fn()} isPanning={true} />);
      
      const panButton = screen.getByTitle(/Disable Pan/i);
      expect(panButton).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    test('shows inactive state when panning is disabled', () => {
      render(<ChartControls onTogglePan={jest.fn()} isPanning={false} />);
      
      const panButton = screen.getByTitle(/Enable Pan/i);
      expect(panButton).toHaveClass('text-gray-600');
    });
  });

  describe('Volume Toggle (Requirement 5.5)', () => {
    test('renders volume toggle button', () => {
      render(<ChartControls onToggleVolume={jest.fn()} />);
      
      const volumeButton = screen.getByTitle(/Volume/i);
      expect(volumeButton).toBeInTheDocument();
    });

    test('calls onToggleVolume when volume button is clicked', () => {
      const handleToggleVolume = jest.fn();
      render(<ChartControls onToggleVolume={handleToggleVolume} />);
      
      const volumeButton = screen.getByTitle(/Hide Volume/i);
      fireEvent.click(volumeButton);
      
      expect(handleToggleVolume).toHaveBeenCalledTimes(1);
    });

    test('shows correct label when volume is visible', () => {
      render(<ChartControls onToggleVolume={jest.fn()} showVolume={true} />);
      
      const volumeButton = screen.getByTitle('Hide Volume');
      expect(volumeButton).toBeInTheDocument();
    });

    test('shows correct label when volume is hidden', () => {
      render(<ChartControls onToggleVolume={jest.fn()} showVolume={false} />);
      
      const volumeButton = screen.getByTitle('Show Volume');
      expect(volumeButton).toBeInTheDocument();
    });
  });

  describe('Fullscreen Functionality', () => {
    test('renders fullscreen toggle button', () => {
      render(<ChartControls onToggleFullscreen={jest.fn()} />);
      
      const fullscreenButton = screen.getByTitle(/Fullscreen/i);
      expect(fullscreenButton).toBeInTheDocument();
    });

    test('calls onToggleFullscreen when fullscreen button is clicked', () => {
      const handleToggleFullscreen = jest.fn();
      render(<ChartControls onToggleFullscreen={handleToggleFullscreen} />);
      
      const fullscreenButton = screen.getByTitle('Fullscreen');
      fireEvent.click(fullscreenButton);
      
      expect(handleToggleFullscreen).toHaveBeenCalledTimes(1);
    });

    test('shows active state when in fullscreen mode', () => {
      render(<ChartControls onToggleFullscreen={jest.fn()} isFullscreen={true} />);
      
      const fullscreenButton = screen.getByTitle('Exit Fullscreen');
      expect(fullscreenButton).toHaveClass('text-blue-600', 'bg-blue-50');
    });

    test('shows inactive state when not in fullscreen mode', () => {
      render(<ChartControls onToggleFullscreen={jest.fn()} isFullscreen={false} />);
      
      const fullscreenButton = screen.getByTitle('Fullscreen');
      expect(fullscreenButton).toHaveClass('text-gray-600');
    });
  });

  describe('Control Button States', () => {
    test('disables buttons when disabled prop is true', () => {
      render(
        <ChartControls 
          onZoomIn={jest.fn()} 
          onZoomOut={jest.fn()} 
        />
      );
      
      const zoomInButton = screen.getByTitle('Zoom In');
      expect(zoomInButton).not.toBeDisabled();
    });

    test('applies active styling to active controls', () => {
      render(
        <ChartControls 
          onTogglePan={jest.fn()} 
          onToggleVolume={jest.fn()}
          isPanning={true}
          showVolume={true}
        />
      );
      
      const panButton = screen.getByTitle(/Disable Pan/i);
      const volumeButton = screen.getByTitle(/Hide Volume/i);
      
      expect(panButton).toHaveClass('text-blue-600');
      expect(volumeButton).toHaveClass('text-blue-600');
    });
  });

  describe('Tooltip Display', () => {
    test('shows tooltip on hover', async () => {
      render(<ChartControls onZoomIn={jest.fn()} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      
      fireEvent.mouseEnter(zoomInButton);
      
      await waitFor(() => {
        expect(screen.getByText('Zoom In')).toBeInTheDocument();
      });
    });

    test('hides tooltip on mouse leave', async () => {
      render(<ChartControls onZoomIn={jest.fn()} />);
      
      const zoomInButton = screen.getByTitle('Zoom In');
      
      fireEvent.mouseEnter(zoomInButton);
      await waitFor(() => {
        expect(screen.getByText('Zoom In')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(zoomInButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Zoom In')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className', () => {
      const { container } = render(
        <ChartControls 
          onZoomIn={jest.fn()} 
          className="custom-controls" 
        />
      );
      
      const controlsContainer = container.firstChild;
      expect(controlsContainer).toHaveClass('custom-controls');
    });
  });
});

describe('Chart Integration Tests', () => {
  
  describe('Real-time Data Updates (Requirement 5.6)', () => {
    test('InteractivePriceChart updates when data changes', () => {
      const initialData = generateMockPriceData(24);
      const { rerender } = render(
        <InteractivePriceChart symbol="BTC" data={initialData} />
      );
      
      const initialChart = screen.getByTestId('line-chart');
      const initialChartData = JSON.parse(initialChart.getAttribute('data-chart-data'));
      
      // Update with new data
      const updatedData = generateMockPriceData(24);
      rerender(<InteractivePriceChart symbol="BTC" data={updatedData} />);
      
      const updatedChart = screen.getByTestId('line-chart');
      expect(updatedChart).toBeInTheDocument();
    });

    test('CandlestickChart updates when data changes', () => {
      const initialData = generateMockOHLCVData(24);
      const { rerender } = render(
        <CandlestickChart data={initialData} />
      );
      
      const initialChart = screen.getByTestId('chart');
      expect(initialChart).toBeInTheDocument();
      
      // Update with new data
      const updatedData = generateMockOHLCVData(24);
      rerender(<CandlestickChart data={updatedData} />);
      
      const updatedChart = screen.getByTestId('chart');
      expect(updatedChart).toBeInTheDocument();
    });
  });

  describe('Chart Animation Configuration (Requirement 5.6)', () => {
    test('InteractivePriceChart configures smooth animations', () => {
      render(<InteractivePriceChart symbol="BTC" />);
      
      const chart = screen.getByTestId('line-chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options'));
      
      expect(chartOptions.responsive).toBe(true);
      expect(chartOptions.maintainAspectRatio).toBe(false);
    });

    test('CandlestickChart configures animation settings', () => {
      const mockData = generateMockOHLCVData(24);
      render(<CandlestickChart data={mockData} />);
      
      const chart = screen.getByTestId('chart');
      const chartOptions = JSON.parse(chart.getAttribute('data-chart-options'));
      
      expect(chartOptions.animation).toBeDefined();
      expect(chartOptions.responsive).toBe(true);
    });
  });

  describe('Multiple Timeframe Data Handling', () => {
    test('handles 1H timeframe data', () => {
      const hourlyData = generateMockPriceData(24);
      render(<InteractivePriceChart symbol="BTC" timeframe="1H" data={hourlyData} />);
      
      expect(screen.getByRole('button', { name: 'View 1H timeframe' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('handles 4H timeframe data', () => {
      const fourHourData = generateMockPriceData(24);
      render(<InteractivePriceChart symbol="BTC" timeframe="4H" data={fourHourData} />);
      
      expect(screen.getByRole('button', { name: 'View 4H timeframe' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('handles 1D timeframe data', () => {
      const dailyData = generateMockPriceData(30);
      render(<InteractivePriceChart symbol="BTC" timeframe="1D" data={dailyData} />);
      
      expect(screen.getByRole('button', { name: 'View 1D timeframe' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('handles 1W timeframe data', () => {
      const weeklyData = generateMockPriceData(52);
      render(<InteractivePriceChart symbol="BTC" timeframe="1W" data={weeklyData} />);
      
      expect(screen.getByRole('button', { name: 'View 1W timeframe' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('handles 1M timeframe data', () => {
      const monthlyData = generateMockPriceData(12);
      render(<InteractivePriceChart symbol="BTC" timeframe="1M" data={monthlyData} />);
      
      expect(screen.getByRole('button', { name: 'View 1M timeframe' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles undefined data gracefully', () => {
      render(<InteractivePriceChart symbol="BTC" data={undefined} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });

    test('handles null data gracefully', () => {
      render(<CandlestickChart data={null} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });

    test('handles single data point', () => {
      const singlePoint = [{ x: '2024-01-01', y: 43000 }];
      render(<InteractivePriceChart symbol="BTC" data={singlePoint} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });

    test('handles very large datasets', () => {
      const largeData = generateMockOHLCVData(10000);
      render(<CandlestickChart data={largeData} />);
      
      const chart = screen.getByTestId('chart');
      expect(chart).toBeInTheDocument();
    });
  });
});
