import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MobileTouchTrading from '../MobileTouchTrading';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { usePrices, usePortfolio } from '../../hooks/useDataCache';

// Mock hooks
jest.mock('../../hooks/useResponsiveBreakpoints');
jest.mock('../../hooks/useDataCache');
jest.mock('../../hooks/useTouchGestures', () => ({
  useTouchGestures: () => ({
    touchHandlers: {
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn()
    },
    isLongPressing: false,
    isSwiping: false,
    triggerHaptic: jest.fn()
  })
}));

describe('MobileTouchTrading', () => {
  const mockPrices = {
    bitcoin: {
      usd: 50000,
      usd_24h_change: 5.5
    }
  };

  const mockPortfolio = {
    usdBalance: 10000,
    holdings: [
      {
        coinId: 'bitcoin',
        amount: 0.5
      }
    ]
  };

  beforeEach(() => {
    useResponsiveBreakpoints.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    });

    usePrices.mockReturnValue({
      data: mockPrices,
      refresh: jest.fn()
    });

    usePortfolio.mockReturnValue({
      data: mockPortfolio,
      refresh: jest.fn()
    });

    // Mock navigator.vibrate
    global.navigator.vibrate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Touch Target Accessibility', () => {
    it('should render with minimum 44x44px touch targets for buttons', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const buyButton = screen.getByRole('button', { name: /buy cryptocurrency/i });
      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });

      // Check that buttons have minimum touch target size
      expect(buyButton).toHaveClass('min-h-[56px]');
      expect(sellButton).toHaveClass('min-h-[56px]');
    });

    it('should render trade button with minimum 64px height', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const tradeButton = screen.getByRole('button', { name: /buy bitcoin/i });
      expect(tradeButton).toHaveClass('min-h-[64px]');
    });

    it('should have touch-manipulation class for better touch response', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const buyButton = screen.getByRole('button', { name: /buy cryptocurrency/i });
      expect(buyButton).toHaveClass('touch-manipulation');
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should render only on mobile devices', () => {
      useResponsiveBreakpoints.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true
      });

      const { container } = render(<MobileTouchTrading selectedCoin="bitcoin" />);
      expect(container.firstChild).toBeNull();
    });

    it('should display current price prominently', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const priceDisplay = screen.getByText('$50,000');
      expect(priceDisplay).toBeInTheDocument();
      expect(priceDisplay).toHaveClass('text-3xl', 'font-bold');
    });

    it('should show quick amount selection buttons', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const quickButton = screen.getByRole('button', { name: /toggle quick amount/i });
      fireEvent.click(quickButton);

      expect(screen.getByRole('button', { name: /set amount to 25%/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set amount to 50%/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set amount to 75%/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set amount to max/i })).toBeInTheDocument();
    });

    it('should render number pad for touch input', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      // Check for number buttons
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: `Enter ${i}` })).toBeInTheDocument();
      }

      // Check for decimal and delete buttons
      expect(screen.getByRole('button', { name: 'Enter .' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('Trade Type Selection', () => {
    it('should toggle between buy and sell', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const buyButton = screen.getByRole('button', { name: /buy cryptocurrency/i });
      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });

      expect(buyButton).toHaveAttribute('aria-pressed', 'true');
      expect(sellButton).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(sellButton);

      expect(buyButton).toHaveAttribute('aria-pressed', 'false');
      expect(sellButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should update available balance display based on trade type', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      // Buy mode shows USD balance
      expect(screen.getByText('$10,000')).toBeInTheDocument();

      // Switch to sell mode
      const sellButton = screen.getByRole('button', { name: /sell cryptocurrency/i });
      fireEvent.click(sellButton);

      // Sell mode shows coin holdings
      expect(screen.getByText(/0\.500000 BITCOIN/i)).toBeInTheDocument();
    });
  });

  describe('Amount Input', () => {
    it('should update amount when number pad is used', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      
      fireEvent.click(screen.getByRole('button', { name: 'Enter 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enter .' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enter 5' }));

      expect(input).toHaveValue('1.5');
    });

    it('should delete last character when delete button is pressed', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      
      fireEvent.click(screen.getByRole('button', { name: 'Enter 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enter 2' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

      expect(input).toHaveValue('1');
    });

    it('should prevent multiple decimal points', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      
      fireEvent.click(screen.getByRole('button', { name: 'Enter 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enter .' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enter 5' }));
      fireEvent.click(screen.getByRole('button', { name: 'Enter .' })); // Should be ignored

      expect(input).toHaveValue('1.5');
    });
  });

  describe('Trade Summary', () => {
    it('should display trade summary when amount is entered', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText(/amount:/i)).toBeInTheDocument();
      expect(screen.getByText(/price:/i)).toBeInTheDocument();
      expect(screen.getByText(/fee:/i)).toBeInTheDocument();
      expect(screen.getByText(/total:/i)).toBeInTheDocument();
    });

    it('should calculate total correctly including fees', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      // 0.1 BTC * $50,000 = $5,000
      // Fee: $5,000 * 0.001 = $5
      // Total: $5,005
      expect(screen.getByText('$5,005')).toBeInTheDocument();
    });
  });

  describe('Trade Execution', () => {
    it('should show confirmation dialog when trade button is clicked', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0\.1 bitcoin/i });
      fireEvent.click(tradeButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/confirm purchase/i)).toBeInTheDocument();
    });

    it('should disable trade button when amount is invalid', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const tradeButton = screen.getByRole('button', { name: /buy bitcoin/i });
      expect(tradeButton).toBeDisabled();
    });

    it('should disable trade button when insufficient balance', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      // Try to buy 1 BTC ($50,000) with only $10,000 balance
      fireEvent.change(input, { target: { value: '1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 1 bitcoin/i });
      expect(tradeButton).toBeDisabled();
    });

    it('should execute trade and show success message', async () => {
      const onTradeExecuted = jest.fn();
      render(<MobileTouchTrading selectedCoin="bitcoin" onTradeExecuted={onTradeExecuted} />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0\.1 bitcoin/i });
      fireEvent.click(tradeButton);

      const confirmButton = screen.getByRole('button', { name: /confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/purchase successful/i)).toBeInTheDocument();
      });

      expect(onTradeExecuted).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      expect(screen.getByRole('button', { name: /buy cryptocurrency/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sell cryptocurrency/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /enter amount/i })).toBeInTheDocument();
    });

    it('should announce trade results to screen readers', async () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0\.1 bitcoin/i });
      fireEvent.click(tradeButton);

      const confirmButton = screen.getByRole('button', { name: /confirm purchase/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'assertive');
      });
    });

    it('should have proper modal accessibility attributes', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0\.1 bitcoin/i });
      fireEvent.click(tradeButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Visual Feedback', () => {
    it('should show loading state during trade execution', async () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const input = screen.getByRole('textbox', { name: /enter amount/i });
      fireEvent.change(input, { target: { value: '0.1' } });

      const tradeButton = screen.getByRole('button', { name: /buy 0\.1 bitcoin/i });
      fireEvent.click(tradeButton);

      const confirmButton = screen.getByRole('button', { name: /confirm purchase/i });
      fireEvent.click(confirmButton);

      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('should display price change indicator with correct color', () => {
      render(<MobileTouchTrading selectedCoin="bitcoin" />);

      const priceChange = screen.getByText('+5.50%');
      expect(priceChange).toHaveClass('text-green-700');
    });
  });
});
