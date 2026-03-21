import React, { useState } from 'react';
import { Keyboard, X, Command } from 'lucide-react';

const KeyboardShortcutsHelp = ({ shortcuts = {}, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcutCategories = {
    navigation: {
      title: 'Navigation',
      shortcuts: {
        'ctrl+1': 'Go to Dashboard',
        'ctrl+2': 'Go to Portfolio', 
        'ctrl+3': 'Go to Trading',
        'ctrl+4': 'Go to Transaction History'
      }
    },
    trading: {
      title: 'Trading',
      shortcuts: {
        'b': 'Quick Buy',
        's': 'Quick Sell',
        'r': 'Refresh Prices',
        'ctrl+enter': 'Execute Trade'
      }
    },
    interface: {
      title: 'Interface',
      shortcuts: {
        'ctrl+k': 'Open Search',
        'escape': 'Close Modals',
        'ctrl+r': 'Refresh Data',
        '?': 'Show Keyboard Shortcuts'
      }
    }
  };

  const formatShortcut = (shortcut) => {
    return shortcut
      .split('+')
      .map(key => {
        const keyMap = {
          'ctrl': '⌘',
          'shift': '⇧',
          'alt': '⌥',
          'enter': '↵',
          'escape': 'Esc'
        };
        return keyMap[key.toLowerCase()] || key.toUpperCase();
      })
      .join(' + ');
  };

  // Add shortcut to show help
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement;
        const isInputActive = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true'
        );
        
        if (!isInputActive) {
          event.preventDefault();
          setIsOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        title="Keyboard Shortcuts (Press ? for help)"
      >
        <Keyboard className="h-4 w-4" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Keyboard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {Object.entries(shortcutCategories).map(([categoryKey, category]) => (
                  <div key={categoryKey}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                      {category.title}
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(category.shortcuts).map(([shortcut, description]) => (
                        <div key={shortcut} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-700">{description}</span>
                          <div className="flex items-center space-x-1">
                            {formatShortcut(shortcut).split(' + ').map((key, index, array) => (
                              <React.Fragment key={index}>
                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                                  {key}
                                </kbd>
                                {index < array.length - 1 && (
                                  <span className="text-gray-400 text-xs">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Platform Info */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Command className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Platform Notes</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Shortcuts work when not typing in input fields</li>
                  <li>• Use Ctrl on Windows/Linux, ⌘ on Mac</li>
                  <li>• Press ? anytime to show this help</li>
                  <li>• Press Escape to close modals and dialogs</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 rounded">?</kbd> anytime to show shortcuts
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsHelp;