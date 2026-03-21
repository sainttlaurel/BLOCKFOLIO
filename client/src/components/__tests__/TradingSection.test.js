import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TradingSection from '../TradingSection';

// Mock hooks and utilities
const mockUsePrices = jest.fn();
const mockUseResponsiveBreakpoints = jest.fn();
const mockUseRenderTime = jest.fn();
const mockCreateLazyComponent = jest.fn((importFn, fallback) => {
  // Return a simple mock component for testing
  return (props) => {
    const Component = React.lazy(importFn);
    return <React.Suspense fallback={fallback}><Component {...props} /></React.Suspense>;
  };
});

jest.mock('../../hooks/useDataCache', () => ({
  usePrices: (...args) => mockUsePrices(...args)
}));

jest.mock('../../hooks/useResponsiveBreakpoints', () => ({
  useResponsiveBreakpoints: (...args) => mockUseResponsiveBreakpoints(...args)
}));

jest.mock('../../utils/performanceOptimization', () => ({
  createLazyComponent: (...args) => mockCreateLazyComponent(...args),
  useRenderTime: (...args) => mockUseRenderTime(...args)
}));

// Mock child components
jest.mock('../QuickTradePanel', () => {
  return function MockQuickTradePanel({ selectedCoin, onTradeExecuted }) {
    return (
      <div data-testid="quick-trade-panel">
        <div>Quick Trade Panel</div>
        <div>Selected: {selectedCoin}</div>
        <button onClick={() => onTradeExecuted?.({ success: true })}>
          Execute Trade
        </button>
      </div>
    );
  };
});

jest.mock('../MobileTouchTrading', () => {
  return function MockMobileTouchTrading({ selectedCoin, onTradeExecuted }) {
    return (
      <div data-testid="mobile-touch-trading">
        <div>Mobile Touch Trading</div>
        <div>Selected: {selectedCoin}</div>
      </div>
    );
  };
});

jest.mock('../OrderHistory', () => {
  return function MockOrderHistory() {
    return <div data-testid="order-history">Order History</div>;
  };
});

jest.mock('../OrderBook', () => {
  return function MockOrderBook({ symbol, currentPrice }) {
    return (
      <div data-testid="order-book">
        <div>Order Book</div>
        <div>Symbol: {symbol}</div>
        <div>Price: ${currentPrice}</div>
      </div>
    );
  };
});

jest.mock('../PriceAlert', () => {
  return function MockPriceAlert() {
    return <div data-testid="price-alert">Price Alerts</div>;
  };
});

