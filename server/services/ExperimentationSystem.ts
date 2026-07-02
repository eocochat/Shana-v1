import fs from "fs";
import path from "path";
import crypto from "crypto";
import { AuditLogger } from "../security/SecurityManager.js";

// ====================================================
// 1. DATA CONTRACTS & TYPES
// ====================================================

export type FlagStatus = "ON" | "OFF" | "CONTROLLED";
export type FlagEnvironment = "development" | "staging" | "production" | "all";

export interface ExperimentConfig {
  groupAConfig: Record<string, any>;
  groupBConfig: Record<string, any>;
  controlConfig: Record<string, any>;
  metricKeys: string[];
}

export interface FeatureFlag {
  id: string; // unique identifier (usually feature_name)
  feature_name: string;
  description: string;
  status: FlagStatus;
  target_users: string[]; // list of user emails or IDs
  rollout_percentage: number; // 0 to 100
  environment: FlagEnvironment;
  version: string;
  createdAt: string;
  isExperiment: boolean;
  experimentConfig?: ExperimentConfig;
}

export interface ExperimentMetricLog {
  id: string;
  userId: string;
  flagId: string;
  version: string;
  group: "A" | "B" | "control" | "none";
  metricKey: string;
  metricValue: number;
  sessionId?: string;
  timestamp: string;
}

export interface FlagEvaluationResult {
  enabled: boolean;
  group: "A" | "B" | "control" | "none";
  version: string;
  config: Record<string, any>;
}

export interface ExperimentSummary {
  flagId: string;
  version: string;
  totalLogs: number;
  groups: Record<string, {
    count: number;
    metrics: Record<string, {
      count: number;
      sum: number;
      avg: number;
    }>;
  }>;
}

export interface RollbackReasonLog {
  id: string;
  flagId: string;
  performedBy: string;
  reason: string;
  timestamp: string;
}

// ====================================================
// 2. STORAGE PATHS & PERSISTENCE CHANNELS
// ====================================================

const FLAGS_STORAGE_FILE = path.join(process.cwd(), "feature-flags-experiments.json");
const METRICS_STORAGE_FILE = path.join(process.cwd(), "experiments-metrics-history.json");
const ROLLBACKS_LOG_FILE = path.join(process.cwd(), "flag-rollbacks-history.json");

// ====================================================
// 3. CORE SYSTEM CLASS
// ====================================================

export class ExperimentationSystem {
  private static cachedFlags: FeatureFlag[] | null = null;
  private static cachedMetrics: ExperimentMetricLog[] | null = null;
  private static cachedRollbacks: RollbackReasonLog[] | null = null;

