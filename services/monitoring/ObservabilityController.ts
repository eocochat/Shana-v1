import { Request, Response } from 'express';
import { LogAggregator } from './LogAggregator';
import { ErrorTracker } from './ErrorTracker';
import { UsageAnalyticsEngine } from './UsageAnalyticsEngine';
import { ProviderMonitor } from './ProviderMonitor';
import { HealthCheckService } from './HealthCheckService';
import { AlertManager } from './AlertManager';

export class ObservabilityController {
  /**
   * GET /api/admin/observability/overview
   */
  public static getOverview(req: any, res: any) {
    try {
      const metrics = UsageAnalyticsEngine.getMetricsSummary();
      const health = HealthCheckService.getReport();
      
      // Calculate error rate in the last 100 requests
      const allRecords = UsageAnalyticsEngine.getRecords().slice(0, 100);
      const totalCount = allRecords.length;
      const failedCount = allRecords.filter(r => !r.success).length;
      const errorRate = totalCount > 0 ? parseFloat(((failedCount / totalCount) * 100).toFixed(1)) : 0.0;

      // Active sessions count (from in-memory simulated sessions or users)
      // We simulate 2 active users, 1 live interview right now
      const activeUsers = 3;
      const activeInterviews = 1;

      // Run automatic evaluation of alert rules on every summary pull
      try {
        AlertManager.evaluateAlertRules({
          avgApiLatency: metrics.latencyInternal,
          aiFailureRate: 100 - metrics.successRateOpenAI,
          queueBacklog: 4, // simulated baseline backlog
          workerAlive: true,
          storageAvailable: true,
          consecutiveLoginFailures: 0,
          abnormalTokenUsage: false
        });
      } catch (alertErr) {
        console.error('[Telemetry] Auto alert rules check failed:', alertErr);
      }

      return res.json({
        success: true,
        metrics: {
          activeUsers,
          activeInterviews,
          requestsPerMinute: metrics.requestsPerMinute,
          errorRate,
          paymentSuccessRate: metrics.successRateStripe,
          aiResponseLatencyMs: metrics.latencyOpenAI,
          systemStatus: health.components.api.status
        },
        alerts: AlertManager.getAlerts()
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/logs
   */
  public static getLogs(req: any, res: any) {
    try {
      const { startDate, endDate, service, severity, feature, sessionId, search } = req.query;
      const logs = LogAggregator.getLogs({
        startDate: startDate as string,
        endDate: endDate as string,
        service: service as string,
        severity: severity as string,
        feature: feature as string,
        sessionId: sessionId as string,
        search: search as string
      });

      return res.json({ success: true, logs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/admin/observability/logs/clear
   */
  public static clearLogs(req: any, res: any) {
    try {
      LogAggregator.clearLogs();
      LogAggregator.log('admin', 'info', 'observability', `System logs cleared by administrator ${req.adminUser?.firstName || 'Admin'}`);
      return res.json({ success: true, message: 'Logs cleared successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/errors
   */
  public static getErrors(req: any, res: any) {
    try {
      const errors = ErrorTracker.getErrors();
      return res.json({ success: true, errors });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * PUT /api/admin/observability/errors/:id
   */
  public static updateError(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status, impactLevel } = req.body;
      const updated = ErrorTracker.updateStatus(id, status, impactLevel);
      if (!updated) {
        return res.status(404).json({ error: 'Error incident not found.' });
      }
      LogAggregator.log(
        'admin',
        'info',
        'observability',
        `Error incident ${id} status updated to ${status} by admin ${req.adminUser?.firstName || 'Admin'}`
      );
      return res.json({ success: true, errorEvent: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * DELETE /api/admin/observability/errors/:id
   */
  public static deleteError(req: any, res: any) {
    try {
      const { id } = req.params;
      const deleted = ErrorTracker.deleteError(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Error incident not found.' });
      }
      LogAggregator.log('admin', 'info', 'observability', `Error incident ${id} archived by admin.`);
      return res.json({ success: true, message: 'Incident archived/deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/admin/observability/errors/clear
   */
  public static clearAllErrors(req: any, res: any) {
    try {
      ErrorTracker.clearAll();
      LogAggregator.log('admin', 'info', 'observability', 'All error logs purged by administrator.');
      return res.json({ success: true, message: 'All errors cleared.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/usage
   */
  public static getUsage(req: any, res: any) {
    try {
      const summary = UsageAnalyticsEngine.getMetricsSummary();
      const records = UsageAnalyticsEngine.getRecords();
      const percentiles = UsageAnalyticsEngine.getPerformancePercentiles();
      const aiSummaries = ProviderMonitor.getAISummaries();
      return res.json({
        success: true,
        summary,
        records,
        percentiles,
        aiSummaries
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/stripe
   */
  public static getStripeEvents(req: any, res: any) {
    try {
      const events = ProviderMonitor.getStripeEvents();
      return res.json({ success: true, events });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/openai
   */
  public static getOpenAIEvents(req: any, res: any) {
    try {
      const events = ProviderMonitor.getOpenAIEvents();
      return res.json({ success: true, events });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/health
   */
  public static getHealth(req: any, res: any) {
    try {
      const report = HealthCheckService.getReport();
      return res.json({ success: true, report });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // --- TESTS SIMULATORS ---

  /**
   * TEST 1 Trigger: POST /api/admin/observability/test-error
   */
  public static triggerTestError(req: any, res: any) {
    try {
      const err = ErrorTracker.track(
        'frontend',
        'ReferenceError: window is not defined inside server SSR render context',
        'high',
        'ReferenceError: window is not defined\n    at SSRRender (src/entry-server.tsx:15:3)\n    at renderToString (node_modules/react-dom/server.js:42:15)'
      );
      LogAggregator.log('system', 'error', 'ssr-render', 'ReferenceError: window is not defined inside server context');
      return res.json({ success: true, errorEvent: err });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * TEST 2 Trigger: POST /api/admin/observability/test-stripe-fail
   */
  public static triggerTestStripeFail(req: any, res: any) {
    try {
      const evt = ProviderMonitor.trackStripeEvent('webhook_failed', 'failed', undefined, {
        failureReason: 'Signature mismatch: expected t=1716294723 but payload timestamp was t=1716298323',
        deliveryTimeMs: 120
      });
      ErrorTracker.track('payment', 'Stripe Webhook Signature Verification Failed: Drifting Timestamp', 'medium');
      LogAggregator.log('stripe', 'error', 'webhooks', 'Stripe webhook signature validation failed. Event payload rejected.');
      UsageAnalyticsEngine.trackCall('stripe', '/api/payment/webhook', 120, false, undefined, 0.01);
      return res.json({ success: true, event: evt });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * TEST 3 Trigger: POST /api/admin/observability/test-openai-spike
   */
  public static triggerTestOpenAISpike(req: any, res: any) {
    try {
      // Record a latency spike
      const spikeDurationMs = 6800; // 6.8 seconds spike
      const evt = ProviderMonitor.trackOpenAIEvent('/api/analyze-audio', 'gpt-4o', 1800, spikeDurationMs, true, {
        feature: 'audio-analysis-spike-test'
      });
      UsageAnalyticsEngine.trackCall('openai', '/api/analyze-audio', spikeDurationMs, true, 1800);
      LogAggregator.log(
        'openai',
        'warning',
        'audio-analysis',
        `Latency warning: OpenAI response took ${spikeDurationMs}ms (threshold 3000ms exceeded).`
      );
      return res.json({ success: true, event: evt });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * GET /api/admin/observability/alerts
   */
  public static getAlerts(req: any, res: any) {
    try {
      const alerts = AlertManager.getAlerts();
      return res.json({ success: true, alerts });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * PUT /api/admin/observability/alerts/:id
   */
  public static updateAlert(req: any, res: any) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = AlertManager.updateStatus(id, status, req.adminUser?.firstName || 'Admin');
      if (!updated) {
        return res.status(404).json({ error: 'Alert not found.' });
      }
      LogAggregator.log('admin', 'info', 'observability', `System alert ${id} status updated to ${status} by admin.`);
      return res.json({ success: true, alert: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * POST /api/admin/observability/alerts/clear
   */
  public static clearAllAlerts(req: any, res: any) {
    try {
      AlertManager.clearAllAlerts();
      LogAggregator.log('admin', 'info', 'observability', 'All system alerts cleared/purged by admin.');
      return res.json({ success: true, message: 'All system alerts cleared.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
