const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize environment configuration
const { initializeConfig } = require('./config/env.config');
const config = initializeConfig();

// Logging and monitoring
const logger = require('./utils/logger');
const performanceMonitor = require('./utils/performanceMonitor');
const { requestLogger, performanceTracker } = require('./middleware/requestLogger');
const { errorLogger, setupUnhandledRejectionHandler, setupUncaughtExceptionHandler } = require('./middleware/errorLogger');
const { validateContentType, preventParameterPollution } = require('./middleware/inputValidation');
const { monitorUnusualPatterns } = require('./middleware/securityAudit');
const { getTokenEndpoint } = require('./middleware/csrf');
const { getSecurityHeaders } = require('./utils/security');

// Setup global error handlers
setupUnhandledRejectionHandler();
setupUncaughtExceptionHandler();

const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const transactionRoutes = require('./routes/transactions');
const coinRoutes = require('./routes/coins');
const monitoringRoutes = require('./routes/monitoring');
const priceService = require('./services/priceService');

const app = express();
const PORT = config.PORT;

// Security middleware
if (config.HELMET_ENABLED) {
  app.use(helmet());
}

// Additional security headers
app.use((req, res, next) => {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  next();
});

app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: config.CORS_CREDENTIALS
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(validateContentType);
app.use(preventParameterPollution);
app.use(monitorUnusualPatterns);

// Request logging middleware
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/monitoring', monitoringRoutes);

// CSRF token endpoint
app.get('/api/csrf-token', getTokenEndpoint);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV,
    services: {
      database: 'connected',
      priceService: 'active',
      api: 'running'
    }
  });
});

// System info endpoint
app.get('/api/system', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.NODE_ENV
  });
});

// Error handling middleware
app.use(errorLogger);
app.use((err, req, res, next) => {
  logger.error('Application error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl
  });
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, config.HOST, () => {
  logger.info('CoinNova server started', {
    host: config.HOST,
    port: PORT,
    environment: config.NODE_ENV,
    helmet: config.HELMET_ENABLED,
    rateLimit: `${config.RATE_LIMIT_MAX_REQUESTS} requests per ${config.RATE_LIMIT_WINDOW_MS / 60000} minutes`
  });
  
  console.log(`\n🚀 CoinNova server running on ${config.HOST}:${PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`🔒 Security: Helmet ${config.HELMET_ENABLED ? 'enabled' : 'disabled'}`);
  console.log(`⏱️  Rate Limit: ${config.RATE_LIMIT_MAX_REQUESTS} requests per ${config.RATE_LIMIT_WINDOW_MS / 60000} minutes`);
  console.log(`📝 Logging: Active`);
  console.log(`📈 Monitoring: Active`);
  
  // Start performance monitoring
  performanceMonitor.startMonitoring();
  
  // Start price update service
  setTimeout(() => {
    priceService.startPriceUpdates();
    logger.info('Price update service started');
  }, 2000);
});

// Export config for use in other modules
module.exports = { app, config };