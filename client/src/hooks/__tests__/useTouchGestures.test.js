import { renderHook, act } from '@testing-library/react';
import { useTouchGestures } from '../useTouchGestures';

describe('useTouchGestures', () => {
  let mockElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    
    // Mock navigator.vibrate
    global.navigator.vibrate = jest.fn();
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
    jest.clearAllMocks();
  });

  describe('Touch Gesture Detection', () => {
    it('should detect swipe right gesture', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeRight })
      );

      const { touchHandlers } = result.current;

      // Simulate touch start
      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Simulate touch end (swipe right)
      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });
      });

      expect(onSwipeRight).toHaveBeenCalled();
    });

    it('should detect swipe left gesture', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeLeft })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 200, clientY: 100 }]
        });
      });

      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });

      expect(onSwipeLeft).toHaveBeenCalled();
    });

    it('should detect swipe up gesture', () => {
      const onSwipeUp = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeUp })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 200 }]
        });
      });

      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });

      expect(onSwipeUp).toHaveBeenCalled();
    });

    it('should detect swipe down gesture', () => {
      const onSwipeDown = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeDown })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 100, clientY: 200 }]
        });
      });

      expect(onSwipeDown).toHaveBeenCalled();
    });

    it('should detect tap gesture', () => {
      const onTap = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onTap })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Small movement (within tap threshold)
      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 102, clientY: 102 }]
        });
      });

      expect(onTap).toHaveBeenCalled();
    });

    it('should not trigger swipe for small movements', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeRight, swipeThreshold: 50 })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Movement below threshold
      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 130, clientY: 100 }]
        });
      });

      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('Long Press Detection', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should detect long press gesture', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onLongPress, longPressDuration: 500 })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalled();
      expect(result.current.isLongPressing).toBe(true);
    });

    it('should cancel long press on movement', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onLongPress, longPressDuration: 500 })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      // Move before long press completes
      act(() => {
        touchHandlers.onTouchMove({
          touches: [{ clientX: 150, clientY: 100 }]
        });
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Haptic Feedback', () => {
    it('should trigger haptic feedback on swipe', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeRight, enableHaptic: true })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });
      });

      expect(navigator.vibrate).toHaveBeenCalled();
    });

    it('should not trigger haptic when disabled', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() => 
        useTouchGestures({ onSwipeRight, enableHaptic: false })
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });
      });

      expect(navigator.vibrate).not.toHaveBeenCalled();
    });

    it('should trigger different haptic patterns', () => {
      const { result } = renderHook(() => 
        useTouchGestures({ enableHaptic: true })
      );

      const { triggerHaptic } = result.current;

      act(() => {
        triggerHaptic('light');
      });
      expect(navigator.vibrate).toHaveBeenCalledWith([10]);

      act(() => {
        triggerHaptic('medium');
      });
      expect(navigator.vibrate).toHaveBeenCalledWith([20]);

      act(() => {
        triggerHaptic('heavy');
      });
      expect(navigator.vibrate).toHaveBeenCalledWith([30]);

      act(() => {
        triggerHaptic('success');
      });
      expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
    });
  });

  describe('State Management', () => {
    it('should track swiping state', () => {
      const { result } = renderHook(() => 
        useTouchGestures({ swipeThreshold: 50 })
      );

      const { touchHandlers } = result.current;

      expect(result.current.isSwiping).toBe(false);

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      act(() => {
        touchHandlers.onTouchMove({
          touches: [{ clientX: 200, clientY: 100 }]
        });
      });

      expect(result.current.isSwiping).toBe(true);

      act(() => {
        touchHandlers.onTouchEnd({
          changedTouches: [{ clientX: 200, clientY: 100 }]
        });
      });

      expect(result.current.isSwiping).toBe(false);
    });

    it('should reset state on touch cancel', () => {
      const { result } = renderHook(() => 
        useTouchGestures({})
      );

      const { touchHandlers } = result.current;

      act(() => {
        touchHandlers.onTouchStart({
          touches: [{ clientX: 100, clientY: 100 }]
        });
      });

      act(() => {
        touchHandlers.onTouchCancel({
          changedTouches: [{ clientX: 100, clientY: 100 }]
        });
      });

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.isLongPressing).toBe(false);
    });
  });

  describe('Touch Target Accessibility', () => {
    it('should provide touch handlers for accessibility', () => {
      const { result } = renderHook(() => 
        useTouchGestures({})
      );

      const { touchHandlers } = result.current;

      expect(touchHandlers).toHaveProperty('onTouchStart');
      expect(touchHandlers).toHaveProperty('onTouchMove');
      expect(touchHandlers).toHaveProperty('onTouchEnd');
      expect(touchHandlers).toHaveProperty('onTouchCancel');
    });
  });
});
