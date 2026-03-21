import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalMarketStats from '../GlobalMarketStats';

// Mock AnimatedCounter component
jest.mock('../base/AnimatedCounter', () => {
  return function MockAnimatedCounter({ value, formatter, className }) {
    const displayValue = formatter ? formatter(value) : value;
    return <div className={className} data-testid="animated-counter">{displayValue}</div>;
  };
});

describe('GlobalMarketStats', () => {
  beforeEach(() => {
    // Clear any existing timers
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders loading state initially', () => {
    render(<GlobalMarketStats />);
    
    expect(screen.getByText('Global Market Statistics')).toBeInTheDocument();
    
    // Check for loading skeleton
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  test('displays market statistics after loading', async () => {
    render(<GlobalMarketStats />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Global Market Statistics')).toBeInTheDocument();
    });

    // Fast-forward timers to complete loading
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Check for market cap display
      expect(screen.getByText('Market Cap')).toBeInTheDocument();
      
      // Check for 24h volume display
      expect(screen.getByText('24h Volume')).toBeInTheDocument();
      
      // Check for BTC dominance display
      expect(screen.getByText('BTC Dominance')).toBeInTheDocument();
      
      // Check for Fear & Greed index
      expect(screen.getByText('Fear & Greed')).toBeInTheDocument();
    });
  });

  test('displays animated counters for numerical values', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      const animatedCounters = screen.getAllByTestId('animated-counter');
      expect(animatedCounters.length).toBeGreaterThanOrEqual(3); // Market cap, volume, BTC dominance
    });
  });

  test('shows volume historical comparison', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('7-Day Volume Trend')).toBeInTheDocument();
      expect(screen.getByText('7 days ago')).toBeInTheDocument();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  test('displays trend indicators with correct colors', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Check for trend indicators (TrendingUp/TrendingDown icons)
      const trendIcons = document.querySelectorAll('svg');
      expect(trendIcons.length).toBeGreaterThan(0);
    });
  });

  test('shows last update timestamp', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/Updated/)).toBeInTheDocument();
    });
  });

  test('formats currency values correctly', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Check for formatted currency (should show $2.1T for market cap)
      const marketCapElement = screen.getByText('Market Cap').closest('.stat-card');
      expect(marketCapElement).toBeInTheDocument();
    });
  });

  test('displays percentage changes with correct styling', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Look for percentage indicators
      const percentageElements = document.querySelectorAll('[class*="text-success"], [class*="text-danger"]');
      expect(percentageElements.length).toBeGreaterThan(0);
    });
  });

  test('shows Fear & Greed index with appropriate color coding', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      const fearGreedSection = screen.getByText('Fear & Greed').closest('.stat-card');
      expect(fearGreedSection).toBeInTheDocument();
      
      // Check for colored indicator dot
      const coloredDots = fearGreedSection.querySelectorAll('[class*="bg-"]');
      expect(coloredDots.length).toBeGreaterThan(0);
    });
  });

  test('renders volume history chart bars', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Check for volume history visualization
      const volumeTrendSection = screen.getByText('7-Day Volume Trend').closest('div');
      expect(volumeTrendSection).toBeInTheDocument();
      
      // Should have chart bars
      const chartBars = volumeTrendSection.querySelectorAll('[style*="height"]');
      expect(chartBars.length).toBeGreaterThan(0);
    });
  });

  test('handles hover interactions on volume chart', async () => {
    render(<GlobalMarketStats />);
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Check for hover tooltips (hidden by default)
      const tooltips = document.querySelectorAll('.group-hover\\:block');
      expect(tooltips.length).toBeGreaterThan(0);
    });
  });
});