/**
 * PM2 Ecosystem Configuration
 * 
 * This file configures PM2 process manager for different environments
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env staging
 *   pm2 start ecosystem.config.js --env development
 */

module.exports = {
  apps: [
    {
      name: 'coinnova-api',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'cluster',
      
      // Environment-specific configuration
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Process management
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      
      // Monitoring
      instance_var: 'INSTANCE_ID',
      
      // Environment variables from file
      env_file: '.env',
    },
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/coinnova.git',
      path: '/var/www/coinnova',
      'post-deploy': 'npm run install-all && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': './scripts/pre-deploy-check.sh production',
      'post-setup': 'npm run install-all',
    },
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/staging',
      repo: 'git@github.com:your-org/coinnova.git',
      path: '/var/www/coinnova-staging',
      'post-deploy': 'npm run install-all && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-deploy-local': './scripts/pre-deploy-check.sh staging',
      'post-setup': 'npm run install-all',
    },
    development: {
      user: 'deploy',
      host: ['dev-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/coinnova.git',
      path: '/var/www/coinnova-dev',
      'post-deploy': 'npm run install-all && npm run build && pm2 reload ecosystem.config.js --env development',
      'post-setup': 'npm run install-all',
    },
  },
};
