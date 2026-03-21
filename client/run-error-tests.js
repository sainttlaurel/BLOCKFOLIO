/**
 * Test runner script for error handling tests
 */

const { execSync } = require('child_process');

try {
  console.log('Running error handling and edge case tests...\n');
  
  const result = execSync(
    'npm test -- --testPathPattern="(dataManager.errorHandling|websocketService.errorHandling|errorHandling.test|inputValidation)" --watchAll=false --coverage=false',
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, CI: 'true' }
    }
  );
  
  console.log('\n✓ All error handling tests passed!');
  process.exit(0);
} catch (error) {
  console.error('\n✗ Some tests failed');
  process.exit(1);
}