  // Initialize and Seed Defaults if file doesn't exist
  private static init() {
    if (!fs.existsSync(FLAGS_STORAGE_FILE)) {
      const defaultFlags: FeatureFlag[] = [
        {
          id: "voice_naturalizer",
          feature_name: "voice_naturalizer",
          description: "Enhances voice quality by removing static and normalizing levels",
          status: "CONTROLLED",
          target_users: ["eocochat@gmail.com", "admin@shana.ai"],
          rollout_percentage: 25,
          environment: "all",
          version: "1.2.0",
          createdAt: new Date().toISOString(),
          isExperiment: false
        },
        {
          id: "adaptive_scoring",
          feature_name: "adaptive_scoring",
          description: "Varies grading severity dynamically based on candidate background",
          status: "ON",
          target_users: [],
          rollout_percentage: 100,
          environment: "all",
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          isExperiment: false
        },
        {
          id: "prompt_evaluation_v2",
          feature_name: "prompt_evaluation_v2",
          description: "A/B testing standard evaluation prompts against optimized behavioral prompts",
          status: "CONTROLLED",
          target_users: [],
          rollout_percentage: 50,
          environment: "all",
          version: "2.1.0-beta",
          createdAt: new Date().toISOString(),
          isExperiment: true,
          experimentConfig: {
            groupAConfig: {
              promptVersion: "eval_v2.0_emotional_resonance",
              modelName: "gemini-1.5-flash",
              temperature: 0.3
            },
            groupBConfig: {
              promptVersion: "eval_v2.1_behavioral_metrics",
              modelName: "gemini-2.5-flash",
              temperature: 0.2
            },
            controlConfig: {
              promptVersion: "eval_legacy_baseline",
              modelName: "gemini-1.5-flash",
              temperature: 0.4
            },
            metricKeys: ["ips_improvement", "interview_completed", "latency_ms", "user_satisfaction"]
          }
        },
        {
          id: "ai_extended_insights",
          feature_name: "ai_extended_insights",
          description: "Generates extra weakness/strength analysis from speech text patterns",
          status: "CONTROLLED",
          target_users: ["beta-user@shana.ai"],
          rollout_percentage: 10,
          environment: "production",
          version: "1.4.2",
          createdAt: new Date().toISOString(),
          isExperiment: false
        },
        {
          id: "saas_plans",
          feature_name: "saas_plans",
          description: "Displays flexible multi-tier subscription plans for B2B accounts",
          status: "OFF",
          target_users: [],
          rollout_percentage: 0,
          environment: "all",
          version: "0.9.0-draft",
          createdAt: new Date().toISOString(),
          isExperiment: false
        },
        {
          id: "model_comparison_eval",
          feature_name: "model_comparison_eval",
          description: "A/B test model outputs: Gemini Flash vs OpenAI GPT-4o-mini",
          status: "CONTROLLED",
          target_users: [],
          rollout_percentage: 40,
          environment: "all",
          version: "3.0.0",
          createdAt: new Date().toISOString(),
          isExperiment: true,
          experimentConfig: {
            groupAConfig: {
              provider: "gemini",
              model: "gemini-2.5-flash"
            },
            groupBConfig: {
              provider: "openai",
              model: "gpt-4o-mini"
            },
            controlConfig: {
              provider: "mock",
              model: "mock-eval-engine"
            },
            metricKeys: ["ai_cost_cents", "latency_ms", "ips_improvement"]
          }
        }
      ];
      fs.writeFileSync(FLAGS_STORAGE_FILE, JSON.stringify(defaultFlags, null, 2), "utf8");
      this.cachedFlags = defaultFlags;
    }

    if (!fs.existsSync(METRICS_STORAGE_FILE)) {
      // Seed some initial analytics logs to make dashboards look realistic and gorgeous
      const seedMetrics: ExperimentMetricLog[] = [
        // Prompt evaluation v2 logs
        {
          id: crypto.randomUUID(),
          userId: "candidate.alpha@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "A",
          metricKey: "ips_improvement",
          metricValue: 12.5,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.beta@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "B",
          metricKey: "ips_improvement",
          metricValue: 18.2,
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.gamma@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "control",
          metricKey: "ips_improvement",
          metricValue: 5.1,
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.alpha@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "A",
          metricKey: "latency_ms",
          metricValue: 1850,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.beta@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "B",
          metricKey: "latency_ms",
          metricValue: 1240,
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.gamma@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "control",
          metricKey: "latency_ms",
          metricValue: 2200,
          timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.alpha@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "A",
          metricKey: "interview_completed",
          metricValue: 1,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.beta@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "B",
          metricKey: "interview_completed",
          metricValue: 1,
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.alpha@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "A",
          metricKey: "user_satisfaction",
          metricValue: 4,
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: crypto.randomUUID(),
          userId: "candidate.beta@gmail.com",
          flagId: "prompt_evaluation_v2",
          version: "2.1.0-beta",
          group: "B",
          metricKey: "user_satisfaction",
          metricValue: 5,
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString()
        }
      ];
      fs.writeFileSync(METRICS_STORAGE_FILE, JSON.stringify(seedMetrics, null, 2), "utf8");
      this.cachedMetrics = seedMetrics;
    }

    if (!fs.existsSync(ROLLBACKS_LOG_FILE)) {
      fs.writeFileSync(ROLLBACKS_LOG_FILE, JSON.stringify([], null, 2), "utf8");
      this.cachedRollbacks = [];
    }
  }

