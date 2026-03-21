# Chart Component Tests

## Overview

This directory contains comprehensive unit tests for the chart components of the Professional Trading Platform.

## Test File: chartComponents.test.js

### Coverage

The test suite covers all requirements from the spec:

#### Requirement 5.1: Multiple Timeframe Support
- Tests for all required timeframe buttons (1H, 4H, 1D, 1W, 1M)
- Verification of active timeframe highlighting
- Timeframe change callback functionality
- Chart data updates when timeframe changes

#### Requirement 5.2: Candlestick Chart Functionality
- OHLCV data rendering
- Correct number of candles displayed
- Empty data handling
- OHLC data processing accuracy

#### Requirement 5.3: Interactive Tooltips
- Tooltip enablement in chart options
- Proper tooltip styling configuration
- OHLC information display in tooltips
- Hover interaction testing

#### Requirement 5.4: Zoom and Pan Functionality
- Zoom in/out button rendering and functionality
- Reset zoom button conditional display
- Pan toggle functionality
- Active/inactive state management

#### Requirement 5.5: Volume Bar Displays
- Volume bars display when enabled
- Volume bars hidden when disabled
- Volume data integration with price charts

#### Requirement 5.6: Real-time Data Updates
- Chart updates when data changes
- Smooth animation configuration
- Responsive chart behavior

### Test Structure

The test suite is organized into the following sections:

1. **InteractivePriceChart Component Tests**
   - Timeframe support
   - Chart rendering and data display
   - Technical indicators
   - Accessibility features

2. **CandlestickChart Component Tests**
   - Candlestick functionality
   - Volume bar display
   - Chart tooltips
   - Chart dimensions and styling
   - Accessibility features
   - Data processing and performance

3. **ChartControls Component Tests**
   - Zoom functionality
   - Pan functionality
   - Volume toggle
   - Fullscreen functionality
   - Control button states
   - Tooltip display
   - Custom styling

4. **Chart Integration Tests**
   - Real-time data updates
   - Chart animation configuration
   - Multiple timeframe data handling
   - Edge cases and error handling

### Mock Data Generators

The test file includes two mock data generators:

1. **generateMockOHLCVData(count)**: Generates realistic OHLCV (Open, High, Low, Close, Volume) data for candlestick charts
2. **generateMockPriceData(count)**: Generates simple price data for line charts

### Running the Tests

To run the chart component tests:

```bash
# Run all tests
npm test

# Run only chart component tests
npm test -- chartComponents

# Run tests in CI mode (non-interactive)
CI=true npm test -- chartComponents

# Run tests with coverage
npm test -- --coverage chartComponents
```

### Dependencies Required

The tests require the following dependencies:

```json
{
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.5",
  "@testing-library/user-event": "^14.4.3"
}
```

These should be installed as devDependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Test Mocks

The test file mocks the following:

1. **react-chartjs-2**: Mocked to avoid canvas rendering issues in test environment
2. **useGracefulDegradation hook**: Mocked to provide consistent test behavior

### Accessibility Testing

The tests include comprehensive accessibility checks:

- ARIA labels and roles
- Screen reader support
- Keyboard navigation
- Accessible chart descriptions
- Proper semantic HTML

### Edge Cases Covered

- Undefined/null data handling
- Empty data arrays
- Single data point
- Very large datasets (10,000+ points)
- Missing data properties
- Invalid data formats

### Test Statistics

- **Total Test Suites**: 4 (InteractivePriceChart, CandlestickChart, ChartControls, Integration)
- **Total Tests**: 80+ individual test cases
- **Requirements Validated**: 6 (Requirements 5.1-5.6)
- **Components Tested**: 3 (InteractivePriceChart, CandlestickChart, ChartControls)

### Notes

- All tests follow the existing testing patterns from portfolioCalculations.test.js
- Tests use React Testing Library best practices
- Mock data is realistic and representative of actual trading data
- Tests are isolated and can run independently
- No external API calls or network dependencies
