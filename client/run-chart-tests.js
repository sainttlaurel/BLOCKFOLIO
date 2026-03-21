// Simple test runner for chart component tests
const { execSync } = require('child_process');

try {
  console.log('Running chart component tests...\n');
  
  const result = execSync(
    'npm test -- --testPathPattern=chartComponents --watchAll=false --verbose',
    { 
      stdio: 'inherit',
      env: { ...process.env, CI: 'true' }
    }
  );
  
  console.log('\nTests completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('\nTest execution failed');
  process.exit(1);
}
