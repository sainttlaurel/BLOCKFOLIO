# Server Configuration

## Overview

This directory contains server configuration modules for the CoinNova trading platform.

## Files

### `env.config.js`

Environment configuration and validation module that:

- Loads environment-specific configuration files
- Validates all configuration variables
- Performs type conversion and checking
- Enforces security requirements for production
- Sanitizes sensitive data in logs
- Provides environment detection utilities

### `database.js`

Database configuration and initialization module for SQLite.

## Usage

### Loading Configuration

```javascript
const { initializeConfig } = require('./config/env.config');

// Initialize and validate configuration
const config = initializeConfig();

// Use configuration values
const port = config.PORT;
const jwtSecret = config.JWT_SECRET;
```

### Environment Detection

```javascript
const { 
  getEnvironment, 
  isProduction, 
  isDevelopment, 
  isStaging 
} = require('./config/env.config');

if (isProduction()) {
  // Production-specific logic
}

if (isDevelopment()) {
  // Development-specific logic
}

const env = getEnvironment(); // 'development', 'staging', or 'production'
```

### Configuration Sanitization

```javascript
const { getSanitizedConfig } = require('./config/env.config');

// Get configuration with sensitive values redacted
const sanitized = getSanitizedConfig(config);
console.log(sanitized); // Sensitive values shown as '***REDACTED***'
```

## Configuration Schema

The configuration schema defines all supported environment variables with:

- **Type**: string, number, or boolean
- **Required**: whether the variable is required
- **Default**: default value if not provided
- **Enum**: allowed values (for string types)
- **Validate**: custom validation function
- **Sensitive**: whether to redact in logs

### Adding New Configuration Variables

To add a new configuration variable:

1. Add to the `configSchema` object in `env.config.js`:

```javascript
NEW_VARIABLE: {
  required: true,
  type: 'string',
  default: 'default_value',
  validate: (value, env) => {
    // Custom validation logic
    return true;
  }
}
```

2. Add to environment files (`.env.development`, `.env.staging`, `.env.production`)

3. Update documentation in `ENVIRONMENT_CONFIGURATION.md`

## Validation

Configuration validation occurs automatically when `initializeConfig()` is called. The validation process:

1. Loads environment-specific file (`.env.{NODE_ENV}`)
2. Merges with system environment variables
3. Validates each variable against schema
4. Performs type conversion
5. Checks custom validation rules
6. Runs production security checks
7. Returns validated configuration object

### Validation Errors

If validation fails, the module throws an error with details about:

- Missing required variables
- Invalid types
- Failed validation rules
- Security issues (production only)

### Validation Warnings

Non-critical issues are logged as warnings:

- Using default values
- Missing optional variables
- Security recommendations

## Security

### Production Security Checks

When running in production, additional security checks are performed:

- JWT secret strength (min 32 characters)
- CORS origin validation (no localhost)
- Bcrypt rounds (min 12)
- Helmet security middleware enabled

### Sensitive Data Protection

Variables marked as `sensitive: true` in the schema are:

- Redacted in log output
- Never displayed in error messages
- Sanitized when using `getSanitizedConfig()`

Sensitive variables include:

- `JWT_SECRET`
- `COINGECKO_API_KEY`
- Any API keys or secrets

## Environment Files

Configuration is loaded from environment-specific files:

- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### File Priority

1. Environment-specific file (`.env.{NODE_ENV}`)
2. System environment variables (highest priority)

System environment variables always override file-based configuration.

## Best Practices

1. **Never commit secrets** - Use placeholders in tracked files
2. **Use strong secrets** - Generate random strings for production
3. **Validate before deployment** - Run validation scripts
4. **Use environment variables** - Override file config with env vars
5. **Document changes** - Update docs when adding variables
6. **Test all environments** - Validate dev, staging, and production
7. **Rotate secrets regularly** - Change secrets every 90 days
8. **Monitor configuration** - Log configuration loading and errors

## Troubleshooting

### "Configuration validation failed"

Check the error messages for specific issues. Common causes:

- Missing required variables
- Invalid variable types
- Failed validation rules
- Security check failures

### "Environment file not found"

The module couldn't find `.env.{NODE_ENV}`. Ensure:

- File exists in the project root
- NODE_ENV is set correctly
- File has correct permissions

### "JWT_SECRET must be replaced"

Production environment detected placeholder JWT_SECRET. Generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Related Documentation

- [Environment Configuration Guide](../../ENVIRONMENT_CONFIGURATION.md)
- [Environment Quick Start](../../ENVIRONMENT_QUICKSTART.md)
- [Environment Setup Tool](../../scripts/env-setup.js)

## Support

For configuration issues:

1. Check error messages and logs
2. Review this documentation
3. Run validation: `npm run env:validate`
4. Use setup tool: `npm run env:setup`
5. Contact development team
