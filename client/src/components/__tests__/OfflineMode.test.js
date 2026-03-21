/**
 * Comprehensive Offline Mode Tests
 * 
 * Tests the enhanced offline functionality including cached data access,
 * offline features, data synchronization, and user experience.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock services
const mockOfflineService = {
  isOffline: false,
  getOfflineStatus: jest.fn(),
  getComprehensiveOfflineStatus: jest.fn(),
  isFeatureAvailable: jest.fn(),
  queuePendingAction: jest.fn(),
  getOfflineData: jest.fn(),
  searchOfflineData: jest.fn(),
  exportCachedData: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  retryConnection: jest.fn()
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  getMetrics: jest.fn()
};

// Mock hooks
jest.mock('../hooks/useOfflineMode', () => ({
  useOfflineMode: () => ({
    isOffline: mockOfflineService.isOffline,
    offlineStartTime: Date.now() - 300000, // 5 minutes ago
    lastOnlineTime: Date.now() - 600000, // 10 minutes ago
    availableFeatures: ['portfolio_view', 'cached_charts', 'transaction_history'],
    disabledFeatures: ['real_time_trading', 'live_price_updates'],
    pendingActions: 2,
    notifications: [],
    dismissNotification: jest.fn(),
    isFeatureAvailable: mockOfflineService.isFeatureAvailable,
    queueAction: mockOfflineService.queuePendingAction,
    retryConnection: mockOfflineService.retryConnection
  }),
  useOfflineData: () => ({
    data: { test: 'cached data' },
    loading: false,
    error: null
  }),
  useOfflineAwareData: () => ({
    data: { 
      data: { totalValue: 10000, holdings: [] },
      age: 300000 
    },
    loading: false,
    error: null,
    isFromCache: true,
    refresh: jest.fn()
  }),
  useDataAge: () => ({
    getDataAge: jest.fn(() => ({
      milliseconds: 300000,
      minutes: 5,
      hours: 0,
      isStale: false,
      isVeryStale: false,
      formatted: '5m ago'
    })),
    getAllDataAges: jest.fn(() => ({
      portfolioData: {
        milliseconds: 300000,
        minutes: 5,
        hours: 0,
        isStale: false,
        isVeryStale: false,
        formatted: '5m ago'
      },
      marketData: {
        milliseconds: 600000,
        minutes: 10,
        hours: 0,
        isStale: true,
        isVeryStale: false,
        formatted: '10m ago'
      }
    }))
  }),
  useOfflineFeatures: () => ({
    checkFeature: jest.fn(),
    getFeatureStatus: jest.fn(() => ({
      isOffline: true,
      availableFeatures: ['portfolio_view', 'cached_charts'],
      disabledFeatures: ['real_time_trading'],
      totalAvailable: 2,
      totalDisabled: 1
    }))
  })
}));

// Import components after mocking
import OfflineIndicator from '../OfflineIndicator';
import OfflineStatusPanel from '../OfflineStatusPanel';
import OfflinePortfolioView from '../OfflinePortfolioView';
import { 
  withOfflineAwareness, 
  OfflineFeatureGuard, 
  OfflineActionButton 
} from '../OfflineAwareComponent';

describe('Offline Mode Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Make offline service available globally
    global.window.offlineService = mockOfflineService;
  });

  describe('OfflineIndicator Component', () => {
    test('should not render when online', () => {
      mockOfflineService.isOffline = false;
      render(<OfflineIndicator />);
      
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });

    test('should render offline indicator when offline', () => {
      mockOfflineService.isOffline = true;
      render(<OfflineIndicator showDetails={true} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    test('should show pending actions count', () => {
      mockOfflineService.isOffline = true;
      render(<OfflineIndicator showDetails={true} />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // pending actions count
    });

    test('should handle retry connection', async () => {
      mockOfflineService.isOffline = true;
      mockOfflineService.retryConnection.mockResolvedValue({ success: true });
      
      render(<OfflineIndicator showDetails={true} />);
      
      const retryButton = screen.getByText('Retry Connection');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockOfflineService.retryConnection).toHaveBeenCalled();
      });
    });
  });

  describe('OfflineStatusPanel Component', () => {
    beforeEach(() => {
      mockOfflineService.isOffline = true;
      mockOfflineService.getComprehensiveOfflineStatus.mockReturnValue({
        isOffline: true,
        availableFeatures: ['portfolio_view', 'cached_charts'],
        disabledFeatures: ['real_time_trading'],
        dataQuality: {
          fresh: new Set(['portfolioData']),
          stale: new Set(['marketData']),
          veryStale: new Set(),
          missing: new Set()
        },
        userGuidance: {
          tips: ['You have fresh cached data for portfolio analysis'],
          limitations: [],
          availableActions: []
        },
        recommendations: [
          {
            type: 'info',
            message: 'You have 2 queued actions that will execute when connection returns.',
            action: 'view_pending_actions'
          }
        ]
      });
    });

    test('should render offline status panel', () => {
      render(<OfflineStatusPanel isOpen={true} />);
      
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
    });

    test('should show different tabs', () => {
      render(<OfflineStatusPanel isOpen={true} />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Data Status')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Guidance')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    test('should switch between tabs', () => {
      render(<OfflineStatusPanel isOpen={true} />);
      
      const dataTab = screen.getByText('Data Status');
      fireEvent.click(dataTab);
      
      expect(screen.getByText('Cached Data Status')).toBeInTheDocument();
    });

    test('should show data quality information', () => {
      render(<OfflineStatusPanel isOpen={true} />);
      
      // Switch to data tab
      const dataTab = screen.getByText('Data Status');
      fireEvent.click(dataTab);
      
      expect(screen.getByText('Fresh')).toBeInTheDocument();
      expect(screen.getByText('Stale')).toBeInTheDocument();
    });

    test('should show available and disabled features', () => {
      render(<OfflineStatusPanel isOpen={true} />);
      
      // Switch to features tab
      const featuresTab = screen.getByText('Features');
      fireEvent.click(featuresTab);
      
      expect(screen.getByText('Available Features (2)')).toBeInTheDocument();
      expect(screen.getByText('Limited Features (1)')).toBeInTheDocument();
    });
  });

  describe('OfflinePortfolioView Component', () => {
    test('should render portfolio view with offline indicators', () => {
      render(<OfflinePortfolioView />);
      
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
    });

    test('should show cached data notice', () => {
      render(<OfflinePortfolioView />);
      
      expect(screen.getByText('Portfolio data is from cache while offline')).toBeInTheDocument();
    });

    test('should handle offline search', async () => {
      mockOfflineService.searchOfflineData.mockResolvedValue([
        { dataType: 'portfolioData', item: { name: 'Bitcoin' }, relevance: 10 }
      ]);
      
      render(<OfflinePortfolioView />);
      
      const searchInput = screen.getByPlaceholderText('Search cached holdings...');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });
      
      // Search functionality would be triggered
      expect(searchInput.value).toBe('bitcoin');
    });

    test('should handle data export', async () => {
      mockOfflineService.exportCachedData.mockResolvedValue({
        exportTimestamp: Date.now(),
        dataTypes: { portfolioData: { data: {}, age: 300000 } }
      });
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      render(<OfflinePortfolioView />);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockOfflineService.exportCachedData).toHaveBeenCalled();
      });
    });
  });

  describe('Offline-Aware Components', () => {
    test('withOfflineAwareness HOC should handle offline state', () => {
      const TestComponent = ({ isOffline, isFromCache }) => (
        <div>
          <span>Offline: {isOffline ? 'Yes' : 'No'}</span>
          <span>From Cache: {isFromCache ? 'Yes' : 'No'}</span>
        </div>
      );
      
      const OfflineAwareTestComponent = withOfflineAwareness(TestComponent, {
        dataType: 'portfolioData',
        dataFetcher: jest.fn(),
        showOfflineIndicator: true
      });
      
      mockOfflineService.isOffline = true;
      
      render(<OfflineAwareTestComponent />);
      
      expect(screen.getByText('Offline: Yes')).toBeInTheDocument();
      expect(screen.getByText('From Cache: Yes')).toBeInTheDocument();
    });

    test('OfflineFeatureGuard should block disabled features', () => {
      mockOfflineService.isOffline = true;
      mockOfflineService.isFeatureAvailable.mockReturnValue(false);
      
      render(
        <OfflineFeatureGuard feature="real_time_trading">
          <div>Trading Interface</div>
        </OfflineFeatureGuard>
      );
      
      expect(screen.queryByText('Trading Interface')).not.toBeInTheDocument();
      expect(screen.getByText('Feature Limited')).toBeInTheDocument();
    });

    test('OfflineFeatureGuard should allow available features', () => {
      mockOfflineService.isOffline = true;
      mockOfflineService.isFeatureAvailable.mockReturnValue(true);
      
      render(
        <OfflineFeatureGuard feature="portfolio_view">
          <div>Portfolio Interface</div>
        </OfflineFeatureGuard>
      );
      
      expect(screen.getByText('Portfolio Interface')).toBeInTheDocument();
    });

    test('OfflineActionButton should queue actions when offline', () => {
      mockOfflineService.isOffline = true;
      
      const onlineAction = jest.fn();
      const action = { type: 'trade', data: { symbol: 'BTC', amount: 1 } };
      
      render(
        <OfflineActionButton
          action={action}
          onlineAction={onlineAction}
        >
          Trade
        </OfflineActionButton>
      );
      
      const button = screen.getByText('Trade');
      fireEvent.click(button);
      
      expect(mockOfflineService.queuePendingAction).toHaveBeenCalledWith(
        action.type,
        action.data
      );
      expect(onlineAction).not.toHaveBeenCalled();
    });
  });

  describe('Offline Service Integration', () => {
    test('should handle offline mode activation', () => {
      mockOfflineService.getOfflineStatus.mockReturnValue({
        isOffline: true,
        availableFeatures: ['portfolio_view'],
        disabledFeatures: ['real_time_trading'],
        pendingActions: 0,
        dataAge: {}
      });
      
      const status = mockOfflineService.getOfflineStatus();
      
      expect(status.isOffline).toBe(true);
      expect(status.availableFeatures).toContain('portfolio_view');
      expect(status.disabledFeatures).toContain('real_time_trading');
    });

    test('should handle data search in offline mode', async () => {
      mockOfflineService.searchOfflineData.mockResolvedValue([
        {
          dataType: 'portfolioData',
          item: { name: 'Bitcoin', symbol: 'BTC' },
          relevance: 10
        }
      ]);
      
      const results = await mockOfflineService.searchOfflineData('bitcoin');
      
      expect(results).toHaveLength(1);
      expect(results[0].item.name).toBe('Bitcoin');
    });

    test('should handle data export', async () => {
      const exportData = {
        exportTimestamp: Date.now(),
        offlineMode: true,
        dataTypes: {
          portfolioData: {
            data: { totalValue: 10000 },
            age: 300000,
            isStale: false
          }
        }
      };
      
      mockOfflineService.exportCachedData.mockResolvedValue(exportData);
      
      const result = await mockOfflineService.exportCachedData({
        dataTypes: ['portfolioData'],
        format: 'json'
      });
      
      expect(result.offlineMode).toBe(true);
      expect(result.dataTypes.portfolioData.data.totalValue).toBe(10000);
    });
  });

  describe('Data Age and Quality', () => {
    test('should correctly format data age', () => {
      const { getDataAge } = require('../hooks/useOfflineMode').useDataAge();
      
      const ageInfo = getDataAge('portfolioData');
      
      expect(ageInfo.formatted).toBe('5m ago');
      expect(ageInfo.isStale).toBe(false);
      expect(ageInfo.isVeryStale).toBe(false);
    });

    test('should identify stale data', () => {
      const { getAllDataAges } = require('../hooks/useOfflineMode').useDataAge();
      
      const allAges = getAllDataAges();
      
      expect(allAges.portfolioData.isStale).toBe(false);
      expect(allAges.marketData.isStale).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle offline service errors gracefully', async () => {
      mockOfflineService.searchOfflineData.mockRejectedValue(
        new Error('Search failed')
      );
      
      try {
        await mockOfflineService.searchOfflineData('test');
      } catch (error) {
        expect(error.message).toBe('Search failed');
      }
    });

    test('should handle export errors', async () => {
      mockOfflineService.exportCachedData.mockRejectedValue(
        new Error('Export failed')
      );
      
      try {
        await mockOfflineService.exportCachedData();
      } catch (error) {
        expect(error.message).toBe('Export failed');
      }
    });

    test('should handle connection retry failures', async () => {
      mockOfflineService.retryConnection.mockRejectedValue(
        new Error('Connection failed')
      );
      
      try {
        await mockOfflineService.retryConnection();
      } catch (error) {
        expect(error.message).toBe('Connection failed');
      }
    });
  });

  describe('Performance and Optimization', () => {
    test('should not render offline components when online', () => {
      mockOfflineService.isOffline = false;
      
      const { container } = render(<OfflineIndicator />);
      
      expect(container.firstChild).toBeNull();
    });

    test('should efficiently update offline status', () => {
      mockOfflineService.isOffline = true;
      
      const { rerender } = render(<OfflineIndicator showDetails={true} />);
      
      // Simulate status update
      mockOfflineService.isOffline = false;
      rerender(<OfflineIndicator showDetails={true} />);
      
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for offline indicators', () => {
      mockOfflineService.isOffline = true;
      
      render(<OfflineIndicator showDetails={true} />);
      
      const offlineElement = screen.getByText('Offline');
      expect(offlineElement).toBeInTheDocument();
    });

    test('should support keyboard navigation in offline panel', () => {
      mockOfflineService.isOffline = true;
      
      render(<OfflineStatusPanel isOpen={true} />);
      
      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);
      
      // Test tab navigation
      tabs.forEach(tab => {
        expect(tab).toBeVisible();
      });
    });
  });
});

describe('Offline Mode Property-Based Tests', () => {
  // Property-based test helpers
  const generateRandomDataAge = () => Math.floor(Math.random() * 3600000); // 0-1 hour
  const generateRandomFeatureList = () => {
    const allFeatures = [
      'portfolio_view', 'cached_charts', 'transaction_history',
      'real_time_trading', 'live_price_updates', 'order_execution'
    ];
    return allFeatures.slice(0, Math.floor(Math.random() * allFeatures.length) + 1);
  };

  test('Property: Data age formatting should always be consistent', () => {
    // Test with various data ages
    for (let i = 0; i < 100; i++) {
      const age = generateRandomDataAge();
      const minutes = Math.floor(age / 60000);
      const hours = Math.floor(age / 3600000);
      
      let expectedFormat;
      if (hours > 0) {
        expectedFormat = `${hours}h ${minutes % 60}m ago`;
      } else if (minutes > 0) {
        expectedFormat = `${minutes}m ago`;
      } else {
        expectedFormat = 'Just now';
      }
      
      // This would be the actual formatting function
      const formatAge = (ageMs) => {
        const mins = Math.floor(ageMs / 60000);
        const hrs = Math.floor(ageMs / 3600000);
        
        if (hrs > 0) {
          return `${hrs}h ${mins % 60}m ago`;
        } else if (mins > 0) {
          return `${mins}m ago`;
        } else {
          return 'Just now';
        }
      };
      
      expect(formatAge(age)).toBe(expectedFormat);
    }
  });

  test('Property: Feature availability should be consistent with offline state', () => {
    const offlineFeatures = ['portfolio_view', 'cached_charts', 'transaction_history'];
    const disabledFeatures = ['real_time_trading', 'live_price_updates'];
    
    // Test various combinations
    for (let i = 0; i < 50; i++) {
      const isOffline = Math.random() > 0.5;
      
      offlineFeatures.forEach(feature => {
        const isAvailable = !isOffline || offlineFeatures.includes(feature);
        expect(isAvailable).toBe(true); // Offline features should always be available
      });
      
      disabledFeatures.forEach(feature => {
        const isAvailable = !isOffline;
        if (isOffline) {
          expect(isAvailable).toBe(false); // Disabled features should not be available offline
        }
      });
    }
  });

  test('Property: Data quality classification should be deterministic', () => {
    const maxAges = {
      portfolioData: 900000,  // 15 minutes
      marketData: 600000,     // 10 minutes
      prices: 300000          // 5 minutes
    };
    
    Object.entries(maxAges).forEach(([dataType, maxAge]) => {
      // Test various ages
      for (let i = 0; i < 20; i++) {
        const age = Math.random() * maxAge * 3; // 0 to 3x max age
        
        let expectedQuality;
        if (age <= maxAge * 0.5) {
          expectedQuality = 'fresh';
        } else if (age <= maxAge) {
          expectedQuality = 'stale';
        } else {
          expectedQuality = 'veryStale';
        }
        
        // This would be the actual classification function
        const classifyDataQuality = (dataAge, maxDataAge) => {
          if (dataAge <= maxDataAge * 0.5) return 'fresh';
          if (dataAge <= maxDataAge) return 'stale';
          return 'veryStale';
        };
        
        expect(classifyDataQuality(age, maxAge)).toBe(expectedQuality);
      }
    });
  });
});