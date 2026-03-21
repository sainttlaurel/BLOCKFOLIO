#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * 
 * Generates detailed bundle analysis reports including:
 * - Visual bundle composition
 * - Dependency tree analysis
 * - Duplicate dependency detection
 * - Size recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
 * Run bundle analysis
 */
function analyzeBundles() {
  logSection('📊 Bundle Analysis');
  
  log('Building with bundle analyzer...', colors.blue);
  
  try {
    // Set environment variable to enable bundle analyzer
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      ANALYZE_BUNDLE: 'true',
      GENERATE_SOURCEMAP: 'true'
    };
    
    // Run build with analyzer
    execSync('npm run build', {
      stdio: 'inherit',
      env
    });
    
    log('✓ Bundle analysis complete', colors.green);
    log('\nBundle report generated at: build/bundle-report.html', colors.blue);
    log('Bundle stats saved at: build/bundle-stats.json', colors.blue);
    
    // Check if report exists and offer to open it
    const reportPath = path.join(__dirname, '../build/bundle-report.html');
    if (fs.existsSync(reportPath)) {
      log('\nTo view the report, open build/bundle-report.html in your browser', colors.yellow);
    }
    
  } catch (error) {
    log('✗ Bundle analysis failed', colors.red);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Analyze package.json dependencies
 */
function analyzeDependencies() {
  logSection('📦 Dependency Analysis');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  
  log(`Production Dependencies: ${Object.keys(deps).length}`, colors.blue);
  log(`Development Dependencies: ${Object.keys(devDeps).length}`, colors.blue);
  console.log('');
  
  // Identify large dependencies
  log('Large Dependencies (potential optimization targets):', colors.yellow);
  const largeDeps = [
    'chart.js',
    'react-chartjs-2',
    'd3',
    'moment',
    'lodash'
  ];
  
  largeDeps.forEach(dep => {
    if (deps[dep]) {
      log(`  • ${dep} - Consider lazy loading or alternatives`, colors.yellow);
    }
  });
  console.log('');
  
  // Recommendations
  log('💡 Optimization Recommendations:', colors.blue);
  log('  • Use dynamic imports for heavy libraries', colors.blue);
  log('  • Consider lighter alternatives (e.g., date-fns instead of moment)', colors.blue);
  log('  • Remove unused dependencies', colors.blue);
  log('  • Use tree-shakeable imports (e.g., lodash-es)', colors.blue);
}

/**
 * Check for duplicate dependencies
 */
function checkDuplicates() {
  logSection('🔍 Checking for Duplicate Dependencies');
  
  try {
    log('Running npm dedupe check...', colors.blue);
    const output = execSync('npm ls --all --json', { encoding: 'utf8' });
    const tree = JSON.parse(output);
    
    // Simple duplicate detection
    const allDeps = new Map();
    const duplicates = new Set();
    
    function traverse(node, path = []) {
      if (node.dependencies) {
        Object.entries(node.dependencies).forEach(([name, info]) => {
          const version = info.version;
          const key = `${name}@${version}`;
          
          if (allDeps.has(name) && allDeps.get(name) !== version) {
            duplicates.add(name);
          }
          allDeps.set(name, version);
          
          traverse(info, [...path, name]);
        });
      }
    }
    
    traverse(tree);
    
    if (duplicates.size > 0) {
      log(`Found ${duplicates.size} potential duplicate dependencies:`, colors.yellow);
      duplicates.forEach(dep => {
        log(`  • ${dep}`, colors.yellow);
      });
      log('\nRun "npm dedupe" to optimize', colors.blue);
    } else {
      log('✓ No duplicate dependencies found', colors.green);
    }
    
  } catch (error) {
    log('Could not check for duplicates', colors.yellow);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('\n');
  log('🔬 Bundle Analysis Tool', colors.bright + colors.green);
  console.log('');
  
  try {
    analyzeDependencies();
    checkDuplicates();
    analyzeBundles();
    
    logSection('✅ Analysis Complete');
    console.log('');
    
  } catch (error) {
    log('✗ Analysis failed', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run analysis
main();
