import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  List, 
  Infinity, 
  BarChart3, 
  Clock, 
  Zap,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';
import EnhancedCryptocurrencyTable from './EnhancedCryptocurrencyTable';
import VirtualScrollTable from './base/VirtualScrollTable';
import Pagination from './base/Pagination';
import IncrementalLoader from './base/IncrementalLoader';
import { useProgressiveLoading } from '../hooks/useProgressiveLoading';

/**
 * ProgressiveLoadingDemo - Demonstration of progressive loading capabilities
 * Shows different loading strategies for large datasets
 * Requirements: 11.4 - Progressive loading for large datasets
 */
const ProgressiveLoadingDemo = () => {
  const [activeDemo, setActiveDemo] = useState('enhanced-table');
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // Generate large dataset for demonstration
  const largeCoinDataset = useMemo(() => {
    return Array.from({ length: 5000 }, (_, index) => ({
      id: `demo-coin-${index}`,
      name: `DemoCoin ${index}`,
      symbol: `DC${index}`,
      rank: index + 1,
      price: Math.random() * 1000 + 0.01,
      change1h: (Math.random() - 0.5) * 10,
      change24h: (Math.random() - 0.5) * 20,
      change7d: (Math.random() - 0.5) * 50,
      volume24h: Math.random() * 10000000,
      marketCap: Math.random() * 1000000000,
      sparklineData: Array.from({ length: 24 }, () => Math.random() * 100 + 50)
    }));
  }, []);

  // Performance measurement
  const measurePerformance = (demoName, operation) => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    setPerformanceMetrics(prev => ({
      ...prev,
      [demoName]: {
        renderTime: endTime - startTime,
        timestamp: new Date().toLocaleTimeString()
      }
    }));
    
    return result;
  };

  // Demo configurations
  const demos = [
    {
      id: 'enhanced-table',
      title: 'Enhanced Cryptocurrency Table',
      description: 'Complete table with multiple loading modes, search, and filters',
      icon: BarChart3,
      color: 'bg-blue-500'
    },
    {
      id: 'virtual-scroll',
      title: 'Virtual Scrolling',
      description: 'Efficient rendering of large datasets with virtual scrolling',
      icon: Grid,
      color: 'bg-green-500'
    },
    {
      id: 'pagination',
      title: 'Pagination',
      description: 'Traditional pagination with smooth transitions',
      icon: List,
      color: 'bg-purple-500'
    },
    {
      id: 'infinite-scroll',
      title: 'Infinite Scroll',
      description: 'Progressive loading with intersection observer',
      icon: Infinity,
      color: 'bg-orange-500'
    }
  ];

  // Render demo content
  const renderDemoContent = () => {
    switch (activeDemo) {
      case 'enhanced-table':
        return measurePerformance('enhanced-table', () => (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Features Demonstrated:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Multiple view modes (Virtual, Pagination, Infinite)</li>
                <li>• Real-time search and filtering</li>
                <li>• Sortable columns with visual indicators</li>
                <li>• Favorites management</li>
                <li>• Responsive design with mobile optimization</li>
              </ul>
            </div>
            
            <EnhancedCryptocurrencyTable
              coins={largeCoinDataset.slice(0, 1000)}
              loadingMode="virtual"
              pageSize={50}
              virtualHeight={500}
              enableSearch={true}
              enableFilters={true}
              enableSorting={true}
              enableFavorites={true}
              className="shadow-lg"
            />
          </div>
        ));

      case 'virtual-scroll':
        return measurePerformance('virtual-scroll', () => (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Virtual Scrolling Benefits:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Renders only visible items (60fps performance)</li>
                <li>• Handles datasets of any size efficiently</li>
                <li>• Smooth scrolling with momentum</li>
                <li>• Memory efficient - constant DOM size</li>
              </ul>
            </div>

            <VirtualScrollDemo dataset={largeCoinDataset} />
          </div>
        ));

      case 'pagination':
        return measurePerformance('pagination', () => (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Pagination Advantages:</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Predictable data loading patterns</li>
                <li>• SEO-friendly URL structure</li>
                <li>• Clear navigation and progress indication</li>
                <li>• Reduced initial load time</li>
              </ul>
            </div>

            <PaginationDemo dataset={largeCoinDataset} />
          </div>
        ));

      case 'infinite-scroll':
        return measurePerformance('infinite-scroll', () => (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">Infinite Scroll Features:</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Seamless content discovery</li>
                <li>• Intersection Observer API for efficiency</li>
                <li>• Progressive enhancement</li>
                <li>• Mobile-optimized experience</li>
              </ul>
            </div>

            <InfiniteScrollDemo dataset={largeCoinDataset} />
          </div>
        ));

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Progressive Loading Demonstration
          </h1>
          <p className="text-gray-600">
            Explore different strategies for handling large datasets efficiently
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Render Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {performanceMetrics[activeDemo]?.renderTime?.toFixed(2) || '0.00'}ms
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Dataset Size</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {largeCoinDataset.length.toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {((performance.memory?.usedJSHeapSize || 0) / 1048576).toFixed(1)}MB
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Performance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {performanceMetrics[activeDemo]?.renderTime < 50 ? 'Excellent' : 
               performanceMetrics[activeDemo]?.renderTime < 100 ? 'Good' : 'Fair'}
            </div>
          </div>
        </div>

        {/* Demo Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {demos.map((demo) => {
            const Icon = demo.icon;
            const isActive = activeDemo === demo.id;
            
            return (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(demo.id)}
                className={`
                  p-6 rounded-lg border-2 transition-all duration-200 text-left
                  ${isActive 
                    ? 'border-primary-500 bg-primary-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${demo.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{demo.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{demo.description}</p>
                
                {performanceMetrics[demo.id] && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last render: {performanceMetrics[demo.id].renderTime.toFixed(2)}ms
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {renderDemoContent()}
        </div>
      </div>
    </div>
  );
};

// Virtual Scroll Demo Component
const VirtualScrollDemo = ({ dataset }) => {
  const columns = [
    { key: 'rank', title: '#', width: '16' },
    { key: 'name', title: 'Name' },
    { key: 'price', title: 'Price', align: 'right' },
    { key: 'change24h', title: '24h %', align: 'right' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Virtual Scrolling Table</h3>
        <div className="text-sm text-gray-500">
          Showing {dataset.length.toLocaleString()} items
        </div>
      </div>
      
      <VirtualScrollTable
        data={dataset}
        columns={columns}
        height={400}
        itemHeight={60}
        className="border-2 border-green-200"
      />
    </div>
  );
};

// Pagination Demo Component
const PaginationDemo = ({ dataset }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const { displayData, totalPages, totalItems } = useProgressiveLoading({
    data: dataset,
    mode: 'pagination',
    pageSize: itemsPerPage
  });

  const columns = [
    { key: 'rank', title: '#', width: '16' },
    { key: 'name', title: 'Name' },
    { key: 'price', title: 'Price', align: 'right' },
    { key: 'change24h', title: '24h %', align: 'right' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Paginated Table</h3>
        <div className="text-sm text-gray-500">
          {totalItems.toLocaleString()} total items
        </div>
      </div>
      
      <VirtualScrollTable
        data={displayData}
        columns={columns}
        height={300}
        itemHeight={60}
        className="border-2 border-purple-200"
      />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};

// Infinite Scroll Demo Component
const InfiniteScrollDemo = ({ dataset }) => {
  const [loadedData, setLoadedData] = useState(dataset.slice(0, 50));
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const currentLength = loadedData.length;
    const nextBatch = dataset.slice(currentLength, currentLength + 50);
    
    setLoadedData(prev => [...prev, ...nextBatch]);
    setHasMore(currentLength + nextBatch.length < dataset.length);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Infinite Scroll</h3>
        <div className="text-sm text-gray-500">
          Loaded {loadedData.length.toLocaleString()} of {dataset.length.toLocaleString()}
        </div>
      </div>
      
      <IncrementalLoader
        data={loadedData}
        loadMore={loadMore}
        hasMore={hasMore}
        loading={loading}
        renderItem={(item, index) => (
          <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-600">#{item.rank}</span>
              <span className="font-semibold">{item.name}</span>
              <span className="text-sm text-gray-500">{item.symbol}</span>
            </div>
            <div className="text-right">
              <div className="font-semibold">${item.price.toFixed(2)}</div>
              <div className={`text-sm ${item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        )}
        containerClassName="max-h-96 border-2 border-orange-200 rounded-lg"
        mode="infinite"
      />
    </div>
  );
};

export default ProgressiveLoadingDemo;