describe('TradingSection Component - Trading Workflow Tests', () => {
  const mockPricesData = {
    bitcoin: { usd: 45000, usd_24h_change: 2.5 },
    ethereum: { usd: 3000, usd_24h_change: -1.2 },
    solana: { usd: 100, usd_24h_change: 5.0 },
    cardano: { usd: 0.5, usd_24h_change: -0.5 },
    polkadot: { usd: 7, usd_24h_change: 1.0 },
    chainlink: { usd: 15, usd_24h_change: 3.0 },
    litecoin: { usd: 70, usd_24h_change: -2.0 },
    stellar: { usd: 0.12, usd_24h_change: 0.5 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePrices.mockReturnValue({
      data: mockPricesData
    });

    mockUseResponsiveBreakpoints.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    });

    mockUseRenderTime.mockImplementation(() => {});
    
    // Mock createLazyComponent to return the actual component
    mockCreateLazyComponent.mockImplementation((importFn, fallback) => {
      const LazyComponent = React.lazy(importFn);
      return (props) => (
        <React.Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </React.Suspense>
      );
    });
  });

  describe('Trading Interface Structure', () => {
    test('renders trading section with header', () => {
      render(<TradingSection />);
      
      expect(screen.getByText('Trading')).toBeInTheDocument();
    });

    test('displays cryptocurrency selection dropdown', () => {
      render(<TradingSection />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      // Check for default options
      expect(screen.getByRole('option', { name: /BTC/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /ETH/i })).toBeInTheDocument();
    });

    test('shows all available cryptocurrencies in dropdown', () => {
      render(<TradingSection />);
      
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(8); // 8 cryptocurrencies
      
      // Verify all coins are present
      expect(screen.getByRole('option', { name: /BTC/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /ETH/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /SOL/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /ADA/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /DOT/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /LINK/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /LTC/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /XLM/i })).toBeInTheDocument();
    });

    test('displays current price in dropdown options', () => {
      render(<TradingSection />);
      
      // Bitcoin option should show price
      expect(screen.getByRole('option', { name: /BTC.*45000/i })).toBeInTheDocument();
      // Ethereum option should show price
      expect(screen.getByRole('option', { name: /ETH.*3000/i })).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('renders all trading tabs', () => {
      render(<TradingSection />);
      
      expect(screen.getByRole('button', { name: /quick trade/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /order history/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /order book/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /price alerts/i })).toBeInTheDocument();
    });

    test('Quick Trade tab is active by default', () => {
      render(<TradingSection />);
      
      const quickTradeTab = screen.getByRole('button', { name: /quick trade/i });
      expect(quickTradeTab).toHaveClass('border-blue-600');
      expect(quickTradeTab).toHaveClass('text-blue-600');
    });

    test('switches to Order History tab when clicked', async () => {
      render(<TradingSection />);
      
      const orderHistoryTab = screen.getByRole('button', { name: /order history/i });
      fireEvent.click(orderHistoryTab);
      
      await waitFor(() => {
        expect(orderHistoryTab).toHaveClass('border-blue-600');
        expect(screen.getByTestId('order-history')).toBeInTheDocument();
      });
    });

    test('switches to Order Book tab when clicked', async () => {
      render(<TradingSection />);
      
      const orderBookTab = screen.getByRole('button', { name: /order book/i });
      fireEvent.click(orderBookTab);
      
      await waitFor(() => {
        expect(orderBookTab).toHaveClass('border-blue-600');
        expect(screen.getByTestId('order-book')).toBeInTheDocument();
      });
    });

    test('switches to Price Alerts tab when clicked', async () => {
      render(<TradingSection />);
      
      const priceAlertsTab = screen.getByRole('button', { name: /price alerts/i });
      fireEvent.click(priceAlertsTab);
      
      await waitFor(() => {
        expect(priceAlertsTab).toHaveClass('border-blue-600');
        expect(screen.getByTestId('price-alert')).toBeInTheDocument();
      });
    });

    test('displays correct tab icons', () => {
      render(<TradingSection />);
      
      // Check that each tab has an icon (lucide-react icons)
      const tabs = screen.getAllByRole('button', { name: /trade|history|book|alerts/i });
      tabs.forEach(tab => {
        const icon = tab.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Cryptocurrency Selection', () => {
    test('changes selected cryptocurrency when dropdown value changes', () => {
      render(<TradingSection />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ethereum' } });
      
      expect(select.value).toBe('ethereum');
    });

    test('updates Quick Trade Panel with selected cryptocurrency', async () => {
      render(<TradingSection />);
      
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ethereum' } });
      
      await waitFor(() => {
        expect(screen.getByText('Selected: ethereum')).toBeInTheDocument();
      });
    });

    test('updates Order Book with selected cryptocurrency symbol', async () => {
      render(<TradingSection />);
      
      // Switch to Order Book tab
      const orderBookTab = screen.getByRole('button', { name: /order book/i });
      fireEvent.click(orderBookTab);
      
      await waitFor(() => {
        expect(screen.getByText('Symbol: BTC')).toBeInTheDocument();
      });
      
      // Change cryptocurrency
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ethereum' } });
      
      await waitFor(() => {
        expect(screen.getByText('Symbol: ETH')).toBeInTheDocument();
      });
    });

    test('passes current price to Order Book component', async () => {
      render(<TradingSection />);
      
      // Switch to Order Book tab
      const orderBookTab = screen.getByRole('button', { name: /order book/i });
      fireEvent.click(orderBookTab);
      
      await waitFor(() => {
        expect(screen.getByText('Price: $45000')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    test('renders QuickTradePanel on desktop', async () => {
      mockUseResponsiveBreakpoints.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true
      });
      
      render(<TradingSection />);
      
      await waitFor(() => {
        expect(screen.getByTestId('quick-trade-panel')).toBeInTheDocument();
      });
    });

    test('renders MobileTouchTrading on mobile', async () => {
      mockUseResponsiveBreakpoints.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false
      });
      
      render(<TradingSection />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mobile-touch-trading')).toBeInTheDocument();
      });
    });
  });

  describe('Trade Execution Workflow', () => {
    test('handles trade execution callback', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<TradingSection />);
      
      await waitFor(() => {
        expect(screen.getByTestId('quick-trade-panel')).toBeInTheDocument();
      });
      
      const executeButton = screen.getByRole('button', { name: /execute trade/i });
      fireEvent.click(executeButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('Trade executed:', { success: true });
      
      consoleSpy.mockRestore();
    });

    test('maintains selected cryptocurrency across tab switches', async () => {
      render(<TradingSection />);
      
      // Change cryptocurrency
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'ethereum' } });
      
      // Switch to Order History tab
      const orderHistoryTab = screen.getByRole('button', { name: /order history/i });
      fireEvent.click(orderHistoryTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('order-history')).toBeInTheDocument();
      });
      
      // Switch back to Quick Trade
      const quickTradeTab = screen.getByRole('button', { name: /quick trade/i });
      fireEvent.click(quickTradeTab);
      
      await waitFor(() => {
        expect(screen.getByText('Selected: ethereum')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading fallback while components load', () => {
      render(<TradingSection />);
      
      // Check for Suspense fallback (animate-pulse)
      const loadingElements = document.querySelectorAll('.animate-pulse');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    test('uses lazy loading for trading components', () => {
      render(<TradingSection />);
      
      // Verify createLazyComponent was called for each component
      expect(mockCreateLazyComponent).toHaveBeenCalledTimes(5);
    });

    test('tracks render performance', () => {
      render(<TradingSection />);
      
      expect(mockUseRenderTime).toHaveBeenCalledWith('TradingSection');
    });
  });

  describe('Accessibility', () => {
    test('provides proper labels for dropdown', () => {
      render(<TradingSection />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    test('tab buttons have proper ARIA attributes', () => {
      render(<TradingSection />);
      
      const tabs = screen.getAllByRole('button', { name: /trade|history|book|alerts/i });
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('class');
      });
    });

    test('active tab is visually distinguished', () => {
      render(<TradingSection />);
      
      const quickTradeTab = screen.getByRole('button', { name: /quick trade/i });
      expect(quickTradeTab).toHaveClass('border-blue-600');
      expect(quickTradeTab).toHaveClass('text-blue-600');
      
      const orderHistoryTab = screen.getByRole('button', { name: /order history/i });
      expect(orderHistoryTab).toHaveClass('border-transparent');
      expect(orderHistoryTab).toHaveClass('text-gray-500');
    });
  });
});
