/**
 * Offline Mode Demonstration Utility
 * 
 * Provides functions to demonstrate and test offline functionality
 * in development environment.
 */

import offlineService from '../services/offlineService';
import cacheService from '../services/cacheService';

/**
 * Simulate offline mode for testing
 */
export const simulateOfflineMode = async () => {
  console.log('🔌 Simulating offline mode...');
  
  // Populate cache with sample data
  await populateSampleCache();
  
  // Force offline mode
  offlineService.isOffline = true;
  offlineService.offlineStartTime = Date.now();
  offlineService.activateOfflineMode();
  
  console.log('📱 Offline mode activated with sample data');
  
  return {
    success: true,
    message: 'Offline mode simulation started',
    availableFeatures: offlineService.config.offlineFeatures,
    sampleData: getSampleDataSummary()
  };
};

/**
 * Restore online mode
 */
export const restoreOnlineMode = async () => {
  console.log('🌐 Restoring online mode...');
  
  offlineService.isOffline = false;
  offlineService.offlineStartTime = null;
  offlineService.restoreOnlineMode();
  
  console.log('✅ Online mode restored');
  
  return {
    success: true,
    message: 'Online mode restored'
  };
};

/**
 * Populate cache with sample data for demonstration
 */
const populateSampleCache = async () => {
  const sampleData = {
    portfolioData: {
      totalValue: 125000,
      percentageChange24h: 2.45,
      holdings: [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          amount: 2.5,
          currentPrice: 45000,
          value: 112500,
          percentageChange: 3.2,
          allocationPercentage: 90
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          amount: 5.0,
          currentPrice: 2500,
          value: 12500,
          percentageChange: -1.8,
          allocationPercentage: 10
        }
      ]
    },
    
    marketData: {
      globalMarketCap: 2500000000000,
      totalVolume24h: 85000000000,
      btcDominance: 42.5,
      fearGreedIndex: 65,
      topMovers: [
        { symbol: 'BTC', change: 3.2 },
        { symbol: 'ETH', change: -1.8 },
        { symbol: 'ADA', change: 5.7 }
      ]
    },
    
    prices: {
      BTC: { price: 45000, change24h: 3.2 },
      ETH: { price: 2500, change24h: -1.8 },
      ADA: { price: 0.45, change24h: 5.7 }
    },
    
    transactionHistory: [
      {
        id: '1',
        type: 'buy',
        symbol: 'BTC',
        amount: 0.5,
        price: 44000,
        timestamp: Date.now() - 86400000, // 1 day ago
        status: 'completed'
      },
      {
        id: '2',
        type: 'sell',
        symbol: 'ETH',
        amount: 1.0,
        price: 2600,
        timestamp: Date.now() - 172800000, // 2 days ago
        status: 'completed'
      }
    ],
    
    chartData: {
      BTC: generateSampleChartData('BTC', 30),
      ETH: generateSampleChartData('ETH', 30)
    }
  };
  
  // Cache the sample data with different ages
  const now = Date.now();
  
  cacheService.set('portfolioData', 'user_portfolio', sampleData.portfolioData, null, 'medium');
  cacheService.set('marketData', 'market_overview', sampleData.marketData, null, 'high');
  cacheService.set('prices', 'current_prices', sampleData.prices, null, 'high');
  cacheService.set('transactionHistory', 'user_transactions', sampleData.transactionHistory, null, 'low');
  cacheService.set('chartData', 'btc_chart', sampleData.chartData.BTC, null, 'medium');
  cacheService.set('chartData', 'eth_chart', sampleData.chartData.ETH, null, 'medium');
  
  console.log('📊 Sample data cached successfully');
};

/**
 * Generate sample chart data
 */
const generateSampleChartData = (symbol, days) => {
  const data = [];
  const basePrice = symbol === 'BTC' ? 45000 : 2500;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const price = basePrice * (1 + variation);
    
    data.push({
      timestamp: date.getTime(),
      open: price * 0.99,
      high: price * 1.02,
      low: price * 0.97,
      close: price,
      volume: Math.random() * 1000000
    });
  }
  
  return data;
};

/**
 * Get summary of cached sample data
 */
const getSampleDataSummary = () => {
  return {
    portfolioValue: 125000,
    holdingsCount: 2,
    transactionsCount: 2,
    chartDataPoints: 31,
    dataTypes: ['portfolioData', 'marketData', 'prices', 'transactionHistory', 'chartData']
  };
};

/**
 * Test offline search functionality
 */
