import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VirtualScrollTable from '../base/VirtualScrollTable';
import Pagination from '../base/Pagination';
import IncrementalLoader from '../base/IncrementalLoader';
import EnhancedCryptocurrencyTable from '../EnhancedCryptocurrencyTable';
import { useProgressiveLoading } from '../../hooks/useProgressiveLoading';

// Mock data for testing
const mockCoinData = Array.from({ length: 1000 }, (_, index) => ({
  id: `coin-${index}`,
  name: `Coin ${index}`,
  symbol: `C${index}`,
  rank: index + 1,
  price: Math.random() * 1000,
  change24h: (Math.random() - 0.5) * 20,
  volume24h: Math.random() * 1000000,
  marketCap: Math.random() * 10000000,
  sparklineData: Array.from({ length: 24 }, () => Math.random() * 100)
}));

const mockColumns = [
  { key: 'rank', title: '#', width: '16', sortable: true },
  { key: 'name', title: 'Name', sortable: true },
  { key: 'price', title: 'Price', align: 'right', sortable: true },
  { key: 'change24h', title: '24h %', align: 'right', sortable: true }
];

describe('Progressive Loading Components', () => {
  describe('VirtualScrollTable', () => {
    test('renders table with virtual scrolling for large datasets', () => {
      render(
        <VirtualScrollTable
          data={mockCoinData}
          columns={mockColumns}
          height={400}
          itemHeight={60}
        />
      );

      // Should render header
      expect(screen.getByText('#')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      
      // Should only render visible items (not all 1000)
      const visibleItems = screen.getAllByText(/Coin \d+/);
      expect(visibleItems.length).toBeLessThan(50); // Much less than total
    });

    test('handles sorting correctly', () => {
      const mockOnSort = jest.fn();
      render(
        <VirtualScrollTable
          data={mockCoinData.slice(0, 10)}
          columns={mockColumns}
          onSort={mockOnSort}
        />
      );

      // Click on sortable column header
      fireEvent.click(screen.getByText('Price'));
      expect(mockOnSort).toHaveBeenCalledWith('price');
    });

    test('handles search highlighting', () => {
      render(
        <VirtualScrollTable
          data={mockCoinData.slice(0, 5)}
          columns={mockColumns}
          searchTerm="Coin 1"
          highlightSearchTerm={true}
        />
      );

      // Should highlight search term
      const highlightedElements = document.querySelectorAll('mark');
      expect(highlightedElements.length).toBeGreaterThan(0);
    });

    test('shows loading state', () => {
      render(
        <VirtualScrollTable
          data={[]}
          columns={mockColumns}
          loading={true}
          loadingRows={5}
        />
      );

      // Should show skeleton rows
      expect(document.querySelectorAll('.skeleton, [class*="skeleton"]').length).toBeGreaterThan(0);
    });

    test('shows empty state when no data', () => {
      render(
        <VirtualScrollTable
          data={[]}
          columns={mockColumns}
          loading={false}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('renders pagination controls correctly', () => {
      const mockOnPageChange = jest.fn();
      render(
        <Pagination
          currentPage={5}
          totalPages={10}
          totalItems={100}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );

      // Should show current page info
      expect(screen.getByText(/Showing 41 to 50 of 100 results/)).toBeInTheDocument();
      
      // Should have navigation buttons
      expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });

    test('handles page changes', () => {
      const mockOnPageChange = jest.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );

      // Click next page
      fireEvent.click(screen.getByLabelText('Go to next page'));
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    test('disables navigation at boundaries', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onPageChange={jest.fn()}
        />
      );

      // Previous button should be disabled on first page
      expect(screen.getByLabelText('Go to previous page')).toBeDisabled();
    });

    test('handles items per page change', () => {
      const mockOnItemsPerPageChange = jest.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          totalItems={50}
          itemsPerPage={10}
          onItemsPerPageChange={mockOnItemsPerPageChange}
        />
      );

      // Change items per page
      const select = screen.getByDisplayValue('10');
      fireEvent.change(select, { target: { value: '25' } });
      expect(mockOnItemsPerPageChange).toHaveBeenCalledWith(25);
    });
  });

  describe('IncrementalLoader', () => {
    test('renders items and loads more on scroll', async () => {
      const mockLoadMore = jest.fn().mockResolvedValue();
      
      render(
        <IncrementalLoader
          data={mockCoinData.slice(0, 20)}
          loadMore={mockLoadMore}
          hasMore={true}
          mode="infinite"
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      );

      // Should render initial items
      expect(screen.getByText('Coin 0')).toBeInTheDocument();
      expect(screen.getByText('Coin 19')).toBeInTheDocument();

      // Should have intersection sentinel for infinite scroll
      const sentinel = document.querySelector('[class*="h-4"]');
      expect(sentinel).toBeInTheDocument();
    });

    test('shows loading state during data fetch', () => {
      render(
        <IncrementalLoader
          data={mockCoinData.slice(0, 10)}
          loadMore={jest.fn()}
          hasMore={true}
          loading={true}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      );

      expect(screen.getByText('Loading more items...')).toBeInTheDocument();
    });

    test('shows end state when no more data', () => {
      render(
        <IncrementalLoader
          data={mockCoinData.slice(0, 10)}
          loadMore={jest.fn()}
          hasMore={false}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      );

      expect(screen.getByText("You've reached the end")).toBeInTheDocument();
    });

    test('handles button mode for manual loading', () => {
      const mockLoadMore = jest.fn();
      render(
        <IncrementalLoader
          data={mockCoinData.slice(0, 10)}
          loadMore={mockLoadMore}
          hasMore={true}
          mode="button"
          batchSize={20}
          renderItem={(item) => <div key={item.id}>{item.name}</div>}
        />
      );

      // Should show load more button
      const loadMoreButton = screen.getByText(/Load More \(20 items\)/);
      expect(loadMoreButton).toBeInTheDocument();

      // Click should trigger load more
      fireEvent.click(loadMoreButton);
      expect(mockLoadMore).toHaveBeenCalled();
    });
  });

  describe('EnhancedCryptocurrencyTable', () => {
    test('renders with different loading modes', () => {
      render(
        <EnhancedCryptocurrencyTable
          coins={mockCoinData.slice(0, 100)}
          loadingMode="virtual"
        />
      );

      expect(screen.getByText('Cryptocurrency Market')).toBeInTheDocument();
      
      // Should have view mode toggles
      expect(document.querySelector('[class*="bg-gray-100"]')).toBeInTheDocument();
    });

    test('switches between view modes', () => {
      render(
        <EnhancedCryptocurrencyTable
          coins={mockCoinData.slice(0, 50)}
          loadingMode="pagination"
        />
      );

      // Should render in pagination mode initially
      expect(screen.getByText(/Showing \d+ to \d+ of \d+ results/)).toBeInTheDocument();
    });

    test('handles search functionality', async () => {
      render(
        <EnhancedCryptocurrencyTable
          coins={mockCoinData.slice(0, 20)}
          enableSearch={true}
        />
      );

      // Should have search input
      const searchInput = screen.getByPlaceholderText('Search cryptocurrencies...');
      expect(searchInput).toBeInTheDocument();
    });

    test('handles favorites functionality', () => {
      render(
        <EnhancedCryptocurrencyTable
          coins={mockCoinData.slice(0, 10)}
          enableFavorites={true}
        />
      );

      // Should have favorites button
      expect(screen.getByText('Favorites')).toBeInTheDocument();
    });
  });
});

// Hook tests
describe('useProgressiveLoading Hook', () => {
  const TestComponent = ({ data, mode, pageSize }) => {
    const {
      displayData,
      totalItems,
      currentPage,
      totalPages,
      goToPage,
      loadMore,
      hasMore
    } = useProgressiveLoading({
      data,
      mode,
      pageSize
    });

    return (
      <div>
        <div data-testid="total-items">{totalItems}</div>
        <div data-testid="current-page">{currentPage}</div>
        <div data-testid="total-pages">{totalPages}</div>
        <div data-testid="display-count">{displayData.length}</div>
        <button onClick={() => goToPage(2)}>Go to Page 2</button>
        {mode === 'infinite' && (
          <button onClick={loadMore} disabled={!hasMore}>
            Load More
          </button>
        )}
      </div>
    );
  };

  test('handles pagination mode correctly', () => {
    render(
      <TestComponent
        data={mockCoinData.slice(0, 100)}
        mode="pagination"
        pageSize={10}
      />
    );

    expect(screen.getByTestId('total-items')).toHaveTextContent('100');
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('10');
    expect(screen.getByTestId('display-count')).toHaveTextContent('10');
  });

  test('handles page navigation', () => {
    render(
      <TestComponent
        data={mockCoinData.slice(0, 50)}
        mode="pagination"
        pageSize={10}
      />
    );

    // Navigate to page 2
    fireEvent.click(screen.getByText('Go to Page 2'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
  });

  test('handles infinite scroll mode', async () => {
    render(
      <TestComponent
        data={mockCoinData.slice(0, 100)}
        mode="infinite"
        pageSize={20}
      />
    );

    // Initially should show first batch
    expect(screen.getByTestId('display-count')).toHaveTextContent('20');

    // Load more should increase count
    fireEvent.click(screen.getByText('Load More'));
    
    await waitFor(() => {
      expect(screen.getByTestId('display-count')).toHaveTextContent('40');
    });
  });

  test('handles virtual mode correctly', () => {
    render(
      <TestComponent
        data={mockCoinData.slice(0, 1000)}
        mode="virtual"
        pageSize={50}
      />
    );

    // Virtual mode should show all data
    expect(screen.getByTestId('display-count')).toHaveTextContent('1000');
  });
});

// Performance tests
describe('Progressive Loading Performance', () => {
  test('virtual scrolling handles large datasets efficiently', () => {
    const startTime = performance.now();
    
    render(
      <VirtualScrollTable
        data={mockCoinData}
        columns={mockColumns}
        height={400}
        itemHeight={60}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render quickly even with large dataset
    expect(renderTime).toBeLessThan(100); // Less than 100ms
  });

  test('pagination reduces initial render load', () => {
    const startTime = performance.now();
    
    render(
      <EnhancedCryptocurrencyTable
        coins={mockCoinData}
        loadingMode="pagination"
        pageSize={25}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render quickly with pagination
    expect(renderTime).toBeLessThan(50); // Less than 50ms
  });
});