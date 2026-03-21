/**
 * Error Display Components Index
 * 
 * Exports all error display and recovery components for easy importing
 * throughout the application.
 */

// Main error display components
export { default as UserFriendlyErrorDisplay } from './UserFriendlyErrorDisplay';
export { default as ErrorNotificationSystem } from './ErrorNotificationSystem';
export { default as ErrorRecoveryPanel } from './ErrorRecoveryPanel';
export { default as ErrorStatusDashboard } from './ErrorStatusDashboard';

// Enhanced error boundaries
export {
  default as EnhancedErrorBoundary,
  EnhancedAppErrorBoundary,
  EnhancedTradingErrorBoundary,
  EnhancedChartErrorBoundary,
  withEnhancedErrorBoundary
} from './EnhancedErrorBoundary';

// Services
export { default as errorMessageService } from '../../services/errorMessageService';
export { default as errorPreventionService } from '../../services/errorPreventionService';