import { LogAggregator } from '../../services/monitoring/LogAggregator';
import { ErrorTracker } from '../../services/monitoring/ErrorTracker';
import { UsageAnalyticsEngine } from '../../services/monitoring/UsageAnalyticsEngine';

export class TelemetryService {
  /**
   * Log info events
   */
  static info(
    service: 'auth' | 'openai' | 'stripe' | 'database' | 'system' | 'admin' | 'interview' | 'telemetry',
    feature: string,
    message: string,
    sessionId?: string,
    metadata?: any
  ) {
    LogAggregator.log(service, 'info', feature, message, sessionId, metadata);
  }

  /**
   * Log warning events
   */
  static warn(
    service: 'auth' | 'openai' | 'stripe' | 'database' | 'system' | 'admin' | 'interview' | 'telemetry',
    feature: string,
    message: string,
    sessionId?: string,
    metadata?: any
  ) {
    LogAggregator.log(service, 'warning', feature, message, sessionId, metadata);
  }

  /**
   * Log and track standard errors
   */
  static error(
    service: 'auth' | 'openai' | 'stripe' | 'database' | 'system' | 'admin' | 'interview' | 'telemetry',
    feature: string,
    message: string,
    errorType: 'frontend' | 'backend' | 'api' | 'payment' | 'ai',
    impact: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    stack?: string,
    sessionId?: string,
    metadata?: any
  ) {
    LogAggregator.log(service, 'error', feature, message, sessionId, { ...metadata, stack });
    ErrorTracker.track(errorType, message, impact, stack);
  }

  /**
   * Log and track critical system-level errors
   */
  static critical(
    service: 'auth' | 'openai' | 'stripe' | 'database' | 'system' | 'admin' | 'interview' | 'telemetry',
    feature: string,
    message: string,
    errorType: 'frontend' | 'backend' | 'api' | 'payment' | 'ai',
    stack?: string,
    sessionId?: string,
    metadata?: any
  ) {
    LogAggregator.log(service, 'critical', feature, message, sessionId, { ...metadata, stack });
    ErrorTracker.track(errorType, message, 'critical', stack);
  }

  /**
   * Trace an external or internal API call duration and outcome
   */
  static trackApiCall(
    service: 'openai' | 'stripe' | 'internal' | 'session',
    endpoint: string,
    durationMs: number,
    success: boolean,
    tokensEstimated?: number,
    costEstimated?: number
  ) {
    UsageAnalyticsEngine.trackCall(service, endpoint, durationMs, success, tokensEstimated, costEstimated);
  }
}
export default TelemetryService;
