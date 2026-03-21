import React, { useState } from 'react';
import Button from '../components/base/Button';
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';

/**
 * Mobile Test Page - Visual demonstration of mobile optimizations
 * Use this page to verify touch targets, responsive behavior, and mobile features
 */
const MobileTestPage = () => {
  const { isMobile, isTablet, isDesktop, windowWidth, deviceType } = useResponsiveBreakpoints();
  const [touchCount, setTouchCount] = useState(0);

  const handleTouch = () => {
    setTouchCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Device Info */}
        <div className="card">
          <h1 className="text-2xl font-bold mb-4">Mobile Optimization Test Page</h1>
          <div className="space-y-2">
            <p><strong>Device Type:</strong> {deviceType}</p>
            <p><strong>Window Width:</strong> {windowWidth}px</p>
            <p><strong>Is Mobile:</strong> {isMobile ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Tablet:</strong> {isTablet ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Desktop:</strong> {isDesktop ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Touch Target Testing */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Touch Target Testing</h2>
          <p className="text-gray-600 mb-4">
            All buttons below should be at least 44x44px for easy tapping.
            Try tapping them with your thumb.
          </p>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Small Button (min 44px):</p>
              <Button size="sm" onClick={handleTouch}>
                Tap Me (Small)
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Medium Button (min 44px):</p>
              <Button size="md" onClick={handleTouch}>
                Tap Me (Medium)
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Large Button (min 48px):</p>
              <Button size="lg" onClick={handleTouch}>
                Tap Me (Large)
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-semibold">
                Touch Count: {touchCount}
              </p>
              <p className="text-sm text-gray-600">
                Tap any button above to increment
              </p>
            </div>
          </div>
        </div>

        {/* Button Variants */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Button Variants</h2>
          <div className="space-y-3">
            <Button variant="primary" onClick={handleTouch}>
              Primary Button
            </Button>
            <Button variant="secondary" onClick={handleTouch}>
              Secondary Button
            </Button>
            <Button variant="success" onClick={handleTouch}>
              Success Button
            </Button>
            <Button variant="danger" onClick={handleTouch}>
              Danger Button
            </Button>
            <Button variant="ghost" onClick={handleTouch}>
              Ghost Button
            </Button>
          </div>
        </div>

        {/* Form Elements */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Form Elements (16px font to prevent iOS zoom)</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="test-input" className="block text-sm font-medium mb-2">
                Text Input (min 44px height):
              </label>
              <input
                id="test-input"
                type="text"
                className="input-field w-full"
                placeholder="Type something..."
              />
            </div>

            <div>
              <label htmlFor="test-select" className="block text-sm font-medium mb-2">
                Select (min 44px height):
              </label>
              <select id="test-select" className="input-field w-full">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            <div>
              <label htmlFor="test-textarea" className="block text-sm font-medium mb-2">
                Textarea:
              </label>
              <textarea
                id="test-textarea"
                className="input-field w-full"
                rows="4"
                placeholder="Type a longer message..."
              />
            </div>

            <Button type="submit" variant="primary" className="w-full">
              Submit Form
            </Button>
          </form>
        </div>

        {/* Responsive Grid */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Responsive Grid</h2>
          <p className="text-gray-600 mb-4">
            This grid should stack on mobile, show 2 columns on tablet, and 3 columns on desktop.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-100 rounded-lg">Card 1</div>
            <div className="p-4 bg-green-100 rounded-lg">Card 2</div>
            <div className="p-4 bg-yellow-100 rounded-lg">Card 3</div>
            <div className="p-4 bg-red-100 rounded-lg">Card 4</div>
            <div className="p-4 bg-purple-100 rounded-lg">Card 5</div>
            <div className="p-4 bg-pink-100 rounded-lg">Card 6</div>
          </div>
        </div>

        {/* Touch Gesture Area */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Touch Gesture Test</h2>
          <div
            className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold cursor-pointer select-none"
            onTouchStart={() => console.log('Touch started')}
            onTouchEnd={() => console.log('Touch ended')}
            onClick={handleTouch}
          >
            Tap or Touch This Area
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Check browser console for touch events
          </p>
        </div>

        {/* Horizontal Scroll Test */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Horizontal Scroll (Intentional)</h2>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <div className="flex space-x-4 pb-4" style={{ minWidth: '800px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold"
                >
                  {i}
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Swipe horizontally to scroll through cards
          </p>
        </div>

        {/* Typography Test */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Typography (Readable without zoom)</h2>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Heading 1 (28px on mobile)</h1>
            <h2 className="text-2xl font-bold">Heading 2 (24px on mobile)</h2>
            <h3 className="text-xl font-bold">Heading 3 (20px on mobile)</h3>
            <h4 className="text-lg font-bold">Heading 4 (18px on mobile)</h4>
            <p className="text-base">
              Body text (16px) - This text should be easily readable without zooming.
              The minimum font size is 16px to prevent iOS from zooming when focusing inputs.
            </p>
            <p className="text-sm text-gray-600">
              Small text (14px) - Still readable but used sparingly
            </p>
          </div>
        </div>

        {/* Accessibility Test */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Accessibility Features</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Focus Indicators:</p>
              <div className="space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
                  Focus Me
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2">
                  Then Me
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Tab through buttons to see focus indicators
              </p>
            </div>

            <div>
              <p className="font-medium mb-2">ARIA Labels:</p>
              <button
                aria-label="Close dialog"
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                ✕
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Screen readers will announce "Close dialog"
              </p>
            </div>
          </div>
        </div>

        {/* Performance Info */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Performance Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Animations are reduced to 0.2s on mobile</li>
            <li>Blur effects are simplified (4px instead of 8px+)</li>
            <li>Shadows are lighter and simpler</li>
            <li>Images should use lazy loading</li>
            <li>Smooth scrolling is enabled</li>
          </ul>
        </div>

        {/* Testing Instructions */}
        <div className="card bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Test on actual mobile devices (iPhone, Android)</li>
            <li>Use browser DevTools device emulation</li>
            <li>Verify all touch targets are easy to tap</li>
            <li>Check that no horizontal scrolling occurs (except intentional)</li>
            <li>Verify text is readable without zooming</li>
            <li>Test form inputs don't trigger iOS zoom</li>
            <li>Check navigation works smoothly</li>
            <li>Verify performance is smooth (60fps)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MobileTestPage;
