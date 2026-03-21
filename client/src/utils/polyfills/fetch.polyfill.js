/**
 * Fetch API Polyfill
 * 
 * Provides fetch() functionality for browsers that don't support it
 * Uses XMLHttpRequest as fallback
 */

if (typeof window !== 'undefined' && !('fetch' in window)) {
  window.fetch = function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options.method || 'GET';
      const headers = options.headers || {};
      const body = options.body;
      
      xhr.open(method, url, true);
      
      // Set headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      
      // Handle response
      xhr.onload = function() {
        const response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders()),
          url: xhr.responseURL || url,
          text: () => Promise.resolve(xhr.responseText),
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          blob: () => Promise.resolve(new Blob([xhr.response])),
          arrayBuffer: () => Promise.resolve(xhr.response)
        };
        
        if (response.ok) {
          resolve(response);
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network request failed'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Network request timed out'));
      };
      
      // Send request
      xhr.send(body);
    });
  };
  
  function parseHeaders(headerStr) {
    const headers = {};
    if (!headerStr) return headers;
    
    headerStr.split('\r\n').forEach(line => {
      const parts = line.split(': ');
      const key = parts[0];
      const value = parts.slice(1).join(': ');
      if (key) {
        headers[key] = value;
      }
    });
    
    return headers;
  }
  
  console.log('✅ Fetch API polyfill loaded');
}

export default {};
