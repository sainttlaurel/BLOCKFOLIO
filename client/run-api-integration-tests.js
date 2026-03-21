#!/usr/bin/env node

/**
 * Simple test runner for API integration tests
 */

const { execSync } = require('child_process');

try {
  console.log('Running API Integration Tests...\n');
  
  const result = execSync(
    'npm test -- --testPathPattern=api.integration.test.js --watchAll=false --ci --silent',
    { 
      cwd: __dirname,
      encoding: 'utf-8',
      stdio: 'inherit'
    }
  );
  
  console.log('\n✓ API Integration Tests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n✗ API Integration Tests failed');
  console.error(error.message);
  process.exit(1);
}
