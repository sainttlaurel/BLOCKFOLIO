import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HighContrastProvider, useHighContrast } from '../HighContrastContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Test component that uses the context
const TestComponent = () => {
  const { isHighContrast, toggleHighContrast } = useHighContrast();
  return (
    <div>
      <div data-testid="status">{isHighContrast ? 'enabled' : 'disabled'}</div>
      <button onClick={toggleHighContrast} data-testid="toggle">
        Toggle
      </button>
    </div>
  );
};

describe('HighContrastContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('high-contrast');
  });

  test('should initialize with false when no localStorage value', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('disabled');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
  });

  test('should initialize with true when localStorage has "true"', () => {
    localStorageMock.getItem.mockReturnValue('true');

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('enabled');
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  test('should toggle high contrast mode', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    
    // Initially disabled
    expect(screen.getByTestId('status')).toHaveTextContent('disabled');

    // Toggle to enabled
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('enabled');
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('highContrastMode', 'true');
    });

    // Toggle back to disabled
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('disabled');
      expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('highContrastMode', 'false');
    });
  });

  test('should save preference to localStorage on toggle', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    const toggleButton = screen.getByTestId('toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('highContrastMode', 'true');
    });
  });

  test('should apply high-contrast class to document root when enabled', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    expect(document.documentElement.classList.contains('high-contrast')).toBe(false);

    const toggleButton = screen.getByTestId('toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
    });
  });

  test('should remove high-contrast class from document root when disabled', async () => {
    localStorageMock.getItem.mockReturnValue('true');

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);

    const toggleButton = screen.getByTestId('toggle');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(document.documentElement.classList.contains('high-contrast')).toBe(false);
    });
  });

  test('should throw error when useHighContrast is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useHighContrast must be used within a HighContrastProvider');

    consoleSpy.mockRestore();
  });

  test('should persist state across multiple toggles', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <HighContrastProvider>
        <TestComponent />
      </HighContrastProvider>
    );

    const toggleButton = screen.getByTestId('toggle');

    // Toggle multiple times
    fireEvent.click(toggleButton);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('enabled'));

    fireEvent.click(toggleButton);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('disabled'));

    fireEvent.click(toggleButton);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('enabled'));

    // Verify localStorage was called correctly
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(4); // Initial + 3 toggles
  });
});
