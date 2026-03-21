import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HighContrastToggle from '../HighContrastToggle';
import { HighContrastProvider } from '../../contexts/HighContrastContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

describe('HighContrastToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('high-contrast');
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('should render toggle button', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('should display "High Contrast: Off" when disabled', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    expect(screen.getByText('High Contrast: Off')).toBeInTheDocument();
  });

  test('should display "High Contrast: On" when enabled', () => {
    localStorageMock.getItem.mockReturnValue('true');

    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    expect(screen.getByText('High Contrast: On')).toBeInTheDocument();
  });

  test('should have correct aria-label when disabled', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Enable high contrast mode');
  });

  test('should have correct aria-label when enabled', () => {
    localStorageMock.getItem.mockReturnValue('true');

    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Disable high contrast mode');
  });

  test('should have aria-pressed attribute', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed');
  });

  test('should toggle aria-pressed on click', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    
    // Initially false
    expect(button).toHaveAttribute('aria-pressed', 'false');

    // Click to enable
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');

    // Click to disable
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  test('should call toggleHighContrast on click', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    
    // Click the button
    fireEvent.click(button);

    // Verify the text changed
    expect(screen.getByText('High Contrast: On')).toBeInTheDocument();
  });

  test('should have correct title attribute', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Enable high contrast mode');
  });

  test('should be keyboard accessible', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    const button = screen.getByRole('button');
    
    // Focus the button
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    
    // Should toggle
    expect(screen.getByText('High Contrast: On')).toBeInTheDocument();
  });

  test('should render Eye icon', () => {
    render(
      <HighContrastProvider>
        <HighContrastToggle />
      </HighContrastProvider>
    );

    // Check for the icon by looking for svg with aria-hidden
    const icon = screen.getByRole('button').querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});
