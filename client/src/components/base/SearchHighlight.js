import React from 'react';

/**
 * Component to highlight search terms within text
 */
const SearchHighlight = ({ 
  text = '', 
  searchTerm = '', 
  className = '',
  highlightClassName = 'bg-yellow-200 text-yellow-900 px-1 rounded'
}) => {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex for case-insensitive matching
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  
  // Split text by search term matches
  const parts = text.split(regex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search term (case-insensitive)
        const isMatch = regex.test(part);
        regex.lastIndex = 0; // Reset regex for next test
        
        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

/**
 * Hook for managing search result navigation
 */
export const useSearchNavigation = (results = [], onSelect) => {
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  
  const navigateNext = React.useCallback(() => {
    setCurrentIndex(prev => 
      prev < results.length - 1 ? prev + 1 : 0
    );
  }, [results.length]);
  
  const navigatePrevious = React.useCallback(() => {
    setCurrentIndex(prev => 
      prev > 0 ? prev - 1 : results.length - 1
    );
  }, [results.length]);
  
  const selectCurrent = React.useCallback(() => {
    if (currentIndex >= 0 && results[currentIndex]) {
      onSelect?.(results[currentIndex], currentIndex);
    }
  }, [currentIndex, results, onSelect]);
  
  const reset = React.useCallback(() => {
    setCurrentIndex(-1);
  }, []);
  
  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (results.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          navigateNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigatePrevious();
          break;
        case 'Enter':
          e.preventDefault();
          selectCurrent();
          break;
        case 'Escape':
          e.preventDefault();
          reset();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateNext, navigatePrevious, selectCurrent, reset, results.length]);
  
  return {
    currentIndex,
    setCurrentIndex,
    navigateNext,
    navigatePrevious,
    selectCurrent,
    reset
  };
};

/**
 * Search results container with navigation
 */
export const SearchResults = ({ 
  results = [], 
  searchTerm = '',
  onSelect,
  renderItem,
  className = '',
  emptyMessage = 'No results found'
}) => {
  const { currentIndex, setCurrentIndex } = useSearchNavigation(results, onSelect);
  
  if (results.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className="mb-4 text-sm text-gray-600">
        {results.length} result{results.length !== 1 ? 's' : ''} found
        {searchTerm && ` for "${searchTerm}"`}
      </div>
      
      <div className="space-y-2">
        {results.map((result, index) => (
          <div
            key={result.id || index}
            onClick={() => onSelect?.(result, index)}
            onMouseEnter={() => setCurrentIndex(index)}
            className={`cursor-pointer p-3 rounded-lg border transition-colors ${
              index === currentIndex
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {renderItem ? renderItem(result, searchTerm, index === currentIndex) : (
              <div>
                <SearchHighlight 
                  text={result.name || result.title || ''}
                  searchTerm={searchTerm}
                  className="font-medium text-gray-900"
                />
                {result.description && (
                  <SearchHighlight 
                    text={result.description}
                    searchTerm={searchTerm}
                    className="text-sm text-gray-600 mt-1"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {results.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
        </div>
      )}
    </div>
  );
};

export default SearchHighlight;