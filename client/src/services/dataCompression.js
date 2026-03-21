/**
 * Data Compression Service
 * 
 * Provides efficient data compression for high-frequency updates to reduce
 * bandwidth usage and improve performance for real-time data streams.
 */

class DataCompressionService {
  constructor() {
    this.compressionMethods = {
      gzip: this.gzipCompress.bind(this),
      lz4: this.lz4Compress.bind(this),
      delta: this.deltaCompress.bind(this),
      json: this.jsonCompress.bind(this),
      binary: this.binaryCompress.bind(this)
    };
    
    this.decompressionMethods = {
      gzip: this.gzipDecompress.bind(this),
      lz4: this.lz4Decompress.bind(this),
      delta: this.deltaDecompress.bind(this),
      json: this.jsonDecompress.bind(this),
      binary: this.binaryDecompress.bind(this)
    };
    
    // Compression statistics
    this.stats = {
      totalCompressions: 0,
      totalDecompressions: 0,
      totalBytesOriginal: 0,
      totalBytesCompressed: 0,
      averageCompressionRatio: 0,
      compressionTime: 0,
      decompressionTime: 0
    };
    
    // Delta compression state for price data
    this.deltaState = {
      prices: new Map(),
      marketData: new Map(),
      portfolio: null
    };
    
    // Binary encoding schemas for different data types
    this.binarySchemas = {
      price: {
        symbol: 'string',
        price: 'float32',
        change: 'float32',
        volume: 'float32',
        timestamp: 'uint32'
      },
      marketData: {
        marketCap: 'float64',
        volume24h: 'float64',
        dominance: 'float32',
        fearGreedIndex: 'uint8',
        timestamp: 'uint32'
      }
    };
    
    // Initialize compression worker if available
    this.initializeWorker();
  }