  // Load Flags from file
  public static getAllFlags(): FeatureFlag[] {
    this.init();
    if (this.cachedFlags) return this.cachedFlags;
    try {
      const data = fs.readFileSync(FLAGS_STORAGE_FILE, "utf8");
      this.cachedFlags = JSON.parse(data);
      return this.cachedFlags || [];
    } catch (e) {
      console.error("Failed to read feature flags file:", e);
      return [];
    }
  }

  // Save Flags to file
  private static saveFlags(flags: FeatureFlag[]) {
    try {
      fs.writeFileSync(FLAGS_STORAGE_FILE, JSON.stringify(flags, null, 2), "utf8");
      this.cachedFlags = flags;
    } catch (e) {
      console.error("Failed to save feature flags file:", e);
    }
  }

  // Load Metrics from file
  public static getAllMetrics(): ExperimentMetricLog[] {
    this.init();
    if (this.cachedMetrics) return this.cachedMetrics;
    try {
      const data = fs.readFileSync(METRICS_STORAGE_FILE, "utf8");
      this.cachedMetrics = JSON.parse(data);
      return this.cachedMetrics || [];
    } catch (e) {
      console.error("Failed to read metrics file:", e);
      return [];
    }
  }

  // Save Metrics to file
  private static saveMetrics(metrics: ExperimentMetricLog[]) {
    try {
      fs.writeFileSync(METRICS_STORAGE_FILE, JSON.stringify(metrics, null, 2), "utf8");
      this.cachedMetrics = metrics;
    } catch (e) {
      console.error("Failed to save metrics file:", e);
    }
  }

  // Load Rollbacks from file
  public static getAllRollbacks(): RollbackReasonLog[] {
    this.init();
    if (this.cachedRollbacks) return this.cachedRollbacks;
    try {
      const data = fs.readFileSync(ROLLBACKS_LOG_FILE, "utf8");
      this.cachedRollbacks = JSON.parse(data);
      return this.cachedRollbacks || [];
    } catch (e) {
      console.error("Failed to read rollbacks file:", e);
      return [];
    }
  }

  // Save Rollbacks to file
  private static saveRollbacks(rollbacks: RollbackReasonLog[]) {
    try {
      fs.writeFileSync(ROLLBACKS_LOG_FILE, JSON.stringify(rollbacks, null, 2), "utf8");
      this.cachedRollbacks = rollbacks;
    } catch (e) {
      console.error("Failed to save rollbacks file:", e);
    }
  }

  // ====================================================
  // 4. CORE ENGINE EVALUATION LOGIC
  // ====================================================

  /**
   * Deterministic bucket hashing to ensure a given user falls into
   * consistent rollout and group assignment buckets.
   */
  private static getUserHashBucket(userId: string, salt: string): number {
    const hash = crypto.createHash("md5").update(userId + ":" + salt).digest("hex");
    return parseInt(hash.substring(0, 8), 16) % 100;
  }

