/**
 * Technical Analysis Indicators
 * Utility functions for calculating common trading indicators
 */

/**
 * Simple Moving Average (SMA)
 * @param {Array} data - Array of price values
 * @param {number} period - Period for the moving average
 * @returns {Array} Array of SMA values
 */
export const calculateSMA = (data, period = 20) => {
  if (!data || data.length < period) return [];
  
  const sma = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    sma.push(sum / period);
  }
  
  return sma;
};

/**
 * Exponential Moving Average (EMA)
 * @param {Array} data - Array of price values
 * @param {number} period - Period for the moving average
 * @returns {Array} Array of EMA values
 */
export const calculateEMA = (data, period = 20) => {
  if (!data || data.length < period) return [];
  
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first value
  const firstSMA = data.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  ema.push(firstSMA);
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const emaValue = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(emaValue);
  }
  
  return ema;
};

/**
 * Relative Strength Index (RSI)
 * @param {Array} data - Array of price values
 * @param {number} period - Period for RSI calculation (default 14)
 * @returns {Array} Array of RSI values
 */
export const calculateRSI = (data, period = 14) => {
  if (!data || data.length < period + 1) return [];
  
  const rsi = [];
  const gains = [];
  const losses = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((acc, val) => acc + val, 0) / period;
  
  // Calculate RSI for the first period
  let rs = avgGain / avgLoss;
  rsi.push(100 - (100 / (1 + rs)));
  
  // Calculate RSI for remaining periods
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
};

/**
 * MACD (Moving Average Convergence Divergence)
 * @param {Array} data - Array of price values
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line EMA period (default 9)
 * @returns {Object} Object containing MACD line, signal line, and histogram
 */
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!data || data.length < slowPeriod) return { macd: [], signal: [], histogram: [] };
  
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macdLine = [];
  const startIndex = slowPeriod - fastPeriod;
  
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + startIndex] - slowEMA[i]);
  }
  
  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram (MACD - Signal)
  const histogram = [];
  const signalStartIndex = macdLine.length - signalLine.length;
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + signalStartIndex] - signalLine[i]);
  }
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram
  };
};

/**
 * Bollinger Bands
 * @param {Array} data - Array of price values
 * @param {number} period - Period for moving average (default 20)
 * @param {number} stdDev - Standard deviation multiplier (default 2)
 * @returns {Object} Object containing upper band, middle band (SMA), and lower band
 */
export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  if (!data || data.length < period) return { upper: [], middle: [], lower: [] };
  
  const sma = calculateSMA(data, period);
  const upper = [];
  const lower = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    
    // Calculate standard deviation
    const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    upper.push(mean + (stdDev * standardDeviation));
    lower.push(mean - (stdDev * standardDeviation));
  }
  
  return {
    upper: upper,
    middle: sma,
    lower: lower
  };
};

/**
 * Support and Resistance Levels
 * @param {Array} data - Array of OHLC data objects
 * @param {number} lookback - Number of periods to look back for peaks/troughs
 * @returns {Object} Object containing support and resistance levels
 */
export const calculateSupportResistance = (data, lookback = 20) => {
  if (!data || data.length < lookback * 2) return { support: [], resistance: [] };
  
  const support = [];
  const resistance = [];
  
  for (let i = lookback; i < data.length - lookback; i++) {
    const current = data[i];
    let isSupport = true;
    let isResistance = true;
    
    // Check if current low is a support level
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].l < current.l) {
        isSupport = false;
        break;
      }
    }
    
    // Check if current high is a resistance level
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i && data[j].h > current.h) {
        isResistance = false;
        break;
      }
    }
    
    if (isSupport) {
      support.push({ index: i, level: current.l });
    }
    
    if (isResistance) {
      resistance.push({ index: i, level: current.h });
    }
  }
  
  return { support, resistance };
};

/**
 * Volume Weighted Average Price (VWAP)
 * @param {Array} data - Array of OHLCV data objects
 * @returns {Array} Array of VWAP values
 */
export const calculateVWAP = (data) => {
  if (!data || data.length === 0) return [];
  
  const vwap = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (let i = 0; i < data.length; i++) {
    const typicalPrice = (data[i].h + data[i].l + data[i].c) / 3;
    const tpv = typicalPrice * data[i].v;
    
    cumulativeTPV += tpv;
    cumulativeVolume += data[i].v;
    
    vwap.push(cumulativeTPV / cumulativeVolume);
  }
  
  return vwap;
};

/**
 * Stochastic Oscillator
 * @param {Array} data - Array of OHLC data objects
 * @param {number} kPeriod - %K period (default 14)
 * @param {number} dPeriod - %D period (default 3)
 * @returns {Object} Object containing %K and %D values
 */
export const calculateStochastic = (data, kPeriod = 14, dPeriod = 3) => {
  if (!data || data.length < kPeriod) return { k: [], d: [] };
  
  const k = [];
  
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const lowestLow = Math.min(...slice.map(d => d.l));
    const highestHigh = Math.max(...slice.map(d => d.h));
    const currentClose = data[i].c;
    
    const kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    k.push(kValue);
  }
  
  // Calculate %D as SMA of %K
  const d = calculateSMA(k, dPeriod);
  
  return { k, d };
};

/**
 * Average True Range (ATR)
 * @param {Array} data - Array of OHLC data objects
 * @param {number} period - Period for ATR calculation (default 14)
 * @returns {Array} Array of ATR values
 */
export const calculateATR = (data, period = 14) => {
  if (!data || data.length < period + 1) return [];
  
  const trueRanges = [];
  
  // Calculate True Range for each period
  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];
    
    const tr1 = current.h - current.l;
    const tr2 = Math.abs(current.h - previous.c);
    const tr3 = Math.abs(current.l - previous.c);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Calculate ATR as EMA of True Range
  return calculateEMA(trueRanges, period);
};

/**
 * Commodity Channel Index (CCI)
 * @param {Array} data - Array of OHLC data objects
 * @param {number} period - Period for CCI calculation (default 20)
 * @returns {Array} Array of CCI values
 */
export const calculateCCI = (data, period = 20) => {
  if (!data || data.length < period) return [];
  
  const cci = [];
  const constant = 0.015;
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    
    // Calculate Typical Price for each period
    const typicalPrices = slice.map(d => (d.h + d.l + d.c) / 3);
    
    // Calculate Simple Moving Average of Typical Price
    const smaTP = typicalPrices.reduce((acc, val) => acc + val, 0) / period;
    
    // Calculate Mean Deviation
    const meanDeviation = typicalPrices.reduce((acc, val) => acc + Math.abs(val - smaTP), 0) / period;
    
    // Calculate CCI
    const currentTP = (data[i].h + data[i].l + data[i].c) / 3;
    const cciValue = (currentTP - smaTP) / (constant * meanDeviation);
    
    cci.push(cciValue);
  }
  
  return cci;
};