/**
 * Object.assign Polyfill
 * 
 * Provides Object.assign functionality for browsers that don't support it
 */

if (typeof Object.assign !== 'function') {
  Object.assign = function(target, ...sources) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    
    const to = Object(target);
    
    sources.forEach(source => {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key];
          }
        }
      }
    });
    
    return to;
  };
  
  console.log('✅ Object.assign polyfill loaded');
}

export default {};