export const testOfflineSearch = async (query = 'bitcoin') => {
  console.log(`🔍 Testing offline search for: "${query}"`);
  
  if (!offlineService.isOffline) {
    console.warn('⚠️ Not in offline mode. Use simulateOfflineMode() first.');
    return { success: false, message: 'Not in offline mode' };
  }
  
  try {
    const results = await offlineService.searchOfflineData(query, {
      dataTypes: ['portfolioData', 'marketData', 'transactionHistory'],
      maxResults: 10,
      includeStale: true
    });
    
    console.log(`📋 Found ${results.length} results:`, results);
    
    return {
      success: true,
      query,
      resultsCount: results.length,
      results: results.slice(0, 5) // Return first 5 for demo
    };
  } catch (error) {
    console.error('❌ Search failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test offline data export
 */
export const testOfflineExport = async (format = 'json') => {
  console.log(`📤 Testing offline data export (${format})...`);
  
  if (!offlineService.isOffline) {
    console.warn('⚠️ Not in offline mode. Use simulateOfflineMode() first.');
    return { success: false, message: 'Not in offline mode' };
  }
  
  try {
    const exportData = await offlineService.exportCachedData({
      dataTypes: ['portfolioData', 'marketData', 'transactionHistory'],
      format,
      includeMetadata: true
    });
    
    console.log('📊 Export successful:', {
      format,
      dataTypes: Object.keys(exportData.dataTypes || {}),
      exportTimestamp: new Date(exportData.exportTimestamp)
    });
    
    return {
      success: true,
      format,
      dataSize: JSON.stringify(exportData).length,
      dataTypes: Object.keys(exportData.dataTypes || {}),
      exportData: format === 'json' ? exportData : 'CSV data generated'
    };
  } catch (error) {
    console.error('❌ Export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get comprehensive offline status for demo
 */
export const getOfflineStatusDemo = () => {
  console.log('📊 Getting comprehensive offline status...');
  
  const status = offlineService.getComprehensiveOfflineStatus();
  
  console.log('📱 Offline Status:', {
    isOffline: status.isOffline,
    offlineDuration: status.offlineDuration,
    availableFeatures: status.availableFeatures?.length || 0,
    dataQuality: {
      fresh: status.dataQuality?.fresh?.size || 0,
      stale: status.dataQuality?.stale?.size || 0,
      veryStale: status.dataQuality?.veryStale?.size || 0
    },
    recommendations: status.recommendations?.length || 0
  });
  
  return status;
};

/**
 * Run complete offline demo
 */
export const runOfflineDemo = async () => {
  console.log('🚀 Starting comprehensive offline mode demo...\n');
  
  try {
    // 1. Simulate offline mode
    console.log('Step 1: Activating offline mode');
    const offlineResult = await simulateOfflineMode();
    console.log('✅', offlineResult.message, '\n');
    
    // Wait a moment for offline mode to fully activate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Get offline status
    console.log('Step 2: Checking offline status');
    const status = getOfflineStatusDemo();
    console.log('✅ Status retrieved\n');
    
    // 3. Test search functionality
    console.log('Step 3: Testing offline search');
    const searchResult = await testOfflineSearch('bitcoin');
    console.log('✅', `Search completed - ${searchResult.resultsCount} results\n`);
    
    // 4. Test export functionality
    console.log('Step 4: Testing data export');
    const exportResult = await testOfflineExport('json');
    console.log('✅', `Export completed - ${exportResult.dataSize} bytes\n`);
    
    // 5. Show final summary
    console.log('📋 Demo Summary:');
    console.log(`- Offline features available: ${status.availableFeatures?.length || 0}`);
    console.log(`- Fresh data sources: ${status.dataQuality?.fresh?.size || 0}`);
    console.log(`- Search results found: ${searchResult.resultsCount}`);
    console.log(`- Export data size: ${exportResult.dataSize} bytes`);
    console.log('\n🎉 Offline demo completed successfully!');
    
    return {
      success: true,
      steps: {
        offlineActivation: offlineResult,
        statusCheck: status,
        searchTest: searchResult,
        exportTest: exportResult
      }
    };
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up demo data
 */
export const cleanupDemo = async () => {
  console.log('🧹 Cleaning up demo data...');
  
  // Restore online mode
  await restoreOnlineMode();
  
  // Clear demo cache data
  const demoKeys = [
    'portfolioData_user_portfolio',
    'marketData_market_overview',
    'prices_current_prices',
    'transactionHistory_user_transactions',
    'chartData_btc_chart',
    'chartData_eth_chart'
  ];
  
  demoKeys.forEach(key => {
    cacheService.invalidate(key.split('_')[0], key.split('_').slice(1).join('_'));
  });
  
  console.log('✅ Demo cleanup completed');
  
  return { success: true, message: 'Demo cleanup completed' };
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.offlineDemo = {
    simulate: simulateOfflineMode,
    restore: restoreOnlineMode,
    search: testOfflineSearch,
    export: testOfflineExport,
    status: getOfflineStatusDemo,
    run: runOfflineDemo,
    cleanup: cleanupDemo
  };
  
  console.log('🛠️ Offline demo utilities available at window.offlineDemo');
  console.log('📖 Try: window.offlineDemo.run() to start the demo');
}

export default {
  simulateOfflineMode,
  restoreOnlineMode,
  testOfflineSearch,
  testOfflineExport,
  getOfflineStatusDemo,
  runOfflineDemo,
  cleanupDemo
};