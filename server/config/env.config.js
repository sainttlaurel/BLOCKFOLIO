/**
 * Environment Configuration and Validation Module
 * 
 * This module handles environment-specific configuration loading,
 * validation, and secure management of sensitive data.
 */

const path = require('path');
const fs = require('fs');

/**
 * Environment configuration schema
 * Defines required and optional environment variables with validation rules
 */
const configSchema = {
  // Server Configuration
  NODE_ENV: {
    required: true,
    type: 'string',
    enum: ['development', 'staging', 'production'],
    default: 'development'
  },
  PORT: {
    required: true,
    type: 'number',
    default: 5000,
    validate: (value) => value > 0 && value < 65536
  },
  HOST: {
    required: false,
    type: 'string',
    default: 'localhost'
  },

  // JWT Configuration
  JWT_SECRET: {
    required: true,
    type: 'string',
    sensitive: true,
    validate: (value, env) => {
      if (env === 'production' && value.includes('REPLACE_WITH')) {
        throw new Error('JWT_SECRET must be replaced with a secure value in production');
      }
      if (env === 'production' && value.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
      }
      return true;
    }
  },
  JWT_EXPIRATION: {
    required: false,
    type: 'string',
    default: '7d'
  },

  // Database Configuration
  DB_PATH: {
    required: true,
    type: 'string',
    default: './database/coinnova.db'
  },
  DB_BACKUP_PATH: {
    required: false,
    type: 'string',
    default: './database/coinnova.db.backup'
  },

  // CoinGecko API Configuration
  COINGECKO_API_URL: {
    required: true,
    type: 'string',
    default: 'https://api.coingecko.com/api/v3'
  },
  COINGECKO_API_KEY: {
    required: false,
    type: 'string',
    sensitive: true,
    validate: (value, env) => {
      if (env === 'production' && (!value || value.includes('REPLACE_WITH'))) {
        console.warn('⚠️  WARNING: COINGECKO_API_KEY not set for production. Rate limits may apply.');
      }
      return true;
    }
  },
  COINGECKO_RATE_LIMIT: {
    required: false,
    type: 'number',
    default: 50
  },

  // AI Service Configuration
  AI_SERVICE_ENABLED: {
    required: false,
    type: 'boolean',
    default: false
  },
  AI_SERVICE_URL: {
    required: false,
    type: 'string',
    default: 'http://localhost:5001'
  },

  // CORS Configuration
  CORS_ORIGIN: {
    required: true,
    type: 'string',
    validate: (value, env) => {
      if (env === 'production' && value.includes('localhost')) {
        throw new Error('CORS_ORIGIN must not use localhost in production');
      }
      return true;
    }
  },
  CORS_CREDENTIALS: {
    required: false,
    type: 'boolean',
    default: true
  },

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: {
    required: false,
    type: 'number',
    default: 900000
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: false,
    type: 'number',
    default: 100
  },

  // Logging
  LOG_LEVEL: {
    required: false,
    type: 'string',
    enum: ['debug', 'info', 'warn', 'error'],
    default: 'info'
  },
  LOG_FILE: {
    required: false,
    type: 'string',
    default: './logs/app.log'
  },

  // Security
  HELMET_ENABLED: {
    required: false,
    type: 'boolean',
    default: true
  },
  BCRYPT_ROUNDS: {
    required: false,
    type: 'number',
    default: 10,
    validate: (value) => value >= 10 && value <= 15
  }
};

/**
 * Type conversion utilities
 */
const typeConverters = {
  string: (value) => String(value),
  number: (value) => {
    const num = Number(value);
    if (isNaN(num)) throw new Error(`Invalid number: ${value}`);
    return num;
  },
  boolean: (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`Invalid boolean: ${value}`);
  }
};

/**
 * Load environment-specific configuration file
 */
function loadEnvFile(environment) {
  const envFile = path.resolve(process.cwd(), `.env.${environment}`);
  
  if (!fs.existsSync(envFile)) {
    console.warn(`⚠️  Environment file not found: ${envFile}`);
    return {};
  }

  try {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return envVars;
  } catch (error) {
    console.error(`❌ Error loading environment file: ${error.message}`);
    return {};
  }
}

/**
 * Validate a single configuration value
 */
