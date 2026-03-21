#!/usr/bin/env node

/**
 * Production Deployment Script
 * 
 * Handles deployment preparation including:
 * - Build verification
 * - Asset optimization verification
 * - Deployment checklist
 * - Environment validation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.blue);
  console.log('='.repeat(60) + '\n');
}

/**
 * Check if build directory exists
 */
function checkBuildExists() {
  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) {
    log('✗ Build directory not found', colors.red);
    log('Run "npm run build:prod" first', colors.yellow);
    return false;
  }
  log('✓ Build directory exists', colors.green);
  return true;
}

/**
 * Verify critical files exist
 */
function verifyCriticalFiles() {
  logSection('📋 Verifying Critical Files');
  
  const buildDir = path.join(__dirname, '../build');
  const criticalFiles = [
    'index.html',
    'static/js',
    'static/css'
  ];
  
  let allExist = true;
  
  criticalFiles.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.existsSync(filePath)) {
      log(`✓ ${file}`, colors.green);
    } else {
      log(`✗ ${file} missing`, colors.red);
      allExist = false;
    }
  });
  
  return allExist;
}

/**
 * Check for compressed assets
 */
function checkCompression() {
  logSection('🗜️  Checking Asset Compression');
  
  const buildDir = path.join(__dirname, '../build');
  const staticDir = path.join(buildDir, 'static');
  
  let gzipCount = 0;
  let brotliCount = 0;
  
  function countCompressed(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        countCompressed(filePath);
      } else {
        if (file.endsWith('.gz')) gzipCount++;
        if (file.endsWith('.br')) brotliCount++;
      }
    });
  }
  
  countCompressed(staticDir);
  
  log(`Gzip files: ${gzipCount}`, gzipCount > 0 ? colors.green : colors.yellow);
  log(`Brotli files: ${brotliCount}`, brotliCount > 0 ? colors.green : colors.yellow);
  
  if (gzipCount === 0 && brotliCount === 0) {
    log('⚠️  No compressed assets found', colors.yellow);
    log('Compression may not be enabled', colors.yellow);
    return false;
  }
  
  return true;
}

/**
 * Validate environment configuration
 */
function validateEnvironment() {
  logSection('🔧 Validating Environment Configuration');
  
  const envProdPath = path.join(__dirname, '../.env.production');
  
  if (!fs.existsSync(envProdPath)) {
    log('⚠️  .env.production not found', colors.yellow);
    log('Using default environment variables', colors.yellow);
    return true;
  }
  
  log('✓ .env.production exists', colors.green);
  
  // Read and validate environment variables
  const envContent = fs.readFileSync(envProdPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'REACT_APP_API_URL'
  ];
  
  let allPresent = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      log(`✓ ${varName} configured`, colors.green);
    } else {
      log(`⚠️  ${varName} not found`, colors.yellow);
      allPresent = false;
    }
  });
  
  return allPresent;
}

/**
 * Display deployment checklist
 */
function displayChecklist() {
  logSection('✅ Deployment Checklist');
  
  const checklist = [
    'Build completed successfully',
    'Bundle sizes are within limits',
    'Assets are compressed (gzip/brotli)',
    'Source maps are generated (if needed)',
    'Environment variables are configured',
    'API endpoints are set to production URLs',
    'Service worker is enabled',
    'Cache headers are configured on server',
    'HTTPS is enabled',
    'CDN is configured (if applicable)',
    'Error tracking is set up',
    'Analytics are configured',
    'Performance monitoring is enabled'
  ];
  
  log('Before deploying, ensure:', colors.blue);
  checklist.forEach((item, index) => {
    log(`  ${index + 1}. ${item}`, colors.blue);
  });
  console.log('');
}

/**
 * Display server configuration recommendations
 */
function displayServerConfig() {
  logSection('⚙️  Server Configuration Recommendations');
  
  log('Nginx Configuration Example:', colors.bright);
  console.log(`
# Enable Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript 
           application/x-javascript application/xml+rss 
           application/json application/javascript;

# Enable Brotli compression (if module available)
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript 
             application/x-javascript application/xml+rss 
             application/json application/javascript;

# Cache static assets
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache index.html with short expiry
location / {
    expires 5m;
    add_header Cache-Control "public, must-revalidate";
    try_files $uri $uri/ /index.html;
}

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
  `);
  
  log('Apache Configuration Example:', colors.bright);
  console.log(`
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
    AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>

# Cache static assets
<FilesMatch "\\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

# Cache HTML with short expiry
<FilesMatch "\\.html$">
    Header set Cache-Control "max-age=300, public, must-revalidate"
</FilesMatch>

# Enable rewrite for SPA
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
  `);
}

/**
 * Generate deployment report
 */
function generateReport() {
  logSection('📄 Generating Deployment Report');
  
  const buildDir = path.join(__dirname, '../build');
  const statsFile = path.join(buildDir, 'build-stats.json');
  const reportFile = path.join(buildDir, 'deployment-report.txt');
  
  let report = 'DEPLOYMENT REPORT\n';
  report += '='.repeat(60) + '\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add build stats if available
  if (fs.existsSync(statsFile)) {
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    report += 'BUILD STATISTICS\n';
    report += '-'.repeat(60) + '\n';
    report += `Total JS: ${formatBytes(stats.totals.js)}\n`;
    report += `Total CSS: ${formatBytes(stats.totals.css)}\n`;
    report += `JS (Gzip): ${formatBytes(stats.totals.jsGzip)}\n`;
    report += `CSS (Gzip): ${formatBytes(stats.totals.cssGzip)}\n`;
    report += `JS (Brotli): ${formatBytes(stats.totals.jsBrotli)}\n`;
    report += `CSS (Brotli): ${formatBytes(stats.totals.cssBrotli)}\n\n`;
    
    if (stats.warnings.length > 0) {
      report += 'WARNINGS\n';
      report += '-'.repeat(60) + '\n';
      stats.warnings.forEach(warning => {
        report += `• ${warning}\n`;
      });
      report += '\n';
    }
  }
  
  fs.writeFileSync(reportFile, report);
  log(`✓ Deployment report saved to: ${reportFile}`, colors.green);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main execution
 */
function main() {
  console.log('\n');
  log('🚀 Production Deployment Preparation', colors.bright + colors.green);
  console.log('');
  
  try {
    // Check build exists
    if (!checkBuildExists()) {
      process.exit(1);
    }
    
    // Verify files
    const filesOk = verifyCriticalFiles();
    
    // Check compression
    const compressionOk = checkCompression();
    
    // Validate environment
    const envOk = validateEnvironment();
    
    // Generate report
    generateReport();
    
    // Display checklist
    displayChecklist();
    
    // Display server config
    displayServerConfig();
    
    // Final status
    logSection('📊 Deployment Readiness');
    
    if (filesOk && compressionOk && envOk) {
      log('✅ Build is ready for deployment', colors.green);
    } else {
      log('⚠️  Some checks failed - review warnings above', colors.yellow);
    }
    
    console.log('');
    log('Next steps:', colors.blue);
    log('  1. Review the deployment checklist', colors.blue);
    log('  2. Configure your web server (see examples above)', colors.blue);
    log('  3. Deploy the build directory to your server', colors.blue);
    log('  4. Test the deployed application', colors.blue);
    log('  5. Monitor performance and errors', colors.blue);
    console.log('');
    
  } catch (error) {
    log('✗ Deployment preparation failed', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run deployment preparation
main();
