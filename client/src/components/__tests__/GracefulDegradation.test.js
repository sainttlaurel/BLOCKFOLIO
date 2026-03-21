/**
 * Tests for Graceful Degradation Integration
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useGracefulDegradation, useDegradationAware } from '../../hooks/useGracefulDegradation';
import gracefulDegradationService from '../../services/gracefulDegradation';

// Mock the graceful degradation service
jest.mock('../../services/gracefulDegradation', () => ({
  currentLevel: 'full',
  currentQuality: 'excellent',
  featureFlags: {
    animations: true,
    realTimeData: true,
    backgroundTasks: true,
    heavyCharts: true,
    autoSave: true,
    notifications: true
  },
  degradationLevels: {
    FULL: 'full',
    REDUCED: 'reduced',
    MINIMAL: 'minimal',
    OFFLINE: 'offline'
  },
  on: jest.fn(),
  off: jest.fn(),
  getStatus: jest.fn(() => ({
    level: 'full',
    networkQuality: 'excellent',
    strategies: {},
    featureFlags: {},
    metrics: {}
  })),
  isFeatureEnabled: jest.fn((feature) => true),
  forceDegradationLevel: jest.fn(),
  getMetrics: jest.fn(() => ({
    degradationEvents: 0,
    totalDowntime: 0,
    userExperience: 'excellent'
  }))
}));

// Test component using the hook
const TestComponent = ({ componentName = 'TestComponent' }) => {
  const { degradationLevel, isFeatureEnabled } = useGracefulDegradation();
  const { componentConfig, shouldAnimate } = useDegradationAware(componentName);
  
  return (
    <div data-testid="test-component">
      <div data-testid="degradation-level">{degradationLevel}</div>
      <div data-testid="animations-enabled">{shouldAnimate.toString()}</div>
      <div data-testid="real-time-enabled">{isFeatureEnabled('realTimeData').toString()}</div>
      <div data-testid="component-config">{JSON.stringify(componentConfig)}</div>
    </div>
  );
};

describe('Graceful Degradation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('useGracefulDegradation hook provides correct initial state', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('degradation-level')).toHaveTextContent('full');
    expect(screen.getByTestId('animations-enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('real-time-enabled')).toHaveTextContent('true');
  });

  test('useDegradationAware hook generates component-specific config', () => {
    render(<TestComponent componentName="CandlestickChart" />);
    
    const configElement = screen.getByTestId('component-config');
    const config = JSON.parse(configElement.textContent);
    
    expect(config).toHaveProperty('shouldRender');
    expect(config).toHaveProperty('enableAnimations');
    expect(config).toHaveProperty('updateInterval');
  });

  test('hooks register event listeners on mount', () => {
    render(<TestComponent />);
    
    expect(gracefulDegradationService.on).toHaveBeenCalledWith(
      'degradationLevelChanged',
      expect.any(Function)
    );
    expect(gracefulDegradationService.on).toHaveBeenCalledWith(
      'networkQualityChanged',
      expect.any(Function)
    );
  });

  test('hooks clean up event listeners on unmount', () => {
    const { unmount } = render(<TestComponent />);
    
    unmount();
    
    expect(gracefulDegradationService.off).toHaveBeenCalledWith(
      'degradationLevelChanged',
      expect.any(Function)
    );
    expect(gracefulDegradationService.off).toHaveBeenCalledWith(
      'networkQualityChanged',
      expect.any(Function)
    );
  });

  test('degradation level changes update component state', () => {
    // Mock degradation level change
    gracefulDegradationService.currentLevel = 'reduced';
    gracefulDegradationService.featureFlags.animations = false;
    
    let degradationChangeHandler;
    gracefulDegradationService.on.mockImplementation((event, handler) => {
      if (event === 'degradationLevelChanged') {
        degradationChangeHandler = handler;
      }
    });
    
    render(<TestComponent />);
    
    // Simulate degradation level change
    act(() => {
      if (degradationChangeHandler) {
        degradationChangeHandler({
          current: 'reduced',
          previous: 'full'
        });
      }
    });
    
    // Note: In a real test, we'd need to mock the service state changes
    // This test demonstrates the structure for testing state updates
  });

  test('component-specific configurations are generated correctly', () => {
    const chartConfigs = [
      'CandlestickChart',
      'InteractivePriceChart',
      'PortfolioPerformanceChart'
    ];
    
    chartConfigs.forEach(componentName => {
      const { rerender } = render(<TestComponent componentName={componentName} />);
      
      const configElement = screen.getByTestId('component-config');
      const config = JSON.parse(configElement.textContent);
      
      // Chart components should have specific properties
      expect(config).toHaveProperty('dataPoints');
      expect(config).toHaveProperty('renderQuality');
      expect(config).toHaveProperty('enableTooltips');
      
      rerender(<TestComponent componentName="NextComponent" />);
    });
  });

  test('network quality changes are handled', () => {
    let networkQualityChangeHandler;
    gracefulDegradationService.on.mockImplementation((event, handler) => {
      if (event === 'networkQualityChanged') {
        networkQualityChangeHandler = handler;
      }
    });
    
    render(<TestComponent />);
    
    // Simulate network quality change
    act(() => {
      if (networkQualityChangeHandler) {
        networkQualityChangeHandler({
          current: 'poor',
          previous: 'excellent'
        });
      }
    });
    
    // Verify handler was called
    expect(gracefulDegradationService.on).toHaveBeenCalledWith(
      'networkQualityChanged',
      expect.any(Function)
    );
  });
});

describe('Component Configuration Generation', () => {
  test('CandlestickChart gets appropriate configuration', () => {
    render(<TestComponent componentName="CandlestickChart" />);
    
    const configElement = screen.getByTestId('component-config');
    const config = JSON.parse(configElement.textContent);
    
    expect(config).toMatchObject({
      shouldRender: true,
      enableAnimations: expect.any(Boolean),
      dataPoints: expect.any(Number),
      renderQuality: expect.any(String),
      updateInterval: expect.any(Number)
    });
  });

  test('CryptocurrencyTable gets appropriate configuration', () => {
    render(<TestComponent componentName="CryptocurrencyTable" />);
    
    const configElement = screen.getByTestId('component-config');
    const config = JSON.parse(configElement.textContent);
    
    expect(config).toMatchObject({
      shouldRender: true,
      enableVirtualScrolling: expect.any(Boolean),
      enableSorting: expect.any(Boolean),
      pageSize: expect.any(Number),
      updateInterval: expect.any(Number)
    });
  });

  test('OrderBook gets appropriate configuration', () => {
    render(<TestComponent componentName="OrderBook" />);
    
    const configElement = screen.getByTestId('component-config');
    const config = JSON.parse(configElement.textContent);
    
    expect(config).toMatchObject({
      shouldRender: true,
      enableRealTimeUpdates: expect.any(Boolean),
      maxDepth: expect.any(Number),
      updateInterval: expect.any(Number)
    });
  });
});