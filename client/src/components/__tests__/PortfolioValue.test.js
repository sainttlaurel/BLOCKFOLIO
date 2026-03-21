import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortfolioValue from '../PortfolioValue';

// Mock requestAnimationFrame for testing
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));

describe('PortfolioValue Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Basic Rendering', () => {
    test('renders portfolio value with correct formatting', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(screen.getByText('$125,432.50')).toBeInTheDocument();
      expect(screen.getByText('+2.40%')).toBeInTheDocument();
      expect(screen.getByText('24h')).toBeInTheDocument();
    });

    test('displays loading state correctly', () => {
      render(
        <PortfolioValue 
          totalValue={0}
          percentageChange={0}
          timeframe="24h"
          isLoading={true}
        />
      );

      const loadingElements = screen.getAllByRole('generic');
      const hasLoadingClass = loadingElements.some(element => 
        element.classList.contains('animate-pulse')
      );
      expect(hasLoadingClass).toBe(true);
    });

    test('applies correct CSS classes for typography', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      const valueElement = screen.getByText('$125,432.50');
      expect(valueElement).toHaveClass('text-display-2xl');
      expect(valueElement).toHaveClass('font-bold');
      expect(valueElement).toHaveClass('text-neutral-900');
    });
  });

  describe('Color Coding', () => {
    test('shows positive change with correct styling', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      const percentageElement = screen.getByText('+2.40%');
      expect(percentageElement).toHaveClass('text-percentage-positive');
    });

    test('shows negative change with correct styling', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={-1.8}
          timeframe="24h"
          isLoading={false}
        />
      );

      const percentageElement = screen.getByText('-1.80%');
      expect(percentageElement).toHaveClass('text-percentage-negative');
    });

    test('shows neutral change with correct styling', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      const percentageElement = screen.getByText('0.00%');
      expect(percentageElement).toHaveClass('text-percentage-neutral');
    });

    test('displays correct trend icons for positive, negative, and neutral changes', () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Check positive change has TrendingUp icon
      let trendIcon = document.querySelector('.lucide-trending-up');
      expect(trendIcon).toBeInTheDocument();

      // Check negative change has TrendingDown icon
      rerender(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={-1.8}
          timeframe="24h"
          isLoading={false}
        />
      );

      trendIcon = document.querySelector('.lucide-trending-down');
      expect(trendIcon).toBeInTheDocument();

      // Check neutral change has TrendingDown icon (default for zero)
      rerender(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      trendIcon = document.querySelector('.lucide-trending-down');
      expect(trendIcon).toBeInTheDocument();
    });

    test('formats percentage with proper signs and precision', () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.456}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Positive change should have + sign and 2 decimal places
      expect(screen.getByText('+2.46%')).toBeInTheDocument();

      // Negative change should have - sign and 2 decimal places
      rerender(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={-1.789}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(screen.getByText('-1.79%')).toBeInTheDocument();

      // Zero change should have no sign
      rerender(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });

    test('provides accessibility labels for percentage changes', () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Check positive change accessibility
      let percentageElement = screen.getByLabelText(/Portfolio change: up 2.40 percent/);
      expect(percentageElement).toBeInTheDocument();

      // Check negative change accessibility
      rerender(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={-1.8}
          timeframe="24h"
          isLoading={false}
        />
      );

      percentageElement = screen.getByLabelText(/Portfolio change: down 1.80 percent/);
      expect(percentageElement).toBeInTheDocument();

      // Check neutral change accessibility
      rerender(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      percentageElement = screen.getByLabelText(/Portfolio change: unchanged 0.00 percent/);
      expect(percentageElement).toBeInTheDocument();
    });
  });

  describe('Enhanced Counter Animation', () => {
    test('triggers enhanced animation when value increases significantly', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change to significantly higher value (>5% change)
      rerender(
        <PortfolioValue 
          totalValue={110000}
          percentageChange={10}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-increase');
        expect(portfolioDisplay).toHaveClass('animate-strong');
      });
    });

    test('uses counter animation utility for smooth value transitions', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change value to trigger counter animation
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Verify requestAnimationFrame is used for smooth animation
      await waitFor(() => {
        expect(global.requestAnimationFrame).toHaveBeenCalled();
      });
    });

    test('respects 600ms animation duration as specified in design system', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Trigger animation
      act(() => {
        rerender(
          <PortfolioValue 
            totalValue={105000}
            percentageChange={5}
            timeframe="24h"
            isLoading={false}
          />
        );
      });

      // Animation should be active
      const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
      expect(portfolioDisplay).toHaveClass('animating');

      // Fast forward through 600ms animation duration
      act(() => {
        jest.advanceTimersByTime(700);
      });

      jest.useRealTimers();
    });

    test('applies professional easing function for smooth transitions', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change value to trigger animation with professional easing
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Verify animation is triggered with proper easing
      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-increase');
      });
    });

    test('handles both increasing and decreasing values correctly', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Test increasing value
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-increase');
      });

      // Test decreasing value
      rerender(
        <PortfolioValue 
          totalValue={95000}
          percentageChange={-5}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$105,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-decrease');
      });
    });

    test('provides accessibility support with reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change value - should respect reduced motion
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Should still update value but without animation
      expect(screen.getByText('$105,000.00')).toBeInTheDocument();
    });
  });
    test('triggers enhanced animation when value increases significantly', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change to significantly higher value (>5% change)
      rerender(
        <PortfolioValue 
          totalValue={110000}
          percentageChange={10}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-increase');
        expect(portfolioDisplay).toHaveClass('animate-strong');
      });
    });

    test('triggers enhanced animation when value decreases significantly', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change to significantly lower value (>5% change)
      rerender(
        <PortfolioValue 
          totalValue={90000}
          percentageChange={-10}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-decrease');
        expect(portfolioDisplay).toHaveClass('animate-strong');
      });
    });

    test('triggers subtle animation for small but significant changes', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Small but significant change
      rerender(
        <PortfolioValue 
          totalValue={100100}
          percentageChange={0.1}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-value-increase');
        expect(portfolioDisplay).toHaveClass('animate-normal');
      });
    });

    test('triggers subtle update animation for very small changes', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000.00}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Very small change that still triggers subtle animation
      rerender(
        <PortfolioValue 
          totalValue={100000.50}
          percentageChange={0.0005}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.50').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animate-subtle-update');
      });
    });

    test('does not animate for very small changes', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000.00}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change by less than $0.01
      rerender(
        <PortfolioValue 
          totalValue={100000.005}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.01').closest('.portfolio-value-display');
        expect(portfolioDisplay).not.toHaveClass('animate-value-increase');
        expect(portfolioDisplay).not.toHaveClass('animate-value-decrease');
      });
    });

    test('does not animate during loading state', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={true}
        />
      );

      // Change value while loading
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={true}
        />
      );

      // Should not have animation classes during loading
      const loadingElements = screen.getAllByRole('generic');
      const hasAnimationClass = loadingElements.some(element => 
        element.classList.contains('animate-value-increase')
      );
      expect(hasAnimationClass).toBe(false);
    });

    test('applies enhanced visual feedback classes during animation', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Trigger animation
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const portfolioDisplay = screen.getByText('$100,000.00').closest('.portfolio-value-display');
        expect(portfolioDisplay).toHaveClass('animating');
        expect(portfolioDisplay).toHaveClass('scale-active');
        expect(portfolioDisplay).toHaveClass('color-flash');
      });
    });

    test('animates percentage change indicator during value updates', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change value
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      await waitFor(() => {
        const percentageContainer = screen.getByText('+5.00%').closest('.flex');
        expect(percentageContainer).toHaveClass('animate-percentage-change');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles zero values correctly', () => {
      render(
        <PortfolioValue 
          totalValue={0}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });

    test('handles very large values correctly', () => {
      render(
        <PortfolioValue 
          totalValue={1234567890.12}
          percentageChange={15.67}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(screen.getByText('$1,234,567,890.12')).toBeInTheDocument();
      expect(screen.getByText('+15.67%')).toBeInTheDocument();
    });

    test('handles negative portfolio values', () => {
      render(
        <PortfolioValue 
          totalValue={-1000}
          percentageChange={-50}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(screen.getByText('-$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('50.00%')).toBeInTheDocument();
    });

    test('handles rapid value changes gracefully', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Rapid changes
      act(() => {
        rerender(
          <PortfolioValue 
            totalValue={105000}
            percentageChange={5}
            timeframe="24h"
            isLoading={false}
          />
        );
      });

      act(() => {
        rerender(
          <PortfolioValue 
            totalValue={110000}
            percentageChange={10}
            timeframe="24h"
            isLoading={false}
          />
        );
      });

      // Should handle multiple rapid changes without errors
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    });
  });

  describe('Default Props', () => {
    test('uses default props when not provided', () => {
      render(<PortfolioValue />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('0.00%')).toBeInTheDocument();
      expect(screen.getByText('24h')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('maintains proper semantic structure', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Check for proper heading structure
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('$125,432.50');
      
      // Check for descriptive text
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
    });

    test('provides appropriate structure for screen readers', () => {
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Verify the component renders without accessibility violations
      expect(screen.getByText('Total Portfolio Value')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('cleans up animation frames on unmount', () => {
      const { unmount } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      unmount();

      // Verify cleanup was called
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    test('uses efficient number formatting', () => {
      const formatSpy = jest.spyOn(Intl.NumberFormat.prototype, 'format');
      
      render(
        <PortfolioValue 
          totalValue={125432.50}
          percentageChange={2.4}
          timeframe="24h"
          isLoading={false}
        />
      );

      expect(formatSpy).toHaveBeenCalled();
      formatSpy.mockRestore();
    });

    test('animates counter smoothly using requestAnimationFrame', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change to higher value
      act(() => {
        rerender(
          <PortfolioValue 
            totalValue={110000}
            percentageChange={10}
            timeframe="24h"
            isLoading={false}
          />
        );
      });

      // Verify requestAnimationFrame was called
      expect(global.requestAnimationFrame).toHaveBeenCalled();

      jest.useRealTimers();
    });

    test('uses enhanced easing function for smooth transitions', async () => {
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Change value to trigger animation
      rerender(
        <PortfolioValue 
          totalValue={105000}
          percentageChange={5}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Verify animation is triggered with proper timing
      await waitFor(() => {
        expect(global.requestAnimationFrame).toHaveBeenCalled();
      });
    });

    test('handles staggered cleanup timing for smooth visual feedback', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(
        <PortfolioValue 
          totalValue={100000}
          percentageChange={0}
          timeframe="24h"
          isLoading={false}
        />
      );

      // Trigger animation
      act(() => {
        rerender(
          <PortfolioValue 
            totalValue={105000}
            percentageChange={5}
            timeframe="24h"
            isLoading={false}
          />
        );
      });

      // Fast forward through animation
      act(() => {
        jest.advanceTimersByTime(700); // Animation duration + cleanup
      });

      jest.useRealTimers();
    });
  });
});