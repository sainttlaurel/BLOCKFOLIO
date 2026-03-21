import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  const navigate = useNavigate();
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when user is typing in inputs
    const activeElement = document.activeElement;
    const isInputActive = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
    
    if (isInputActive) return;

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    
    // Create shortcut key combination
    let shortcutKey = '';
    if (ctrl) shortcutKey += 'ctrl+';
    if (shift) shortcutKey += 'shift+';
    if (alt) shortcutKey += 'alt+';
    shortcutKey += key;
    
    const shortcut = shortcutsRef.current[shortcutKey];
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return { navigate };
};

/**
 * Default trading platform shortcuts
 */
export const useDefaultShortcuts = () => {
  const navigate = useNavigate();
  
  const shortcuts = {
    // Navigation shortcuts
    'ctrl+1': {
      description: 'Go to Dashboard',
      action: () => navigate('/dashboard')
    },
    'ctrl+2': {
      description: 'Go to Portfolio',
      action: () => navigate('/portfolio')
    },
    'ctrl+3': {
      description: 'Go to Trading',
      action: () => navigate('/trading')
    },
    'ctrl+4': {
      description: 'Go to Transaction History',
      action: () => navigate('/transactions')
    },
    
    // Trading shortcuts
    'b': {
      description: 'Quick Buy',
      action: () => {
        // Trigger buy action if on trading page
        const event = new CustomEvent('quickTrade', { detail: { type: 'buy' } });
        document.dispatchEvent(event);
      }
    },
    's': {
      description: 'Quick Sell',
      action: () => {
        // Trigger sell action if on trading page
        const event = new CustomEvent('quickTrade', { detail: { type: 'sell' } });
        document.dispatchEvent(event);
      }
    },
    
    // Interface shortcuts
    'ctrl+k': {
      description: 'Open Search',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
        }
      }
    },
    'escape': {
      description: 'Close Modals',
      action: () => {
        const event = new CustomEvent('closeModals');
        document.dispatchEvent(event);
      }
    },
    
    // Refresh shortcuts
    'ctrl+r': {
      description: 'Refresh Data',
      action: () => {
        const event = new CustomEvent('refreshData');
        document.dispatchEvent(event);
      }
    }
  };

  useKeyboardShortcuts(shortcuts);
  
  return shortcuts;
};

/**
 * Hook for trading-specific shortcuts
 */
export const useTradingShortcuts = (onBuy, onSell, onRefresh) => {
  const shortcuts = {
    'b': {
      description: 'Quick Buy',
      action: onBuy
    },
    's': {
      description: 'Quick Sell', 
      action: onSell
    },
    'r': {
      description: 'Refresh Prices',
      action: onRefresh
    },
    'ctrl+enter': {
      description: 'Execute Trade',
      action: () => {
        const executeButton = document.querySelector('[data-execute-trade]');
        if (executeButton && !executeButton.disabled) {
          executeButton.click();
        }
      }
    }
  };

  useKeyboardShortcuts(shortcuts);
  
  return shortcuts;
};