  /**
   * Evaluates a feature flag in real-time. Low latency (<1ms) execution.
   */
  public static evaluate(
    flagId: string,
    userId: string = "anonymous",
    currentEnv: string = "production"
  ): FlagEvaluationResult {
    const flags = this.getAllFlags();
    const flag = flags.find(f => f.id === flagId);

    // Fallback default response if flag is missing
    const fallbackResult: FlagEvaluationResult = {
      enabled: false,
      group: "none",
      version: "0.0.0",
      config: {}
    };

    if (!flag) return fallbackResult;

    // 1. Check direct OFF status
    if (flag.status === "OFF") {
      return {
        enabled: false,
        group: "none",
        version: flag.version,
        config: {}
      };
    }

    // 2. Check direct ON status
    if (flag.status === "ON") {
      return this.resolveGroupAndConfig(flag, userId);
    }

    // 3. Status is CONTROLLED. Verify environment rules first.
    if (flag.environment !== "all" && flag.environment !== currentEnv) {
      return {
        enabled: false,
        group: "none",
        version: flag.version,
        config: {}
      };
    }

    // 4. Validate user eligibility (White-listed target users bypass percentage rollout)
    if (flag.target_users && flag.target_users.includes(userId)) {
      return this.resolveGroupAndConfig(flag, userId);
    }

    // 5. Apply gradual percentage rollout check via deterministic MD5 hashing
    const bucket = this.getUserHashBucket(userId, flag.id);
    if (bucket >= flag.rollout_percentage) {
      // User is not within the rollout threshold
      return {
        enabled: false,
        group: "none",
        version: flag.version,
        config: {}
      };
    }

    // User is within the rollout percentage!
    return this.resolveGroupAndConfig(flag, userId);
  }

  /**
   * Helper to assign active group and return config object for experiments
   */
  private static resolveGroupAndConfig(flag: FeatureFlag, userId: string): FlagEvaluationResult {
    if (!flag.isExperiment || !flag.experimentConfig) {
      return {
        enabled: true,
        group: "none",
        version: flag.version,
        config: {}
      };
    }

    // Deterministically bucket users into Group A, Group B, or control
    // Split the 100% space evenly:
    // 0-33 -> Control
    // 34-66 -> Group A
    // 67-99 -> Group B
    const groupBucket = this.getUserHashBucket(userId, flag.id + "_experiment_group");
    
    let group: "A" | "B" | "control" = "control";
    let config: Record<string, any> = flag.experimentConfig.controlConfig || {};

    if (groupBucket >= 34 && groupBucket <= 66) {
      group = "A";
      config = flag.experimentConfig.groupAConfig || {};
    } else if (groupBucket >= 67) {
      group = "B";
      config = flag.experimentConfig.groupBConfig || {};
    }

    return {
      enabled: true,
      group,
      version: flag.version,
      config
    };
  }

  // ====================================================
  // 5. ADMINISTRATIVE & METRICS ACTIONS
  // ====================================================

  /**
   * Create or update a Feature Flag
   */
  public static saveOrUpdateFlag(flag: FeatureFlag, userId: string, ip: string): FeatureFlag {
    const flags = this.getAllFlags();
    const existingIndex = flags.findIndex(f => f.id === flag.id);

    if (existingIndex >= 0) {
      // Logging quick state differences to Audit Logs
      const before = flags[existingIndex];
      flags[existingIndex] = {
        ...flag,
        createdAt: before.createdAt // retain original timestamp
      };
      
      AuditLogger.logSecurityEvent(
        "feature_flag_updated",
        userId,
        `Updated feature flag '${flag.id}' properties (status: ${flag.status}, rollout: ${flag.rollout_percentage}%)`,
        ip
      );
    } else {
      flag.createdAt = new Date().toISOString();
      flags.push(flag);

      AuditLogger.logSecurityEvent(
        "feature_flag_created",
        userId,
        `Created new feature flag '${flag.id}'`,
        ip
      );
    }

    this.saveFlags(flags);
    return flag;
  }

  /**
   * Delete a feature flag
   */
  public static deleteFlag(flagId: string, userId: string, ip: string): boolean {
    const flags = this.getAllFlags();
    const index = flags.findIndex(f => f.id === flagId);
    if (index >= 0) {
      const removed = flags.splice(index, 1)[0];
      this.saveFlags(flags);

      AuditLogger.logSecurityEvent(
        "feature_flag_deleted",
        userId,
        `Deleted feature flag '${flagId}'`,
        ip
      );
      return true;
    }
    return false;
  }

