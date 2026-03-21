#!/usr/bin/env node

/**
 * Environment Setup and Validation Script
 * 
 * This script helps with environment configuration setup, validation,
 * and switching between different environments.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Generate a secure random secret
 */
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check if environment file exists
 */
function envFileExists(environment) {
  const envFile = path.resolve(process.cwd(), `.env.${environment}`);
  return fs.existsSync(envFile);
}

/**
 * Read environment file
 */
function readEnvFile(environment) {
  const envFile = path.resolve(process.cwd(), `.env.${environment}`);
  
  if (!fs.existsSync(envFile)) {
    return null;
  }

  const content = fs.readFileSync(envFile, 'utf8');
  const vars = {};

  content.split('\n').forEach(line => {
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      vars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return vars;
}

/**
 * Write environment file
 */
function writeEnvFile(environment, vars) {
  const envFile = path.resolve(process.cwd(), `.env.${environment}`);
  
  let content = `# ${environment.charAt(0).toUpperCase() + environment.slice(1)} Environment Configuration\n`;
  content += `# Generated: ${new Date().toISOString()}\n\n`;

  for (const [key, value] of Object.entries(vars)) {
    content += `${key}=${value}\n`;
  }

  fs.writeFileSync(envFile, content, 'utf8');
  log(`✅ Environment file created: ${envFile}`, 'green');
}

/**
 * Validate environment configuration
 */
function validateEnvironment(environment) {
  log(`\n🔍 Validating ${environment} environment...`, 'blue');

  const vars = readEnvFile(environment);
  if (!vars) {
    log(`❌ Environment file not found: .env.${environment}`, 'red');
    return false;
  }

  const issues = [];
  const warnings = [];

  // Check NODE_ENV
  if (vars.NODE_ENV !== environment) {
    issues.push(`NODE_ENV should be "${environment}" but is "${vars.NODE_ENV}"`);
  }

  // Check JWT_SECRET
  if (!vars.JWT_SECRET) {
    issues.push('JWT_SECRET is not set');
  } else if (vars.JWT_SECRET.includes('REPLACE_WITH')) {
    issues.push('JWT_SECRET contains placeholder text');
  } else if (environment === 'production' && vars.JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET should be at least 32 characters in production');
  }

  // Check CORS_ORIGIN
  if (!vars.CORS_ORIGIN) {
    issues.push('CORS_ORIGIN is not set');
  } else if (environment === 'production' && vars.CORS_ORIGIN.includes('localhost')) {
    issues.push('CORS_ORIGIN should not use localhost in production');
  }

  // Check API URLs
  if (!vars.REACT_APP_API_URL) {
    issues.push('REACT_APP_API_URL is not set');
  }

  // Check CoinGecko API key for production
  if (environment === 'production') {
    if (!vars.COINGECKO_API_KEY || vars.COINGECKO_API_KEY.includes('REPLACE_WITH')) {
      warnings.push('COINGECKO_API_KEY not set - rate limits may apply');
    }
  }

  // Check bcrypt rounds
  const bcryptRounds = parseInt(vars.BCRYPT_ROUNDS || '10');
  if (environment === 'production' && bcryptRounds < 12) {
    warnings.push('BCRYPT_ROUNDS should be at least 12 in production');
  }

  // Display results
  if (issues.length > 0) {
    log('\n❌ Configuration Issues:', 'red');
    issues.forEach(issue => log(`   - ${issue}`, 'red'));
  }

  if (warnings.length > 0) {
    log('\n⚠️  Configuration Warnings:', 'yellow');
    warnings.forEach(warning => log(`   - ${warning}`, 'yellow'));
  }

  if (issues.length === 0 && warnings.length === 0) {
    log('\n✅ Configuration is valid!', 'green');
    return true;
  }

  return issues.length === 0;
}

/**
 * Setup new environment
 */
async function setupEnvironment(environment) {
  log(`\n🔧 Setting up ${environment} environment...`, 'blue');

  if (envFileExists(environment)) {
    const overwrite = await question(`Environment file already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      log('Setup cancelled.', 'yellow');
      return;
    }
  }

  const vars = {};

  // Basic configuration
  vars.NODE_ENV = environment;
  vars.PORT = await question('Server port (5000): ') || '5000';
  vars.HOST = environment === 'production' ? '0.0.0.0' : 'localhost';

  // JWT configuration
  log('\n🔐 JWT Configuration', 'cyan');
  const generateJWT = await question('Generate secure JWT secret? (Y/n): ');
  if (generateJWT.toLowerCase() !== 'n') {
    vars.JWT_SECRET = generateSecret(64);
    log(`Generated JWT secret: ${vars.JWT_SECRET.substring(0, 20)}...`, 'green');
  } else {
    vars.JWT_SECRET = await question('Enter JWT secret: ');
  }
  vars.JWT_EXPIRATION = '7d';

  // Database configuration
  log('\n💾 Database Configuration', 'cyan');
  vars.DB_PATH = './database/coinnova.db';
  vars.DB_BACKUP_PATH = environment === 'production' 
    ? './database/backups/coinnova.db.backup'
    : './database/coinnova.db.backup';

  // CoinGecko API
  log('\n🌐 CoinGecko API Configuration', 'cyan');
  vars.COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
  vars.COINGECKO_API_KEY = await question('CoinGecko API key (optional): ') || '';
  vars.COINGECKO_RATE_LIMIT = environment === 'production' ? '200' : '50';

  // AI Service
  log('\n🤖 AI Service Configuration', 'cyan');
  const enableAI = await question('Enable AI service? (y/N): ');
  vars.AI_SERVICE_ENABLED = enableAI.toLowerCase() === 'y' ? 'true' : 'false';
  vars.AI_SERVICE_URL = environment === 'production'
    ? 'https://ai.coinnova.com'
    : 'http://localhost:5001';

  // CORS configuration
  log('\n🔒 CORS Configuration', 'cyan');
  const defaultOrigin = environment === 'production'
    ? 'https://coinnova.com'
    : 'http://localhost:3000';
  vars.CORS_ORIGIN = await question(`CORS origin (${defaultOrigin}): `) || defaultOrigin;
  vars.CORS_CREDENTIALS = 'true';

  // Rate limiting
  vars.RATE_LIMIT_WINDOW_MS = '900000';
  vars.RATE_LIMIT_MAX_REQUESTS = environment === 'production' ? '500' : '100';

  // Logging
  vars.LOG_LEVEL = environment === 'production' ? 'error' : 'debug';
  vars.LOG_FILE = `./logs/${environment}.log`;

  // Security
  vars.HELMET_ENABLED = 'true';
  vars.BCRYPT_ROUNDS = environment === 'production' ? '12' : '10';

  // Client configuration
  log('\n🖥️  Client Configuration', 'cyan');
  const defaultAPIUrl = environment === 'production'
    ? 'https://api.coinnova.com'
    : 'http://localhost:5000';
  vars.REACT_APP_API_URL = await question(`API URL (${defaultAPIUrl}): `) || defaultAPIUrl;
  vars.REACT_APP_COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
  vars.REACT_APP_ENABLE_ANALYTICS = environment === 'production' ? 'true' : 'false';
  vars.REACT_APP_ENABLE_ERROR_REPORTING = environment === 'production' ? 'true' : 'false';

  // Build configuration
  vars.GENERATE_SOURCEMAP = environment === 'production' ? 'false' : 'true';
  vars.INLINE_RUNTIME_CHUNK = environment === 'production' ? 'false' : 'true';
  if (environment === 'production') {
    vars.DROP_CONSOLE = 'true';
    vars.ENABLE_MINIFICATION = 'true';
    vars.ENABLE_GZIP = 'true';
    vars.ENABLE_BROTLI = 'true';
  }

  // Write environment file
  writeEnvFile(environment, vars);

  // Validate
  log('\n🔍 Validating configuration...', 'blue');
  validateEnvironment(environment);
}

/**
 * Switch environment
 */
async function switchEnvironment(environment) {
  log(`\n🔄 Switching to ${environment} environment...`, 'blue');

  if (!envFileExists(environment)) {
    log(`❌ Environment file not found: .env.${environment}`, 'red');
    const create = await question('Would you like to create it? (y/N): ');
    if (create.toLowerCase() === 'y') {
      await setupEnvironment(environment);
    }
    return;
  }

  // Copy environment file to .env
  const sourceFile = path.resolve(process.cwd(), `.env.${environment}`);
  const targetFile = path.resolve(process.cwd(), '.env');

  fs.copyFileSync(sourceFile, targetFile);
  log(`✅ Switched to ${environment} environment`, 'green');
  log(`   .env.${environment} → .env`, 'cyan');

  // Validate
  validateEnvironment(environment);
}

/**
 * Display menu
 */
async function displayMenu() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   CoinNova Environment Setup Tool     ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  log('\nOptions:', 'bright');
  log('  1. Setup new environment');
  log('  2. Switch environment');
  log('  3. Validate environment');
  log('  4. Generate JWT secret');
  log('  5. Exit');

  const choice = await question('\nSelect option (1-5): ');

  switch (choice) {
    case '1':
      const setupEnv = await question('Environment (development/staging/production): ');
      if (['development', 'staging', 'production'].includes(setupEnv)) {
        await setupEnvironment(setupEnv);
      } else {
        log('❌ Invalid environment', 'red');
      }
      break;

    case '2':
      const switchEnv = await question('Environment (development/staging/production): ');
      if (['development', 'staging', 'production'].includes(switchEnv)) {
        await switchEnvironment(switchEnv);
      } else {
        log('❌ Invalid environment', 'red');
      }
      break;

    case '3':
      const validateEnv = await question('Environment (development/staging/production): ');
      if (['development', 'staging', 'production'].includes(validateEnv)) {
        validateEnvironment(validateEnv);
      } else {
        log('❌ Invalid environment', 'red');
      }
      break;

    case '4':
      const secret = generateSecret(64);
      log('\n🔐 Generated JWT Secret:', 'green');
      log(secret, 'bright');
      log('\nAdd this to your .env file:', 'cyan');
      log(`JWT_SECRET=${secret}`, 'yellow');
      break;

    case '5':
      log('\n👋 Goodbye!', 'cyan');
      rl.close();
      return;

    default:
      log('❌ Invalid option', 'red');
  }

  // Show menu again
  await displayMenu();
}

// Main execution
if (require.main === module) {
  displayMenu().catch(error => {
    log(`\n❌ Error: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  });
}

module.exports = {
  generateSecret,
  validateEnvironment,
  setupEnvironment,
  switchEnvironment
};
