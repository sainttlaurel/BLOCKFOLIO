import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useProgressiveLoading - Hook for managing progressive data loading
 * Provides utilities for virtual scrolling, pagination, and incremental loading
 * Requirements: 11.4 - Progressive loading for large datasets
 */
export const useProgressiveLoading = ({
  data = [],
  pageSize = 50,
  mode = 'virtual', // 'virtual' | 'pagination' | 'infinite'
  searchTerm = '',
  sortConfig = null,
  filters = {}
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedData, setLoadedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const processedDataRef = useRef([]);

  // Process data (filter, search, sort)
  const processData = useCallback((rawData) => {
    let processed = [...rawData];

    // Apply search filter
    if (searchTerm) {
      processed = processed.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (key.startsWith('min')) {
          const field = key.replace('min', '').toLowerCase();
          processed = processed.filter(item => item[field] >= value);
        } else if (key.startsWith('max')) {
          const field = key.replace('max', '').toLowerCase();
          processed = processed.filter(item => item[field] <= value);
        } else {
          processed = processed.filter(item => item[key] === value);
        }
      }
    });

    // Apply sorting
    if (sortConfig && sortConfig.key) {
      processed.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return processed;
  }, [searchTerm, sortConfig, filters]);

  // Update processed data when dependencies change
  useEffect(() => {
    const processed = processData(data);
    processedDataRef.current = processed;

    if (mode === 'pagination') {
      // Reset to first page when data changes
      setCurrentPage(1);
    } else if (mode === 'infinite') {
      // Reset loaded data for infinite scroll
      setLoadedData(processed.slice(0, pageSize));
      setHasMore(processed.length > pageSize);
    }
  }, [data, processData, mode, pageSize]);

  // Get paginated data
  const getPaginatedData = useCallback(() => {
    const processed = processedDataRef.current;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processed.slice(startIndex, endIndex);
  }, [currentPage, pageSize]);

  // Load more data for infinite scroll
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const processed = processedDataRef.current;
    const currentLength = loadedData.length;
    const nextBatch = processed.slice(currentLength, currentLength + pageSize);
    
    setLoadedData(prev => [...prev, ...nextBatch]);
    setHasMore(currentLength + nextBatch.length < processed.length);
    setLoading(false);
  }, [loading, hasMore, loadedData.length, pageSize]);

  // Get data based on mode
  const getDisplayData = useCallback(() => {
    const processed = processedDataRef.current;
    
    switch (mode) {
      case 'pagination':
        return getPaginatedData();
      case 'infinite':
        return loadedData;
      case 'virtual':
      default:
        return processed;
    }
  }, [mode, getPaginatedData, loadedData]);

  // Pagination helpers
  const totalPages = Math.ceil(processedDataRef.current.length / pageSize);
  const totalItems = processedDataRef.current.length;

  // Navigation functions
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  // Reset functions
  const reset = useCallback(() => {
    setCurrentPage(1);
    setLoadedData([]);
    setHasMore(true);
    setLoading(false);
  }, []);

  return {
    // Data
    displayData: getDisplayData(),
    totalItems,
    totalPages,
    currentPage,
    loading,
    hasMore,
    
    // Pagination
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    
    // Infinite scroll
    loadMore,
    
    // Utilities
    reset,
    
    // Computed values
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, totalItems),
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * useVirtualScrolling - Hook for virtual scrolling implementation
 */
export const useVirtualScrolling = ({
  data = [],
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef();

  // Calculate visible range
  const visibleRange = {
    start: Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    end: Math.min(
      data.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
  };

  // Handle scroll events
  const handleScroll = useCallback((event) => {
    const newScrollTop = event.target.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set new timeout to detect scroll end
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Get visible items
  const visibleItems = data.slice(visibleRange.start, visibleRange.end + 1);

  // Calculate total height
  const totalHeight = data.length * itemHeight;

  // Calculate scroll percentage
  const scrollPercentage = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    scrollTop,
    isScrolling,
    scrollPercentage,
    handleScroll
  };
};

/**
 * useIntersectionObserver - Hook for intersection observer (infinite scroll)
 */
export const useIntersectionObserver = ({
  onIntersect,
  threshold = 0.1,
  rootMargin = '0px'
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);
        
        if (intersecting) {
          onIntersect?.();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [onIntersect, threshold, rootMargin]);

  return { targetRef, isIntersecting };
};

/**
 * useDataPrefetch - Hook for prefetching data
 */
export const useDataPrefetch = ({
  fetchFunction,
  prefetchTrigger = 0.8, // Prefetch when 80% scrolled
  cacheSize = 3 // Cache 3 pages
}) => {
  const [cache, setCache] = useState(new Map());
  const [prefetching, setPrefetching] = useState(false);

  const prefetchData = useCallback(async (key, ...args) => {
    if (cache.has(key) || prefetching) return;

    setPrefetching(true);
    try {
      const data = await fetchFunction(...args);
      setCache(prev => {
        const newCache = new Map(prev);
        
        // Implement LRU cache
        if (newCache.size >= cacheSize) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        
        newCache.set(key, data);
        return newCache;
      });
    } catch (error) {
      console.error('Prefetch failed:', error);
    } finally {
      setPrefetching(false);
    }
  }, [fetchFunction, cache, prefetching, cacheSize]);

  const getCachedData = useCallback((key) => {
    return cache.get(key);
  }, [cache]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    prefetchData,
    getCachedData,
    clearCache,
    prefetching,
    cacheSize: cache.size
  };
};

export default useProgressiveLoading;