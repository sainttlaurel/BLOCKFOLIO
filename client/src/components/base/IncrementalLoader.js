import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import SkeletonScreen from './SkeletonScreen';

/**
 * IncrementalLoader - Progressive data loading with intersection observer
 * Implements infinite scroll and batch loading patterns for large datasets
 * Requirements: 11.4 - Progressive loading for large datasets
 */
const IncrementalLoader = ({
  data = [],
  loadMore,
  hasMore = true,
  loading = false,
  error = null,
  threshold = 0.8,
  batchSize = 20,
  renderItem,
  renderSkeleton,
  loadingComponent,
  errorComponent,
  endComponent,
  className = '',
  containerClassName = '',
  itemClassName = '',
  mode = 'infinite', // 'infinite' | 'button' | 'auto'
  loadOnMount = true,
  retryOnError = true,
  estimatedItemHeight = 100,
  maintainScrollPosition = true,
  onScroll,
  onLoadStart,
  onLoadComplete,
  onError
}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef();
  const sentinelRef = useRef();
  const loadingRef = useRef(false);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (mode !== 'infinite' || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin: '100px'
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [threshold, mode]);

  // Auto-load when sentinel is visible
  useEffect(() => {
    if (
      mode === 'infinite' &&
      isIntersecting &&
      hasMore &&
      !loading &&
      !loadingRef.current &&
      data.length > 0
    ) {
      handleLoadMore();
    }
  }, [isIntersecting, hasMore, loading, data.length, mode]);

  // Load initial data
  useEffect(() => {
    if (loadOnMount && data.length === 0 && hasMore && !loading) {
      handleLoadMore();
    }
  }, [loadOnMount]);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target;
    setScrollPosition(scrollTop);
    onScroll?.(e);
  }, [onScroll]);

  // Load more data
  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setRetryCount(0);
    onLoadStart?.();

    try {
      await loadMore?.();
      onLoadComplete?.();
    } catch (err) {
      console.error('Failed to load more data:', err);
      onError?.(err);
    } finally {
      loadingRef.current = false;
    }
  }, [loading, hasMore, loadMore, onLoadStart, onLoadComplete, onError]);

  // Retry loading on error
  const handleRetry = useCallback(async () => {
    if (retryCount >= 3) return;

    setRetryCount(prev => prev + 1);
    await handleLoadMore();
  }, [retryCount, handleLoadMore]);

  // Maintain scroll position after data updates
  useEffect(() => {
    if (maintainScrollPosition && containerRef.current && scrollPosition > 0) {
      containerRef.current.scrollTop = scrollPosition;
    }
  }, [data.length, maintainScrollPosition, scrollPosition]);

  // Default item renderer
  const defaultRenderItem = useCallback((item, index) => (
    <div key={item.id || index} className={`p-4 border-b border-gray-100 ${itemClassName}`}>
      <div className="text-sm font-medium text-gray-900">
        {item.name || item.title || `Item ${index + 1}`}
      </div>
      {item.description && (
        <div className="text-sm text-gray-500 mt-1">
          {item.description}
        </div>
      )}
    </div>
  ), [itemClassName]);

  // Default skeleton renderer
  const defaultRenderSkeleton = useCallback((index) => (
    <div key={`skeleton-${index}`} className={itemClassName}>
      <SkeletonScreen variant="card" />
    </div>
  ), [itemClassName]);

  // Loading component
  const LoadingComponent = loadingComponent || (() => (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading more items...</span>
      </div>
    </div>
  ));

  // Error component
  const ErrorComponent = errorComponent || (({ error, onRetry }) => (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
        <div className="text-sm font-medium text-gray-900 mb-2">
          Failed to load data
        </div>
        <div className="text-sm text-gray-500 mb-4">
          {error?.message || 'An error occurred while loading'}
        </div>
        {retryOnError && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Try Again {retryCount > 0 && `(${retryCount}/3)`}
          </button>
        )}
      </div>
    </div>
  ));

  // End component
  const EndComponent = endComponent || (() => (
    <div className="flex items-center justify-center py-8 text-gray-500">
      <div className="text-center">
        <div className="text-sm font-medium mb-1">
          You've reached the end
        </div>
        <div className="text-xs">
          {data.length} items loaded
        </div>
      </div>
    </div>
  ));

  // Load more button
  const LoadMoreButton = () => (
    <div className="flex items-center justify-center py-6">
      <button
        onClick={handleLoadMore}
        disabled={loading || !hasMore}
        className="
          flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg
          text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        "
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            <span>Load More ({batchSize} items)</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className={`incremental-loader ${className}`}>
      {/* Data container */}
      <div
        ref={containerRef}
        className={`overflow-auto ${containerClassName}`}
        onScroll={handleScroll}
      >
        {/* Render items */}
        {data.map((item, index) => 
          renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: batchSize }).map((_, index) =>
              renderSkeleton ? renderSkeleton(index) : defaultRenderSkeleton(index)
            )}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <ErrorComponent error={error} onRetry={handleRetry} />
        )}

        {/* Load more button */}
        {mode === 'button' && hasMore && !loading && !error && (
          <LoadMoreButton />
        )}

        {/* End state */}
        {!hasMore && !loading && data.length > 0 && (
          <EndComponent />
        )}

        {/* Infinite scroll sentinel */}
        {mode === 'infinite' && hasMore && !error && (
          <div ref={sentinelRef} className="h-4" />
        )}
      </div>

      {/* Loading indicator for infinite scroll */}
      {mode === 'infinite' && loading && hasMore && (
        <LoadingComponent />
      )}
    </div>
  );
};

// Hook for managing incremental loading state
export const useIncrementalLoader = ({
  fetchData,
  batchSize = 20,
  initialData = [],
  cacheKey = null
}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Load more data
  const loadMore = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchData(page, batchSize);
      
      if (newData.length < batchSize) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, page, batchSize, loading]);

  // Reset loader
  const reset = useCallback(() => {
    setData(initialData);
    setPage(0);
    setHasMore(true);
    setError(null);
    setLoading(false);
  }, [initialData]);

  // Refresh data
  const refresh = useCallback(async () => {
    reset();
    await loadMore();
  }, [reset, loadMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    refresh,
    page
  };
};

export default IncrementalLoader;