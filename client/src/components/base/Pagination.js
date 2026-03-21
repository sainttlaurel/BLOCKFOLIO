import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Pagination - Professional pagination component with smooth transitions
 * Supports various pagination patterns for large datasets
 * Requirements: 11.4 - Progressive loading for large datasets
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 7,
  className = '',
  size = 'md',
  variant = 'default',
  loading = false,
  disabled = false
}) => {
  // Size configurations
  const sizeClasses = {
    sm: {
      button: 'h-8 w-8 text-sm',
      select: 'h-8 text-sm px-2',
      spacing: 'space-x-1'
    },
    md: {
      button: 'h-10 w-10 text-sm',
      select: 'h-10 text-sm px-3',
      spacing: 'space-x-2'
    },
    lg: {
      button: 'h-12 w-12 text-base',
      select: 'h-12 text-base px-4',
      spacing: 'space-x-3'
    }
  };

  const config = sizeClasses[size];

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading && !disabled) {
      onPageChange?.(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange && !loading && !disabled) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  // Button component
  const PaginationButton = ({ 
    children, 
    onClick, 
    isActive = false, 
    isDisabled = false, 
    ariaLabel,
    className: buttonClassName = ''
  }) => {
    const baseClasses = `
      ${config.button} flex items-center justify-center rounded-md font-medium transition-all duration-200
      ${isActive 
        ? 'bg-primary-600 text-white shadow-sm' 
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
      }
      ${isDisabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
      }
      ${loading ? 'animate-pulse' : ''}
      ${buttonClassName}
    `;

    return (
      <button
        className={baseClasses}
        onClick={onClick}
        disabled={isDisabled || loading}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  };

  // Calculate display info
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1 && !showPageInfo) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Items per page selector */}
      {showItemsPerPage && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            disabled={loading || disabled}
            className={`
              ${config.select} border border-gray-300 rounded-md bg-white text-gray-700
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">per page</span>
        </div>
      )}

      {/* Page info */}
      {showPageInfo && (
        <div className="text-sm text-gray-700">
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
          {totalItems.toLocaleString()} results
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className={`flex items-center ${config.spacing}`}>
          {/* First page button */}
          {showFirstLast && currentPage > 1 && (
            <PaginationButton
              onClick={() => handlePageChange(1)}
              isDisabled={currentPage === 1}
              ariaLabel="Go to first page"
              className="px-3"
            >
              First
            </PaginationButton>
          )}

          {/* Previous page button */}
          <PaginationButton
            onClick={() => handlePageChange(currentPage - 1)}
            isDisabled={currentPage === 1}
            ariaLabel="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </PaginationButton>

          {/* Page number buttons */}
          {visiblePages.map((page, index) => {
            if (typeof page === 'string') {
              return (
                <div
                  key={page}
                  className={`${config.button} flex items-center justify-center text-gray-400`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            return (
              <PaginationButton
                key={page}
                onClick={() => handlePageChange(page)}
                isActive={page === currentPage}
                ariaLabel={`Go to page ${page}`}
              >
                {page}
              </PaginationButton>
            );
          })}

          {/* Next page button */}
          <PaginationButton
            onClick={() => handlePageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages}
            ariaLabel="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
          </PaginationButton>

          {/* Last page button */}
          {showFirstLast && currentPage < totalPages && (
            <PaginationButton
              onClick={() => handlePageChange(totalPages)}
              isDisabled={currentPage === totalPages}
              ariaLabel="Go to last page"
              className="px-3"
            >
              Last
            </PaginationButton>
          )}
        </div>
      )}
    </div>
  );
};

// Compact pagination for mobile/small spaces
export const CompactPagination = ({ currentPage, totalPages, onPageChange, loading, disabled }) => (
  <div className="flex items-center justify-center space-x-2">
    <button
      onClick={() => onPageChange?.(currentPage - 1)}
      disabled={currentPage === 1 || loading || disabled}
      className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Previous page"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
    
    <span className="px-3 py-2 text-sm font-medium text-gray-700">
      {currentPage} of {totalPages}
    </span>
    
    <button
      onClick={() => onPageChange?.(currentPage + 1)}
      disabled={currentPage === totalPages || loading || disabled}
      className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Next page"
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  </div>
);

// Simple page dots for carousels/sliders
export const PageDots = ({ currentPage, totalPages, onPageChange, className = '' }) => (
  <div className={`flex items-center justify-center space-x-2 ${className}`}>
    {Array.from({ length: totalPages }).map((_, index) => {
      const page = index + 1;
      return (
        <button
          key={page}
          onClick={() => onPageChange?.(page)}
          className={`
            w-2 h-2 rounded-full transition-all duration-200
            ${page === currentPage 
              ? 'bg-primary-600 w-6' 
              : 'bg-gray-300 hover:bg-gray-400'
            }
          `}
          aria-label={`Go to page ${page}`}
        />
      );
    })}
  </div>
);

export default Pagination;