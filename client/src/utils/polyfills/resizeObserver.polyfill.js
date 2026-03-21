/**
 * ResizeObserver Polyfill
 * 
 * Provides ResizeObserver functionality for browsers that don't support it
 * Used for responsive component sizing
 */

if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  class ResizeObserverPolyfill {
    constructor(callback) {
      this.callback = callback;
      this.observedElements = new Map();
      this.checkInterval = null;
    }

    observe(target) {
      if (this.observedElements.has(target)) return;
      
      const rect = target.getBoundingClientRect();
      this.observedElements.set(target, {
        width: rect.width,
        height: rect.height
      });
      
      if (!this.checkInterval) {
        this.startChecking();
      }
      
      // Initial callback
      this.notifyResize(target);
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
      
      // Also check on window resize
      window.addEventListener('resize', this.handleWindowResize);
    }

    stopChecking() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
      window.removeEventListener('resize', this.handleWindowResize);
    }

    handleWindowResize = () => {
      this.checkAllElements();
    };

    checkAllElements() {
      this.observedElements.forEach((previousSize, element) => {
        const rect = element.getBoundingClientRect();
        
        if (rect.width !== previousSize.width || rect.height !== previousSize.height) {
          this.observedElements.set(element, {
            width: rect.width,
            height: rect.height
          });
          
          this.notifyResize(element);
        }
      });
    }

    notifyResize(target) {
      const rect = target.getBoundingClientRect();
      
      const entry = {
        target,
        contentRect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          left: rect.left
        },
        borderBoxSize: [{
          inlineSize: rect.width,
          blockSize: rect.height
        }],
        contentBoxSize: [{
          inlineSize: rect.width,
          blockSize: rect.height
        }]
      };
      
      this.callback([entry], this);
    }
  }

  window.ResizeObserver = ResizeObserverPolyfill;
  console.log('✅ ResizeObserver polyfill loaded');
}

export default {};
