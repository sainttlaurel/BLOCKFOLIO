/**
 * Browser Detection Utility Tests
 */

import {
  detectBrowser,
  supportsCSS,
  checkFeatureSupport,
  checkCompatibility,
  getPerformanceRecommendations
} from '../browserDetection';

describe('Browser Detection', () => {
  describe('detectBrowser', () => {
    it('should detect browser information', () => {
      const browser = detectBrowser();
      
      expect(browser).toHaveProperty('name');
      expect(browser).toHaveProperty('version');
      expect(browser).toHaveProperty('isSupported');
      expect(browser).toHaveProperty('isMobile');
      expect(browser).toHaveProperty('isIOS');
      expect(browser).toHaveProperty('isAndroid');
      expect(browser).toHaveProperty('userAgent');
    });
    
    it('should detect if browser is supported', () => {
      const browser = detectBrowser();
      expect(typeof browser.isSupported).toBe('boolean');
    });
  });
  
  describe('supportsCSS', () => {
    it('should check CSS feature support', () => {
      const supportsGrid = supportsCSS('display', 'grid');
      expect(typeof supportsGrid).toBe('boolean');
    });
    
    it('should return false for unsupported features', () => {
      const supportsInvalid = supportsCSS('invalid-property', 'invalid-value');
      expect(supportsInvalid).toBe(false);
    });
  });
  
  describe('checkFeatureSupport', () => {
    it('should return feature support object', () => {
      const features = checkFeatureSupport();
      
      expect(features).toHaveProperty('backdropFilter');
      expect(features).toHaveProperty('cssGrid');
      expect(features).toHaveProperty('cssCustomProperties');
      expect(features).toHaveProperty('clamp');
      expect(features).toHaveProperty('scrollSnap');
      expect(features).toHaveProperty('asyncAwait');
      expect(features).toHaveProperty('promises');
      expect(features).toHaveProperty('fetch');
      expect(features).toHaveProperty('intersectionObserver');
      expect(features).toHaveProperty('resizeObserver');
      expect(features).toHaveProperty('touchEvents');
      expect(features).toHaveProperty('webSocket');
      expect(features).toHaveProperty('localStorage');
    });
    
    it('should return boolean values for all features', () => {
      const features = checkFeatureSupport();
      
      Object.values(features).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });
  });
  
  describe('checkCompatibility', () => {
    it('should return compatibility status', () => {
      const compatibility = checkCompatibility();
      
      expect(compatibility).toHaveProperty('browser');
      expect(compatibility).toHaveProperty('features');
      expect(compatibility).toHaveProperty('isCompatible');
      expect(compatibility).toHaveProperty('warnings');
      expect(compatibility).toHaveProperty('recommendations');
    });
    
    it('should return array of warnings', () => {
      const compatibility = checkCompatibility();
      expect(Array.isArray(compatibility.warnings)).toBe(true);
    });
    
    it('should return array of recommendations', () => {
      const compatibility = checkCompatibility();
      expect(Array.isArray(compatibility.recommendations)).toBe(true);
    });
  });
  
  describe('getPerformanceRecommendations', () => {
    it('should return performance recommendations', () => {
      const recommendations = getPerformanceRecommendations();
      
      expect(recommendations).toHaveProperty('reduceBlur');
      expect(recommendations).toHaveProperty('simplifyAnimations');
      expect(recommendations).toHaveProperty('disableHaptics');
      expect(recommendations).toHaveProperty('optimizeCharts');
    });
    
    it('should return boolean values for all recommendations', () => {
      const recommendations = getPerformanceRecommendations();
      
      Object.values(recommendations).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });
  });
});

describe('Browser-Specific Detection', () => {
  const originalUserAgent = navigator.userAgent;
  
  afterEach(() => {
    // Restore original userAgent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
  });
  
  it('should detect Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      writable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Chrome');
    expect(browser.version).toBeGreaterThanOrEqual(90);
  });
  
  it('should detect Firefox', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      writable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Firefox');
    expect(browser.version).toBeGreaterThanOrEqual(88);
  });
  
  it('should detect Safari', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      writable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Safari');
    expect(browser.version).toBeGreaterThanOrEqual(14);
  });
  
  it('should detect Edge', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      writable: true
    });
    
    const browser = detectBrowser();
    expect(browser.name).toBe('Edge');
    expect(browser.version).toBeGreaterThanOrEqual(90);
  });
  
  it('should detect mobile devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      writable: true
    });
    
    const browser = detectBrowser();
    expect(browser.isMobile).toBe(true);
    expect(browser.isIOS).toBe(true);
  });
  
  it('should detect Android devices', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
      writable: true
    });
    
    const browser = detectBrowser();
    expect(browser.isMobile).toBe(true);
    expect(browser.isAndroid).toBe(true);
  });
});

describe('Feature Support Detection', () => {
  it('should detect CSS Grid support', () => {
    const features = checkFeatureSupport();
    // Modern browsers should support CSS Grid
    expect(features.cssGrid).toBe(true);
  });
  
  it('should detect Promises support', () => {
    const features = checkFeatureSupport();
    // Modern browsers should support Promises
    expect(features.promises).toBe(true);
  });
  
  it('should detect Fetch API support', () => {
    const features = checkFeatureSupport();
    // Modern browsers should support Fetch
    expect(features.fetch).toBe(true);
  });
  
  it('should detect WebSocket support', () => {
    const features = checkFeatureSupport();
    // Modern browsers should support WebSocket
    expect(features.webSocket).toBe(true);
  });
});