  /**
   * Quick status toggle (instant OFF or rollback capability)
   */
  public static toggleFlagStatus(
    flagId: string,
    newStatus: FlagStatus,
    rollbackReason: string,
    userId: string,
    ip: string
  ): FeatureFlag | null {
    const flags = this.getAllFlags();
    const flag = flags.find(f => f.id === flagId);

    if (flag) {
      const oldStatus = flag.status;
      flag.status = newStatus;

      // If disabling or dropping status to OFF due to failure, log rollback reason
      if (newStatus === "OFF" && rollbackReason) {
        const rollbacks = this.getAllRollbacks();
        const rollbackLog: RollbackReasonLog = {
          id: "rollback_" + crypto.randomUUID().slice(0, 8),
          flagId,
          performedBy: userId,
          reason: rollbackReason,
          timestamp: new Date().toISOString()
        };
        rollbacks.unshift(rollbackLog);
        this.saveRollbacks(rollbacks);
      }

      this.saveFlags(flags);

      AuditLogger.logSecurityEvent(
        "feature_flag_toggled",
        userId,
        `Toggled feature flag status for '${flagId}' from ${oldStatus} to ${newStatus}${rollbackReason ? ' with reason: ' + rollbackReason : ''}`,
        ip
      );
      return flag;
    }
    return null;
  }

  /**
   * Log metrics and events captured from an active user experiment session.
   */
  public static logMetric(
    userId: string,
    flagId: string,
    metricKey: string,
    metricValue: number,
    sessionId?: string
  ): ExperimentMetricLog | null {
    const flags = this.getAllFlags();
    const flag = flags.find(f => f.id === flagId);
    if (!flag) return null;

    // Evaluate user to see which experiment bucket they are inside
    const evaluation = this.evaluate(flagId, userId);

    const metrics = this.getAllMetrics();
    const newLog: ExperimentMetricLog = {
      id: crypto.randomUUID(),
      userId,
      flagId,
      version: evaluation.version,
      group: evaluation.group,
      metricKey,
      metricValue,
      sessionId,
      timestamp: new Date().toISOString()
    };

    metrics.push(newLog);
    // Keep max 2000 metrics in this file buffer
    if (metrics.length > 2000) {
      metrics.shift();
    }
    this.saveMetrics(metrics);

    return newLog;
  }

  /**
   * Summarize experiment results with sample sizes and A/B average statistics.
   */
  public static getExperimentSummary(flagId: string): ExperimentSummary | null {
    const flags = this.getAllFlags();
    const flag = flags.find(f => f.id === flagId);
    if (!flag || !flag.isExperiment) return null;

    const metrics = this.getAllMetrics().filter(m => m.flagId === flagId);

    const summary: ExperimentSummary = {
      flagId,
      version: flag.version,
      totalLogs: metrics.length,
      groups: {
        A: { count: 0, metrics: {} },
        B: { count: 0, metrics: {} },
        control: { count: 0, metrics: {} },
        none: { count: 0, metrics: {} }
      }
    };

    // Keep unique users per group
    const uniqueUsersPerGroup: Record<string, Set<string>> = {
      A: new Set(),
      B: new Set(),
      control: new Set(),
      none: new Set()
    };

    metrics.forEach(log => {
      const g = log.group || "none";
      if (!summary.groups[g]) {
        summary.groups[g] = { count: 0, metrics: {} };
      }
      uniqueUsersPerGroup[g].add(log.userId);

      const mStore = summary.groups[g].metrics;
      if (!mStore[log.metricKey]) {
        mStore[log.metricKey] = { count: 0, sum: 0, avg: 0 };
      }

      mStore[log.metricKey].count += 1;
      mStore[log.metricKey].sum += log.metricValue;
      mStore[log.metricKey].avg = mStore[log.metricKey].sum / mStore[log.metricKey].count;
    });

    // Assign actual sample sizes
    Object.keys(summary.groups).forEach(g => {
      summary.groups[g].count = uniqueUsersPerGroup[g].size;
    });

    return summary;
  }
}
