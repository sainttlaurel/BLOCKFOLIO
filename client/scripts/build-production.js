#!/usr/bin/env node

/**
 * Production Build Script with Optimization and Monitoring
 * 
 * This script handles the complete production build process including:
 * - Pre-build cleanup
 * - Build execution with optimizations
 * - Post-build analysis and reporting
 * - Bundle size verification
 * - Performance metrics collection
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { gzipSync, brotliCompressSync } = require('zlib');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Configuration
const BUILD_DIR = path.join(__dirname, '../build');
const STATS_FILE = path.join(BUILD_DIR, 'build-stats.json');
const MAX_BUNDLE_SIZE = 512 * 1024; // 500KB
const MAX_CHUNK_SIZE = 256 * 1024; // 250KB

/**
 * Log formatted message to console
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log section header
 */
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.blue);
  console.log('='.repeat(60) + '\n');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate compression ratio
 */
function getCompressionRatio(original, compressed) {
  return ((1 - compressed / original) * 100).toFixed(2) + '%';
}

/**
 * Clean build directory
 */
function cleanBuildDir() {
  logSection('🧹 Cleaning Build Directory');
  
  if (fs.existsSync(BUILD_DIR)) {
    log('Removing existing build directory...', colors.yellow);
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
    log('✓ Build directory cleaned', colors.green);
  } else {
    log('No existing build directory found', colors.yellow);
  }
}

/**
 * Run production build
 */
function runBuild() {
  logSection('🔨 Running Production Build');
  
  try {
    log('Building application with optimizations...', colors.blue);
    
    // Set environment variables for build
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      GENERATE_SOURCEMAP: process.env.GENERATE_SOURCEMAP || 'true',
      INLINE_RUNTIME_CHUNK: 'false',
      IMAGE_INLINE_SIZE_LIMIT: '10000',
      DROP_CONSOLE: process.env.DROP_CONSOLE || 'true'
    };
    
    // Run build command
    execSync('npm run build', {
      stdio: 'inherit',
      env
    });
    
    log('✓ Build completed successfully', colors.green);
  } catch (error) {
    log('✗ Build failed', colors.red);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Analyze bundle sizes
 */
function analyzeBundleSizes() {
  logSection('📊 Analyzing Bundle Sizes');
  
  const staticDir = path.join(BUILD_DIR, 'static');
  const jsDir = path.join(staticDir, 'js');
  const cssDir = path.join(staticDir, 'css');
  
  const stats = {
    timestamp: new Date().toISOString(),
    files: [],
    totals: {
      js: 0,
      css: 0,
      jsGzip: 0,
      cssGzip: 0,
      jsBrotli: 0,
      cssBrotli: 0
    },
    warnings: []
  };
  
  // Analyze JavaScript files
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
    
    log('JavaScript Bundles:', colors.bright);
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const size = getFileSize(filePath);
      const content = fs.readFileSync(filePath);
      const gzipSize = gzipSync(content).length;
      const brotliSize = brotliCompressSync(content).length;
      
      stats.files.push({
        name: file,
        type: 'js',
        size,
        gzipSize,
        brotliSize
      });
      
      stats.totals.js += size;
      stats.totals.jsGzip += gzipSize;
      stats.totals.jsBrotli += brotliSize;
      
      // Check size limits
      let sizeColor = colors.green;
      if (size > MAX_BUNDLE_SIZE) {
        sizeColor = colors.red;
        stats.warnings.push(`${file} exceeds maximum bundle size (${formatBytes(size)} > ${formatBytes(MAX_BUNDLE_SIZE)})`);
      } else if (size > MAX_CHUNK_SIZE) {
        sizeColor = colors.yellow;
      }
      
      console.log(`  ${file}`);
      console.log(`    Original: ${sizeColor}${formatBytes(size)}${colors.reset}`);
      console.log(`    Gzip:     ${colors.blue}${formatBytes(gzipSize)}${colors.reset} (${getCompressionRatio(size, gzipSize)} reduction)`);
      console.log(`    Brotli:   ${colors.blue}${formatBytes(brotliSize)}${colors.reset} (${getCompressionRatio(size, brotliSize)} reduction)`);
      console.log('');
    });
  }
  
  // Analyze CSS files
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && !f.endsWith('.map'));
    
    log('CSS Bundles:', colors.bright);
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const size = getFileSize(filePath);
      const content = fs.readFileSync(filePath);
      const gzipSize = gzipSync(content).length;
      const brotliSize = brotliCompressSync(content).length;
      
      stats.files.push({
        name: file,
        type: 'css',
        size,
        gzipSize,
        brotliSize
      });
      
      stats.totals.css += size;
      stats.totals.cssGzip += gzipSize;
      stats.totals.cssBrotli += brotliSize;
      
      console.log(`  ${file}`);
      console.log(`    Original: ${colors.green}${formatBytes(size)}${colors.reset}`);
      console.log(`    Gzip:     ${colors.blue}${formatBytes(gzipSize)}${colors.reset} (${getCompressionRatio(size, gzipSize)} reduction)`);
      console.log(`    Brotli:   ${colors.blue}${formatBytes(brotliSize)}${colors.reset} (${getCompressionRatio(size, brotliSize)} reduction)`);
      console.log('');
    });
  }
  
  // Save stats to file
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  
  return stats;
}

