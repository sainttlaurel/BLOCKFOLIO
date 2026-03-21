/**
 * CSS.supports Polyfill
 * 
 * Provides CSS.supports functionality for browsers that don't support it
 */

if (typeof window !== 'undefined' && (typeof CSS === 'undefined' || typeof CSS.supports !== 'function')) {
  if (typeof CSS === 'undefined') {
    window.CSS = {};
  }
  
  CSS.supports = function(property, value) {
    // If called with two arguments
    if (arguments.length === 2) {
      const element = document.createElement('div');
      const propertyName = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      
      try {
        element.style[property] = value;
        return element.style[property] === value || element.style[propertyName] === value;
      } catch (e) {
        return false;
      }
    }
    
    // If called with one argument (CSS declaration string)
    if (arguments.length === 1) {
      const declaration = property;
      const element = document.createElement('div');
      
      try {
        element.style.cssText = declaration;
        return element.style.length > 0;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  };
  
  console.log('✅ CSS.supports polyfill loaded');
}

export default {};
