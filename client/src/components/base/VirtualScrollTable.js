import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SkeletonScreen from './SkeletonScreen';

/**
 * VirtualScrollTable - High-performance table with custom virtual scrolling
 * Efficiently renders large datasets by only rendering visible rows
 * Requirements: 11.4 - Progressive loading for large datasets
 */
const VirtualScrollTable = ({
  data = [],
  columns = [],
  height = 400,
  itemHeight = 60,
  loading = false,
  loadingRows = 10,
  onRowClick,
  selectedRowId,
  className = '',
  headerHeight = 48,
  overscan = 5,
  onScroll,
  sortConfig,
  onSort,
  searchTerm = '',
  highlightSearchTerm = false
}) => {
  const containerRef = useRef();
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, data.length, overscan]);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const { scrollTop: newScrollTop } = e.target;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // Debounce scroll end detection
    clearTimeout(handleScroll.timeoutId);
    handleScroll.timeoutId = setTimeout(() => setIsScrolling(false), 150);
    
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Default row renderer
  const renderRow = useCallback((item, index) => {
    if (!item) return null;

    const isSelected = selectedRowId && item.id === selectedRowId;
    const isEven = index % 2 === 0;

    return (
      <div
        key={item.id || index}
        className={`
          flex items-center border-b border-gray-100 cursor-pointer transition-colors
          ${isSelected ? 'bg-primary-50 border-primary-200' : ''}
          ${isEven ? 'bg-white' : 'bg-gray-50'}
          hover:bg-gray-100
          ${isScrolling ? 'pointer-events-none' : ''}
        `}
        style={{ 
          height: itemHeight,
          transform: `translateY(${index * itemHeight}px)`,
          position: 'absolute',
          width: '100%',
          left: 0
        }}
        onClick={() => onRowClick?.(item)}
      >
        {columns.map((column) => {
          const value = item[column.key];
          const cellContent = column.render ? column.render(value, item, index, data) : value;
          
          return (
            <div
              key={column.key}
              className={`
                px-4 py-3 flex-shrink-0
                ${column.width ? `w-${column.width}` : 'flex-1'}
                ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                ${column.className || ''}
              `}
            >
              {highlightSearchTerm && searchTerm ? (
                <HighlightText text={cellContent?.toString() || ''} searchTerm={searchTerm} />
              ) : (
                cellContent
              )}
            </div>
          );
        })}
      </div>
    );
  }, [columns, selectedRowId, onRowClick, isScrolling, searchTerm, highlightSearchTerm, itemHeight, data]);

  // Render table header
  const renderHeader = () => (
    <div 
      className="flex items-center bg-gray-50 border-b-2 border-gray-200 font-medium text-gray-700 sticky top-0 z-10"
      style={{ height: headerHeight }}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className={`
            px-4 py-3 flex-shrink-0 flex items-center
            ${column.width ? `w-${column.width}` : 'flex-1'}
            ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start'}
            ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
          `}
          onClick={() => column.sortable && onSort?.(column.key)}
        >
          <span className="text-sm font-semibold uppercase tracking-wider">
            {column.title}
          </span>
          {column.sortable && sortConfig?.key === column.key && (
            <span className="ml-2">
              {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        {renderHeader()}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: loadingRows }).map((_, index) => (
            <SkeletonScreen key={index} variant="table-row" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        {renderHeader()}
        <div className="flex items-center justify-center py-12 text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">No data available</div>
            <div className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'No items to display'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { startIndex, endIndex } = visibleRange;
  const visibleItems = data.slice(startIndex, endIndex + 1);
  const totalHeight = data.length * itemHeight;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {renderHeader()}
      
      <div 
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: height - headerHeight }}
        onScroll={handleScroll}
      >
        {/* Virtual container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((item, index) => 
            renderRow(item, startIndex + index)
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      {data.length > 20 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {Math.ceil((scrollTop / totalHeight) * 100)}%
        </div>
      )}
    </div>
  );
};

// Text highlighting component
const HighlightText = ({ text, searchTerm }) => {
  if (!searchTerm) return text;

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
  return (
    <span>
      {parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

export default VirtualScrollTable;