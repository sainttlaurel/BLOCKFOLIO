/**
 * Array.prototype.includes Polyfill
 * 
 * Provides Array.includes functionality for browsers that don't support it
 */

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    
    const o = Object(this);
    const len = o.length >>> 0;
    
    if (len === 0) {
      return false;
    }
    
    const n = fromIndex | 0;
    let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    
    while (k < len) {
      if (o[k] === searchElement || (Number.isNaN(o[k]) && Number.isNaN(searchElement))) {
        return true;
      }
      k++;
    }
    
    return false;
  };
  
  console.log('✅ Array.includes polyfill loaded');
}

export default {};