  /**
   * Initialize web worker for compression tasks
   */
  initializeWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        // Create compression worker for heavy operations
        const workerCode = `
          self.onmessage = function(e) {
            const { method, data, id } = e.data;
            
            try {
              let result;
              
              switch (method) {
                case 'compress':
                  result = compressData(data);
                  break;
                case 'decompress':
                  result = decompressData(data);
                  break;
                default:
                  throw new Error('Unknown method: ' + method);
              }
              
              self.postMessage({ id, result, success: true });
            } catch (error) {
              self.postMessage({ id, error: error.message, success: false });
            }
          };
          
          function compressData(data) {
            // Simple compression implementation for worker
            const jsonString = JSON.stringify(data);
            return btoa(jsonString);
          }
          
          function decompressData(data) {
            const jsonString = atob(data);
            return JSON.parse(jsonString);
          }
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
        this.workerPromises = new Map();
        this.workerIdCounter = 0;
        
        this.worker.onmessage = (e) => {
          const { id, result, error, success } = e.data;
          const promise = this.workerPromises.get(id);
          
          if (promise) {
            if (success) {
              promise.resolve(result);
            } else {
              promise.reject(new Error(error));
            }
            this.workerPromises.delete(id);
          }
        };
        
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
        this.worker = null;
      }
    }
  }

  /**
   * Compress data using specified method
   */
  async compress(data, method = 'auto', options = {}) {
    const startTime = performance.now();
    
    try {
      // Auto-select compression method based on data characteristics
      if (method === 'auto') {
        method = this.selectOptimalMethod(data);
      }
      
      const originalSize = this.calculateDataSize(data);
      let compressedData;
      
      // Use worker for heavy compression if available
      if (this.worker && options.useWorker && originalSize > 10000) {
        compressedData = await this.compressWithWorker(data, method);
      } else {
        compressedData = await this.compressionMethods[method](data, options);
      }
      
      const compressedSize = this.calculateDataSize(compressedData);
      const compressionTime = performance.now() - startTime;
      
      // Update statistics
      this.updateCompressionStats(originalSize, compressedSize, compressionTime);
      
      return {
        data: compressedData,
        method,
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
        compressionTime
      };
      
    } catch (error) {
      console.error('Compression failed:', error);
      throw error;
    }
  }

  /**
   * Decompress data using specified method
   */
  async decompress(compressedData, method, options = {}) {
    const startTime = performance.now();
    
    try {
      let decompressedData;
      
      // Use worker for heavy decompression if available
      if (this.worker && options.useWorker) {
        decompressedData = await this.decompressWithWorker(compressedData, method);
      } else {
        decompressedData = await this.decompressionMethods[method](compressedData, options);
      }
      
      const decompressionTime = performance.now() - startTime;
      
      // Update statistics
      this.stats.totalDecompressions++;
      this.stats.decompressionTime += decompressionTime;
      
      return decompressedData;
      
    } catch (error) {
      console.error('Decompression failed:', error);
      throw error;
    }
  }

  /**
   * Select optimal compression method based on data characteristics
   */
  selectOptimalMethod(data) {
    const dataSize = this.calculateDataSize(data);
    const dataType = this.analyzeDataType(data);
    
    // For small data, use simple JSON compression
    if (dataSize < 1000) {
      return 'json';
    }
    
    // For price updates, use delta compression
    if (dataType === 'price' || dataType === 'prices') {
      return 'delta';
    }
    
    // For structured data, use binary compression
    if (dataType === 'structured') {
      return 'binary';
    }
    
    // For large data, use gzip
    if (dataSize > 10000) {
      return 'gzip';
    }
    
    // Default to LZ4 for general purpose
    return 'lz4';
  }

  /**
   * Analyze data type for optimal compression
   */
  analyzeDataType(data) {
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].symbol && typeof data[0].price === 'number') {
        return 'prices';
      }
      return 'array';
    }
    
    if (typeof data === 'object' && data !== null) {
      if (data.symbol && typeof data.price === 'number') {
        return 'price';
      }
      if (data.marketCap || data.volume24h) {
        return 'marketData';
      }
      return 'structured';
    }
    
    return 'primitive';
  }

  /**
   * GZIP compression (using browser's CompressionStream if available)
   */
  async gzipCompress(data) {
    const jsonString = JSON.stringify(data);
    
    if ('CompressionStream' in window) {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(jsonString));
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
    } else {
      // Fallback to simple base64 encoding
      return btoa(jsonString);
    }
  }

  /**
   * GZIP decompression
   */
  async gzipDecompress(compressedData) {
    if ('DecompressionStream' in window && compressedData instanceof Uint8Array) {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(compressedData);
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
      const jsonString = new TextDecoder().decode(decompressed);
      return JSON.parse(jsonString);
    } else {
      // Fallback from base64
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    }
  }

  /**
   * LZ4-style compression (simplified implementation)
   */
  async lz4Compress(data) {
    const jsonString = JSON.stringify(data);
    
    // Simple dictionary-based compression
    const dictionary = new Map();
    let dictIndex = 0;
    let compressed = '';
    
    // Build dictionary of common substrings
    for (let i = 0; i < jsonString.length - 3; i++) {
      const substr = jsonString.substr(i, 4);
      if (!dictionary.has(substr)) {
        dictionary.set(substr, String.fromCharCode(256 + dictIndex));
        dictIndex++;
        if (dictIndex > 1000) break; // Limit dictionary size
      }
    }
    
    // Replace common substrings with dictionary references
    compressed = jsonString;
    for (const [substr, ref] of dictionary.entries()) {
      compressed = compressed.split(substr).join(ref);
    }
    
    return {
      compressed: btoa(compressed),
      dictionary: Array.from(dictionary.entries())
    };
  }

  /**
   * LZ4-style decompression
   */
  async lz4Decompress(compressedData) {
    const { compressed, dictionary } = compressedData;
    let decompressed = atob(compressed);
    
    // Restore original strings using dictionary
    for (const [substr, ref] of dictionary) {
      decompressed = decompressed.split(ref).join(substr);
    }
    
    return JSON.parse(decompressed);
  }

  /**
   * Delta compression for price data
   */
  async deltaCompress(data, options = {}) {
    const { dataType = 'prices' } = options;
    
    if (Array.isArray(data)) {
      return this.compressPriceArray(data, dataType);
    } else if (data.symbol) {
      return this.compressSinglePrice(data, dataType);
    } else {
      // Fallback to JSON compression
      return this.jsonCompress(data);
    }
  }

  /**
   * Compress array of price data using delta encoding
   */
  compressPriceArray(prices, dataType) {
    const compressed = {
      type: 'delta_array',
      dataType,
      count: prices.length,
      deltas: []
    };
    
    prices.forEach((price, index) => {
      const symbol = price.symbol;
      const lastPrice = this.deltaState[dataType].get(symbol);
      
      if (lastPrice) {
        // Calculate deltas
        const delta = {
          s: symbol,
          p: this.calculateDelta(price.price, lastPrice.price),
          c: this.calculateDelta(price.change || 0, lastPrice.change || 0),
          v: this.calculateDelta(price.volume || 0, lastPrice.volume || 0),
          t: price.timestamp - (lastPrice.timestamp || 0)
        };
        compressed.deltas.push(delta);
      } else {
        // First time seeing this symbol, store full data
        compressed.deltas.push({
          s: symbol,
          p: price.price,
          c: price.change || 0,
          v: price.volume || 0,
          t: price.timestamp,
          f: true // full data flag
        });
      }
      
      // Update state
      this.deltaState[dataType].set(symbol, price);
    });
    
    return compressed;
  }

  /**
   * Compress single price data using delta encoding
   */
  compressSinglePrice(price, dataType) {
    const symbol = price.symbol;
    const lastPrice = this.deltaState[dataType].get(symbol);
    
    let compressed;
    
    if (lastPrice) {
      compressed = {
        type: 'delta_single',
        dataType,
        s: symbol,
        p: this.calculateDelta(price.price, lastPrice.price),
        c: this.calculateDelta(price.change || 0, lastPrice.change || 0),
        v: this.calculateDelta(price.volume || 0, lastPrice.volume || 0),
        t: price.timestamp - (lastPrice.timestamp || 0)
      };
    } else {
      compressed = {
        type: 'delta_single',
        dataType,
        s: symbol,
        p: price.price,
        c: price.change || 0,
        v: price.volume || 0,
        t: price.timestamp,
        f: true // full data flag
      };
    }
    
    // Update state
    this.deltaState[dataType].set(symbol, price);
    
    return compressed;
  }

  /**
   * Delta decompression
   */
  async deltaDecompress(compressedData) {
    const { type, dataType } = compressedData;
    
    if (type === 'delta_array') {
      return this.decompressPriceArray(compressedData, dataType);
    } else if (type === 'delta_single') {
      return this.decompressSinglePrice(compressedData, dataType);
    } else {
      throw new Error('Unknown delta compression type');
    }
  }

  /**
   * Decompress price array
   */
  decompressPriceArray(compressed, dataType) {
    const prices = [];
    
    compressed.deltas.forEach(delta => {
      const symbol = delta.s;
      const lastPrice = this.deltaState[dataType].get(symbol);
      
      let price;
      
      if (delta.f || !lastPrice) {
        // Full data
        price = {
          symbol,
          price: delta.p,
          change: delta.c,
          volume: delta.v,
          timestamp: delta.t
        };
      } else {
        // Delta data
        price = {
          symbol,
          price: lastPrice.price + delta.p,
          change: (lastPrice.change || 0) + delta.c,
          volume: (lastPrice.volume || 0) + delta.v,
          timestamp: (lastPrice.timestamp || 0) + delta.t
        };
      }
      
      prices.push(price);
      this.deltaState[dataType].set(symbol, price);
    });
    
    return prices;
  }

  /**
   * Decompress single price
   */
  decompressSinglePrice(compressed, dataType) {
    const symbol = compressed.s;
    const lastPrice = this.deltaState[dataType].get(symbol);
    
    let price;
    
    if (compressed.f || !lastPrice) {
      // Full data
      price = {
        symbol,
        price: compressed.p,
        change: compressed.c,
        volume: compressed.v,
        timestamp: compressed.t
      };
    } else {
      // Delta data
      price = {
        symbol,
        price: lastPrice.price + compressed.p,
        change: (lastPrice.change || 0) + compressed.c,
        volume: (lastPrice.volume || 0) + compressed.v,
        timestamp: (lastPrice.timestamp || 0) + compressed.t
      };
    }
    
    this.deltaState[dataType].set(symbol, price);
    return price;
  }

  /**
   * Calculate delta with precision handling
   */
  calculateDelta(newValue, oldValue) {
    const delta = newValue - oldValue;
    // Round to avoid floating point precision issues
    return Math.round(delta * 100000) / 100000;
  }

  /**
   * JSON compression with optimization
   */
  async jsonCompress(data) {
    const jsonString = JSON.stringify(data);
    
    // Simple optimizations
    let optimized = jsonString
      .replace(/null/g, 'n')
      .replace(/true/g, 't')
      .replace(/false/g, 'f')
      .replace(/\"symbol\"/g, 's')
      .replace(/\"price\"/g, 'p')
      .replace(/\"change\"/g, 'c')
      .replace(/\"volume\"/g, 'v')
      .replace(/\"timestamp\"/g, 't');
    
    return btoa(optimized);
  }

  /**
   * JSON decompression
   */
  async jsonDecompress(compressedData) {
    let jsonString = atob(compressedData);
    
    // Restore optimizations
    jsonString = jsonString
      .replace(/\"t\"/g, '"timestamp"')
      .replace(/\"v\"/g, '"volume"')
      .replace(/\"c\"/g, '"change"')
      .replace(/\"p\"/g, '"price"')
      .replace(/\"s\"/g, '"symbol"')
      .replace(/\bf\b/g, 'false')
      .replace(/\bt\b/g, 'true')
      .replace(/\bn\b/g, 'null');
    
    return JSON.parse(jsonString);
  }

  /**
   * Binary compression using typed arrays
   */
  async binaryCompress(data, options = {}) {
    const { schema = 'price' } = options;
    const schemaDefinition = this.binarySchemas[schema];
    
    if (!schemaDefinition) {
      throw new Error(`Unknown binary schema: ${schema}`);
    }
    
    if (Array.isArray(data)) {
      return this.compressBinaryArray(data, schemaDefinition);
    } else {
      return this.compressBinaryObject(data, schemaDefinition);
    }
  }

  /**
   * Compress array to binary format
   */
  compressBinaryArray(data, schema) {
    const fieldNames = Object.keys(schema);
    const fieldTypes = Object.values(schema);
    
    // Calculate buffer size
    let itemSize = 0;
    fieldTypes.forEach(type => {
      switch (type) {
        case 'uint8': itemSize += 1; break;
        case 'uint16': itemSize += 2; break;
        case 'uint32': itemSize += 4; break;
        case 'float32': itemSize += 4; break;
        case 'float64': itemSize += 8; break;
        case 'string': itemSize += 32; break; // Fixed size for strings
      }
    });
    
    const buffer = new ArrayBuffer(4 + data.length * itemSize); // 4 bytes for count
    const view = new DataView(buffer);
    let offset = 0;
    
    // Write count
    view.setUint32(offset, data.length, true);
    offset += 4;
    
    // Write data
    data.forEach(item => {
      fieldNames.forEach((fieldName, index) => {
        const fieldType = fieldTypes[index];
        const value = item[fieldName];
        
        switch (fieldType) {
          case 'uint8':
            view.setUint8(offset, value || 0);
            offset += 1;
            break;
          case 'uint16':
            view.setUint16(offset, value || 0, true);
            offset += 2;
            break;
          case 'uint32':
            view.setUint32(offset, value || 0, true);
            offset += 4;
            break;
          case 'float32':
            view.setFloat32(offset, value || 0, true);
            offset += 4;
            break;
          case 'float64':
            view.setFloat64(offset, value || 0, true);
            offset += 8;
            break;
          case 'string':
            const str = (value || '').substring(0, 31); // Limit string length
            for (let i = 0; i < 32; i++) {
              view.setUint8(offset + i, i < str.length ? str.charCodeAt(i) : 0);
            }
            offset += 32;
            break;
        }
      });
    });
    
    return {
      type: 'binary_array',
      schema: fieldNames,
      buffer: Array.from(new Uint8Array(buffer))
    };
  }

  /**
   * Binary decompression
   */
  async binaryDecompress(compressedData) {
    const { type, schema, buffer } = compressedData;
    
    if (type === 'binary_array') {
      return this.decompressBinaryArray(buffer, schema);
    } else {
      throw new Error('Unknown binary compression type');
    }
  }

  /**
   * Decompress binary array
   */
  decompressBinaryArray(bufferArray, fieldNames) {
    const buffer = new Uint8Array(bufferArray).buffer;
    const view = new DataView(buffer);
    let offset = 0;
    
    // Read count
    const count = view.getUint32(offset, true);
    offset += 4;
    
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const item = {};
      
      fieldNames.forEach(fieldName => {
        // Determine field type from schema
        const fieldType = this.binarySchemas.price[fieldName] || 'float32';
        
        switch (fieldType) {
          case 'uint8':
            item[fieldName] = view.getUint8(offset);
            offset += 1;
            break;
          case 'uint16':
            item[fieldName] = view.getUint16(offset, true);
            offset += 2;
            break;
          case 'uint32':
            item[fieldName] = view.getUint32(offset, true);
            offset += 4;
            break;
          case 'float32':
            item[fieldName] = view.getFloat32(offset, true);
            offset += 4;
            break;
          case 'float64':
            item[fieldName] = view.getFloat64(offset, true);
            offset += 8;
            break;
          case 'string':
            let str = '';
            for (let j = 0; j < 32; j++) {
              const charCode = view.getUint8(offset + j);
              if (charCode === 0) break;
              str += String.fromCharCode(charCode);
            }
            item[fieldName] = str;
            offset += 32;
            break;
        }
      });
      
      data.push(item);
    }
    
    return data;
  }

  /**
   * Compress data using web worker
   */
  async compressWithWorker(data, method) {
    if (!this.worker) {
      throw new Error('Worker not available');
    }
    
    const id = ++this.workerIdCounter;
    
    return new Promise((resolve, reject) => {
      this.workerPromises.set(id, { resolve, reject });
      this.worker.postMessage({ id, method: 'compress', data });
    });
  }

  /**
   * Decompress data using web worker
   */
  async decompressWithWorker(data, method) {
    if (!this.worker) {
      throw new Error('Worker not available');
    }
    
    const id = ++this.workerIdCounter;
    
    return new Promise((resolve, reject) => {
      this.workerPromises.set(id, { resolve, reject });
      this.worker.postMessage({ id, method: 'decompress', data });
    });
  }

  /**
   * Calculate data size in bytes
   */
  calculateDataSize(data) {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      return data.byteLength || data.length;
    } else {
      return new Blob([JSON.stringify(data)]).size;
    }
  }

  /**
   * Update compression statistics
   */
  updateCompressionStats(originalSize, compressedSize, compressionTime) {
    this.stats.totalCompressions++;
    this.stats.totalBytesOriginal += originalSize;
    this.stats.totalBytesCompressed += compressedSize;
    this.stats.compressionTime += compressionTime;
    
    // Update average compression ratio
    if (this.stats.totalBytesOriginal > 0) {
      this.stats.averageCompressionRatio = this.stats.totalBytesCompressed / this.stats.totalBytesOriginal;
    }
  }

  /**
   * Get compression statistics
   */
  getStats() {
    return {
      ...this.stats,
      compressionEfficiency: (1 - this.stats.averageCompressionRatio) * 100,
      averageCompressionTime: this.stats.totalCompressions > 0 
        ? this.stats.compressionTime / this.stats.totalCompressions 
        : 0,
      averageDecompressionTime: this.stats.totalDecompressions > 0 
        ? this.stats.decompressionTime / this.stats.totalDecompressions 
        : 0,
      totalBandwidthSaved: this.stats.totalBytesOriginal - this.stats.totalBytesCompressed
    };
  }

  /**
   * Reset compression state
   */
  resetState() {
    this.deltaState.prices.clear();
    this.deltaState.marketData.clear();
    this.deltaState.portfolio = null;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.workerPromises.clear();
    this.resetState();
  }
}

// Create singleton instance
const dataCompressionService = new DataCompressionService();

export default dataCompressionService;