function validateConfigValue(key, value, schema, environment) {
  const config = schema[key];
  if (!config) return value;

  // Type conversion
  let convertedValue = value;
  if (value !== undefined && value !== null && config.type) {
    try {
      convertedValue = typeConverters[config.type](value);
    } catch (error) {
      throw new Error(`${key}: ${error.message}`);
    }
  }

  // Enum validation
  if (config.enum && !config.enum.includes(convertedValue)) {
    throw new Error(`${key} must be one of: ${config.enum.join(', ')}`);
  }

  // Custom validation
  if (config.validate) {
    try {
      config.validate(convertedValue, environment);
    } catch (error) {
      throw new Error(`${key}: ${error.message}`);
    }
  }

  return convertedValue;
}

/**
 * Validate and load configuration
 */
function validateConfig(envVars, environment) {
  const config = {};
  const errors = [];
  const warnings = [];

  // Validate each schema entry
  for (const [key, schema] of Object.entries(configSchema)) {
    try {
      let value = envVars[key];

      // Check required fields
      if (schema.required && (value === undefined || value === null || value === '')) {
        if (schema.default !== undefined) {
          value = schema.default;
          warnings.push(`${key} not set, using default: ${schema.sensitive ? '***' : value}`);
        } else {
          errors.push(`${key} is required but not set`);
          continue;
        }
      }

      // Use default if not provided
      if ((value === undefined || value === null || value === '') && schema.default !== undefined) {
        value = schema.default;
      }

      // Validate and convert
      if (value !== undefined && value !== null && value !== '') {
        config[key] = validateConfigValue(key, value, configSchema, environment);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { config, errors, warnings };
}

/**
 * Get sanitized configuration for logging (hide sensitive values)
 */
function getSanitizedConfig(config) {
  const sanitized = { ...config };
  
  for (const [key, schema] of Object.entries(configSchema)) {
    if (schema.sensitive && sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Initialize and validate environment configuration
 */
function initializeConfig() {
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`\n🔧 Initializing ${environment} environment configuration...`);

  // Load environment-specific file
  const envFileVars = loadEnvFile(environment);

  // Merge with process.env (process.env takes precedence)
  const mergedVars = { ...envFileVars, ...process.env };

  // Validate configuration
  const { config, errors, warnings } = validateConfig(mergedVars, environment);

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  // Handle errors
  if (errors.length > 0) {
    console.error('\n❌ Configuration Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    throw new Error('Configuration validation failed. Please check your environment variables.');
  }

  // Display sanitized configuration
  console.log('\n✅ Configuration loaded successfully:');
  const sanitized = getSanitizedConfig(config);
  console.log(JSON.stringify(sanitized, null, 2));

  // Security check for production
  if (environment === 'production') {
    console.log('\n🔒 Running production security checks...');
    performSecurityChecks(config);
  }

  return config;
}

/**
 * Perform security checks for production environment
 */
function performSecurityChecks(config) {
  const securityIssues = [];

  // Check JWT secret strength
  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    securityIssues.push('JWT_SECRET should be at least 32 characters for production');
  }

  // Check CORS origin
  if (config.CORS_ORIGIN && config.CORS_ORIGIN.includes('localhost')) {
    securityIssues.push('CORS_ORIGIN should not include localhost in production');
  }

  // Check bcrypt rounds
  if (config.BCRYPT_ROUNDS < 12) {
    securityIssues.push('BCRYPT_ROUNDS should be at least 12 for production');
  }

  // Check helmet is enabled
  if (!config.HELMET_ENABLED) {
    securityIssues.push('HELMET_ENABLED should be true for production');
  }

  if (securityIssues.length > 0) {
    console.warn('\n⚠️  Security Warnings:');
    securityIssues.forEach(issue => console.warn(`   - ${issue}`));
  } else {
    console.log('   ✅ All security checks passed');
  }
}

/**
 * Get current environment
 */
function getEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * Check if running in production
 */
function isProduction() {
  return getEnvironment() === 'production';
}

/**
 * Check if running in development
 */
function isDevelopment() {
  return getEnvironment() === 'development';
}

/**
 * Check if running in staging
 */
function isStaging() {
  return getEnvironment() === 'staging';
}

module.exports = {
  initializeConfig,
  getEnvironment,
  isProduction,
  isDevelopment,
  isStaging,
  getSanitizedConfig
};
