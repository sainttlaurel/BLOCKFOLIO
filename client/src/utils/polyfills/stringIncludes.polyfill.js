/**
 * String.prototype.includes Polyfill
 * 
 * Provides String.includes functionality for browsers that don't support it
 */

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
  
  console.log('✅ String.includes polyfill loaded');
}

export default {};
