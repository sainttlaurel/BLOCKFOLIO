/**
 * IntersectionObserver Polyfill
 * 
 * Provides IntersectionObserver functionality for browsers that don't support it
 * Used for lazy loading and scroll-based animations
 */

if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class IntersectionObserverPolyfill {
    constructor(callback, options = {}) {
      this.callback = callback;
      this.root = options.root || null;
      this.rootMargin = options.rootMargin || '0px';
      this.thresholds = Array.isArray(options.threshold) 
        ? options.threshold 
        : [options.threshold || 0];
      this.observedElements = new Map();
      this.checkInterval = null;
    }

    observe(target) {
      if (this.observedElements.has(target)) return;
      
      this.observedElements.set(target, {
        isIntersecting: false,
        intersectionRatio: 0
      });
      
      if (!this.checkInterval) {
        this.startChecking();
      }
      
      // Initial check
      this.checkElement(target);
    }

    unobserve(target) {
      this.observedElements.delete(target);
      
      if (this.observedElements.size === 0) {
        this.stopChecking();
      }
    }

    disconnect() {
      this.observedElements.clear();
      this.stopChecking();
    }

    startChecking() {
      this.checkInterval = setInterval(() => {
        this.checkAllElements();
      }, 100);
    }

    stopChecking() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }

    checkAllElements() {
      this.observedElements.forEach((_, element) => {
        this.checkElement(element);
      });
    }

    checkElement(target) {
      const rect = target.getBoundingClientRect();
      const rootRect = this.root 
        ? this.root.getBoundingClientRect() 
        : { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };
      
      const isIntersecting = (
        rect.top < rootRect.bottom &&
        rect.bottom > rootRect.top &&
        rect.left < rootRect.right &&
        rect.right > rootRect.left
      );
      
      const previousState = this.observedElements.get(target);
      
      if (previousState.isIntersecting !== isIntersecting) {
        this.observedElements.set(target, {
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0
        });
        
        const entry = {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: isIntersecting ? rect : null,
          rootBounds: rootRect,
          time: Date.now()
        };
        
        this.callback([entry], this);
      }
    }
  }

  window.IntersectionObserver = IntersectionObserverPolyfill;
  console.log('✅ IntersectionObserver polyfill loaded');
}

export default {};
