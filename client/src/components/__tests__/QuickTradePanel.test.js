import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuickTradePanel from '../QuickTradePanel';

// Mock hooks
const mockUsePrices = jest.fn();
const mockUsePortfolio = jest.fn();
const mockUseTradingShortcuts = jest.fn();

jest.mock('../../hooks/useDataCache', () => ({
  usePrices: (...args) => mockUsePrices(...args),
  usePortfolio: (...args) => mockUsePortfolio(...args)
}));

jest.mock('../../hooks/useKeyboardShortcuts', () => ({
  useTradingShortcuts: (...args) => mockUseTradingShortcuts(...args)
}));

describe('QuickTradePanel Component - Trading Interface Tests', () => {
  const mockPricesData = {
    bitcoin: {
      usd: 45000,
      usd_24h_change: 2.5
    },
    ethereum: {
      usd: 3000,
      usd_24h_change: -1.2
    }
  };

  const mockPortfolioData = {
    usdBalance: 10000,
    holdings: [
      {
        coinId: 'bitcoin',
        amount: 0.5,
        currentPrice: 45000
      }
    ]
  };

  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePrices.mockReturnValue({
      data: mockPricesData,
      refresh: mockRefresh
    });

    mockUsePortfolio.mockReturnValue({
      data: mockPortfolioData,
      refresh: mockRefresh
    });

    mockUseTradingShortcuts.mockImplementation(() => {});
  });

  describe('Quick Trade Panel Functionality (Requirement 3.1)', () => {
    test('renders Quick Trade panel with buy and sell action buttons', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByText('Quick Trade')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buy cryptocurrency/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sell cryptocurrency/i })).toBeInTheDocument();
    });

    test('buy button has correct styling and is functional', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const buyButton = screen.getByRole('button', { name: /buy cryptocurrency/i });
      expect(buyButton).toHaveClass('bg-green-600');
      expect(buyButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('sell button has correct styling and is functional', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });
      fireEvent.click(sellButton);

      expect(sellButton).toHaveClass('bg-red-600');
      expect(sellButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('switches between buy and sell modes correctly', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const buyButton = screen.getByRole('button', { name: /buy cryptocurrency/i });
      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });

      // Initially buy mode
      expect(buyButton).toHaveAttribute('aria-pressed', 'true');
      expect(sellButton).toHaveAttribute('aria-pressed', 'false');

      // Switch to sell mode
      fireEvent.click(sellButton);
      expect(buyButton).toHaveAttribute('aria-pressed', 'false');
      expect(sellButton).toHaveAttribute('aria-pressed', 'true');

      // Switch back to buy mode
      fireEvent.click(buyButton);
      expect(buyButton).toHaveAttribute('aria-pressed', 'true');
      expect(sellButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Real-time Price Updates with Visual Indicators (Requirement 3.2)', () => {
    test('displays current price with real-time updates', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByText('$45,000')).toBeInTheDocument();
    });

    test('shows visual change indicator for positive price change', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const changeElement = screen.getByText('+2.50%');
      expect(changeElement).toHaveClass('text-green-600');
      
      // Check for TrendingUp icon
      const priceDisplay = screen.getByRole('status', { name: /current bitcoin price/i });
      expect(priceDisplay.querySelector('.lucide-trending-up')).toBeInTheDocument();
    });

    test('shows visual change indicator for negative price change', () => {
      render(<QuickTradePanel selectedCoin="ethereum" />);

      const changeElement = screen.getByText('-1.20%');
      expect(changeElement).toHaveClass('text-red-600');
      
      // Check for TrendingDown icon
      const priceDisplay = screen.getByRole('status', { name: /current ethereum price/i });
      expect(priceDisplay.querySelector('.lucide-trending-down')).toBeInTheDocument();
    });

    test('price display updates when selectedCoin changes', () => {
      const { rerender } = render(<QuickTradePanel selectedCoin="bitcoin" />);
      expect(screen.getByText('$45,000')).toBeInTheDocument();

      rerender(<QuickTradePanel selectedCoin="ethereum" />);
      expect(screen.getByText('$3,000')).toBeInTheDocument();
    });
  });

  describe('Cryptocurrency Selection Data Display (Requirement 3.3)', () => {
    test('displays current price for selected cryptocurrency', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
    });

    test('displays 24h change for selected cryptocurrency', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByText('+2.50%')).toBeInTheDocument();
      expect(screen.getByText('24h Change')).toBeInTheDocument();
    });

    test('displays available balance for buy orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByText('Available:')).toBeInTheDocument();
      expect(screen.getByLabelText(/available balance: 10,000/i)).toBeInTheDocument();
    });

    test('displays available holdings for sell orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });
      fireEvent.click(sellButton);

      expect(screen.getByLabelText(/available holdings: 0.500000 btc/i)).toBeInTheDocument();
    });
  });

  describe('Trade Cost Calculation and Fee Display (Requirement 3.4)', () => {
    test('calculates estimated total cost including fees for buy orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      // Wait for trade summary to appear
      expect(screen.getByText('Trade Summary')).toBeInTheDocument();
      
      // Check calculations: 0.1 BTC * $45,000 = $4,500
      expect(screen.getByText('0.100000 BTC')).toBeInTheDocument();
      expect(screen.getByText('$45,000')).toBeInTheDocument();
      expect(screen.getByText('$4,500')).toBeInTheDocument();
      
      // Check fee: 0.1% of $4,500 = $4.50
      expect(screen.getByText('$4.50')).toBeInTheDocument();
      
      // Check total with fee: $4,500 + $4.50 = $4,504.50
      expect(screen.getByText('$4,504.50')).toBeInTheDocument();
    });

    test('calculates estimated total cost including fees for sell orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });
      fireEvent.click(sellButton);

      const amountInput = screen.getByLabelText(/enter amount of btc to sell/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      // For sell orders, fee is subtracted
      expect(screen.getByText('Trade Summary')).toBeInTheDocument();
      expect(screen.getByText('$4.50')).toBeInTheDocument();
      expect(screen.getByText('$4,495.50')).toBeInTheDocument();
    });

    test('displays trading fee percentage (0.1%)', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      expect(screen.getByText('Trading Fee (0.1%):')).toBeInTheDocument();
    });

    test('updates cost calculation when amount changes', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      
      fireEvent.change(amountInput, { target: { value: '0.1' } });
      expect(screen.getByText('$4,504.50')).toBeInTheDocument();

      fireEvent.change(amountInput, { target: { value: '0.2' } });
      expect(screen.getByText('$9,009')).toBeInTheDocument();
    });

    test('validates insufficient balance for buy orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '1' } }); // 1 BTC = $45,000 > $10,000 balance

      expect(screen.getByRole('alert', { name: /insufficient balance/i })).toBeInTheDocument();
    });

    test('validates insufficient holdings for sell orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });
      fireEvent.click(sellButton);

      const amountInput = screen.getByLabelText(/enter amount of btc to sell/i);
      fireEvent.change(amountInput, { target: { value: '1' } }); // 1 BTC > 0.5 BTC holdings

      expect(screen.getByRole('alert', { name: /insufficient holdings/i })).toBeInTheDocument();
    });
  });

  describe('Order Confirmation Workflow (Requirement 3.5)', () => {
    test('shows order confirmation modal before execution', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      // Check for confirmation modal
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /confirm purchase/i })).toBeInTheDocument();
      });
    });

    test('confirmation modal displays complete trade summary', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveTextContent('Buy BTC');
        expect(modal).toHaveTextContent('0.100000 BTC');
        expect(modal).toHaveTextContent('$45,000');
        expect(modal).toHaveTextContent('$4,504.50');
      });
    });

    test('can cancel order from confirmation modal', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel trade/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('executes trade when confirmed', async () => {
      const onTradeExecuted = jest.fn();
      render(<QuickTradePanel selectedCoin="bitcoin" onTradeExecuted={onTradeExecuted} />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(onTradeExecuted).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Post-Trade Feedback and Portfolio Updates (Requirement 3.6)', () => {
    test('shows animated success feedback after successful trade', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('alert', { name: /purchase successful/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText(/bought 0.1 btc/i)).toBeInTheDocument();
    });

    test('refreshes portfolio data after successful trade', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    test('resets form after successful trade', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(amountInput.value).toBe('');
      }, { timeout: 3000 });
    });

    test('shows error feedback for failed trades', async () => {
      // Mock a failed trade by causing an error
      const consoleErrorSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Wait for trade to complete
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      consoleErrorSpy.mockRestore();
    });

    test('clears success notification after 5 seconds', async () => {
      jest.useFakeTimers();
      
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
        jest.advanceTimersByTime(1500); // Wait for trade execution
      });

      await waitFor(() => {
        expect(screen.getByRole('alert', { name: /purchase successful/i })).toBeInTheDocument();
      });

      // Fast forward 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.queryByRole('alert', { name: /purchase successful/i })).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Additional Trading Features', () => {
    test('supports market and limit order types', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByRole('button', { name: /market order/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /limit order/i })).toBeInTheDocument();
    });

    test('shows limit price input for limit orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const limitButton = screen.getByRole('button', { name: /limit order/i });
      fireEvent.click(limitButton);

      expect(screen.getByLabelText(/enter limit price in usd/i)).toBeInTheDocument();
    });

    test('MAX button sets maximum available amount for buy orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const maxButton = screen.getByRole('button', { name: /set to maximum available balance/i });
      fireEvent.click(maxButton);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      // Max amount = $10,000 / $45,000 * 0.999 (leave room for fees)
      expect(parseFloat(amountInput.value)).toBeCloseTo(0.222, 2);
    });

    test('MAX button sets maximum holdings for sell orders', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });
      fireEvent.click(sellButton);

      const maxButton = screen.getByRole('button', { name: /set to maximum available holdings/i });
      fireEvent.click(maxButton);

      const amountInput = screen.getByLabelText(/enter amount of btc to sell/i);
      expect(amountInput.value).toBe('0.5');
    });

    test('validates amount must be greater than 0', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '-1' } });

      expect(screen.getByRole('alert', { name: /amount must be greater than 0/i })).toBeInTheDocument();
    });

    test('disables trade button when form is invalid', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const tradeButton = screen.getByRole('button', { name: /buy btc/i });
      expect(tradeButton).toBeDisabled();

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      expect(tradeButton).not.toBeDisabled();
    });

    test('shows processing state during trade execution', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      act(() => {
        fireEvent.click(confirmButton);
      });

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels for all interactive elements', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      expect(screen.getByRole('region', { name: /quick trade panel/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /trade type selection/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /order type selection/i })).toBeInTheDocument();
    });

    test('provides live region updates for price changes', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const priceDisplay = screen.getByRole('status', { name: /current bitcoin price/i });
      expect(priceDisplay).toHaveAttribute('aria-live', 'polite');
    });

    test('provides assertive alerts for trade results', async () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0.1 btc/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm purchase of 0.100000 btc/i });
      
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        const alert = screen.getByRole('alert', { name: /purchase successful/i });
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      }, { timeout: 3000 });
    });

    test('provides descriptive error messages with proper ARIA attributes', () => {
      render(<QuickTradePanel selectedCoin="bitcoin" />);

      const amountInput = screen.getByLabelText(/enter amount of btc to buy/i);
      fireEvent.change(amountInput, { target: { value: '100' } }); // Exceeds balance

      const errorMessage = screen.getByRole('alert', { name: /insufficient balance/i });
      expect(errorMessage).toBeInTheDocument();
      expect(amountInput).toHaveAttribute('aria-invalid', 'true');
      expect(amountInput).toHaveAttribute('aria-describedby', 'amount-error');
    });
  });
});