/**
 * Display build summary
 */
function displaySummary(stats) {
  logSection('📈 Build Summary');
  
  console.log('Total Sizes:');
  console.log(`  JavaScript:  ${formatBytes(stats.totals.js)}`);
  console.log(`    Gzip:      ${formatBytes(stats.totals.jsGzip)} (${getCompressionRatio(stats.totals.js, stats.totals.jsGzip)} reduction)`);
  console.log(`    Brotli:    ${formatBytes(stats.totals.jsBrotli)} (${getCompressionRatio(stats.totals.js, stats.totals.jsBrotli)} reduction)`);
  console.log('');
  console.log(`  CSS:         ${formatBytes(stats.totals.css)}`);
  console.log(`    Gzip:      ${formatBytes(stats.totals.cssGzip)} (${getCompressionRatio(stats.totals.css, stats.totals.cssGzip)} reduction)`);
  console.log(`    Brotli:    ${formatBytes(stats.totals.cssBrotli)} (${getCompressionRatio(stats.totals.css, stats.totals.cssBrotli)} reduction)`);
  console.log('');
  
  const totalOriginal = stats.totals.js + stats.totals.css;
  const totalGzip = stats.totals.jsGzip + stats.totals.cssGzip;
  const totalBrotli = stats.totals.jsBrotli + stats.totals.cssBrotli;
  
  console.log(`  Total:       ${formatBytes(totalOriginal)}`);
  console.log(`    Gzip:      ${formatBytes(totalGzip)} (${getCompressionRatio(totalOriginal, totalGzip)} reduction)`);
  console.log(`    Brotli:    ${formatBytes(totalBrotli)} (${getCompressionRatio(totalOriginal, totalBrotli)} reduction)`);
  console.log('');
  
  // Display warnings
  if (stats.warnings.length > 0) {
    log('⚠️  Warnings:', colors.yellow);
    stats.warnings.forEach(warning => {
      log(`  • ${warning}`, colors.yellow);
    });
    console.log('');
  }
  
  // Display recommendations
  log('💡 Recommendations:', colors.blue);
  if (stats.totals.js > 1024 * 1024) {
    log('  • Consider implementing more aggressive code splitting', colors.blue);
  }
  if (stats.files.some(f => f.size > MAX_BUNDLE_SIZE)) {
    log('  • Some bundles exceed recommended size limits', colors.blue);
  }
  log('  • Enable Brotli compression on your server for best performance', colors.blue);
  log('  • Ensure proper cache headers are set for static assets', colors.blue);
  console.log('');
  
  log(`Build statistics saved to: ${STATS_FILE}`, colors.green);
}

/**
 * Main execution
 */
function main() {
  const startTime = Date.now();
  
  console.log('\n');
  log('🚀 Production Build Process', colors.bright + colors.green);
  console.log('');
  
  try {
    // Step 1: Clean
    cleanBuildDir();
    
    // Step 2: Build
    runBuild();
    
    // Step 3: Analyze
    const stats = analyzeBundleSizes();
    
    // Step 4: Summary
    displaySummary(stats);
    
    // Completion
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSection('✅ Build Complete');
    log(`Total time: ${duration}s`, colors.green);
    log(`Build output: ${BUILD_DIR}`, colors.blue);
    console.log('');
    
  } catch (error) {
    log('✗ Build process failed', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run the build process
main();
