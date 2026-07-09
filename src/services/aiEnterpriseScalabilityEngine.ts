export interface EnterpriseQueueJob {
  id: string;
  taskType: 'learning_analysis' | 'report_generation' | 'referral_rewards' | 'db_sync' | 'analytics_flush';
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  region: string;
  createdAt: string;
  error?: string;
}

export interface RegionClusterStatus {
  id: string;
  name: string;
  latencyMs: number;
  loadPercent: number;
  status: 'online' | 'degraded' | 'failover_active';
  activeInstances: number;
  apiEndpoint: string;
}

export interface EnterpriseOpsMetrics {
  concurrentUsers: number;
  concurrentInterviews: number;
  queueLagSec: number;
  activeWorkers: number;
  workerUtilizationPercent: number;
  dbThroughputOpsSec: number;
  apiThroughputReqSec: number;
  averageSystemLoad: number; // load average
  peakSystemLoad: number;
  globalFailoverTriggered: boolean;
  totalRegionsActive: number;
}

export interface RateLimitProfile {
  tier: 'Free' | 'Starter' | 'Professional' | 'Enterprise' | 'Administrator';
  maxRequestsPerMin: number;
  maxConcurrentSessions: number;
  tokenBucketSize: number;
  burstAllowancePercent: number;
  priorityWeight: number; // higher is more prioritized
}

export class AIEnterpriseScalabilityEngine {
  private static jobs: EnterpriseQueueJob[] = [
    { id: 'job-101', taskType: 'learning_analysis', payload: { sessionId: 'sess-812' }, status: 'completed', retryCount: 0, maxRetries: 3, region: 'eu-west1', createdAt: new Date(Date.now() - 15000).toISOString() },
    { id: 'job-102', taskType: 'report_generation', payload: { candidateId: 'cand-402' }, status: 'completed', retryCount: 0, maxRetries: 3, region: 'us-east1', createdAt: new Date(Date.now() - 10000).toISOString() },
    { id: 'job-103', taskType: 'referral_rewards', payload: { userId: 'usr-901' }, status: 'queued', retryCount: 0, maxRetries: 3, region: 'ap-east1', createdAt: new Date(Date.now() - 2000).toISOString() },
    { id: 'job-104', taskType: 'db_sync', payload: { collection: 'interviews' }, status: 'queued', retryCount: 0, maxRetries: 5, region: 'us-central1', createdAt: new Date(Date.now() - 500).toISOString() }
  ];

  private static regions: RegionClusterStatus[] = [
    { id: 'eu-west1', name: 'Europe (Paris)', latencyMs: 22, loadPercent: 34, status: 'online', activeInstances: 12, apiEndpoint: 'https://eu.shana-interview.com' },
    { id: 'us-east1', name: 'US East (N. Virginia)', latencyMs: 45, loadPercent: 62, status: 'online', activeInstances: 24, apiEndpoint: 'https://us-east.shana-interview.com' },
    { id: 'us-central1', name: 'US Central (Iowa)', latencyMs: 52, loadPercent: 12, status: 'failover_active', activeInstances: 0, apiEndpoint: 'https://us-central.shana-interview.com' },
    { id: 'ap-east1', name: 'Asia Pacific (Tokyo)', latencyMs: 142, loadPercent: 18, status: 'online', activeInstances: 8, apiEndpoint: 'https://ap.shana-interview.com' }
  ];

  private static rateLimits: RateLimitProfile[] = [
    { tier: 'Free', maxRequestsPerMin: 15, maxConcurrentSessions: 1, tokenBucketSize: 20, burstAllowancePercent: 10, priorityWeight: 1 },
    { tier: 'Starter', maxRequestsPerMin: 45, maxConcurrentSessions: 3, tokenBucketSize: 60, burstAllowancePercent: 15, priorityWeight: 2 },
    { tier: 'Professional', maxRequestsPerMin: 120, maxConcurrentSessions: 10, tokenBucketSize: 150, burstAllowancePercent: 20, priorityWeight: 4 },
    { tier: 'Enterprise', maxRequestsPerMin: 600, maxConcurrentSessions: 100, tokenBucketSize: 800, burstAllowancePercent: 40, priorityWeight: 8 },
    { tier: 'Administrator', maxRequestsPerMin: 1000, maxConcurrentSessions: 1000, tokenBucketSize: 1500, burstAllowancePercent: 50, priorityWeight: 10 }
  ];

  /**
   * Get active jobs
   */
  static getQueueJobs(): EnterpriseQueueJob[] {
    return [...this.jobs];
  }

  /**
   * Enqueues a new background transaction/job with failure-isolated execution
   */
  static enqueueJob(taskType: EnterpriseQueueJob['taskType'], payload: any, region: string = 'eu-west1'): EnterpriseQueueJob {
    const newJob: EnterpriseQueueJob = {
      id: `job-${Math.floor(100 + Math.random() * 900)}`,
      taskType,
      payload,
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      region,
      createdAt: new Date().toISOString()
    };
    this.jobs.unshift(newJob);
    if (this.jobs.length > 50) {
      this.jobs.pop();
    }
    return newJob;
  }

  /**
   * Triggers background execution queue ticks
   */
  static processQueue(): void {
    this.jobs = this.jobs.map(job => {
      if (job.status === 'queued') {
        // Mock processing simulation
        const succeed = Math.random() > 0.15;
        if (succeed) {
          return { ...job, status: 'completed' };
        } else {
          const nextRetry = job.retryCount + 1;
          return {
            ...job,
            status: nextRetry >= job.maxRetries ? 'failed' : 'queued',
            retryCount: nextRetry,
            error: 'Connection timeout on downstream AI server'
          };
        }
      }
      return job;
    });
  }

  /**
   * Regions configuration
   */
  static getRegions(): RegionClusterStatus[] {
    return this.regions.map(r => {
      // Add subtle noise to load & latency
      const latencyNoise = Math.round((Math.random() - 0.5) * 4);
      const loadNoise = Math.round((Math.random() - 0.5) * 6);
      return {
        ...r,
        latencyMs: Math.max(10, r.latencyMs + latencyNoise),
        loadPercent: r.status === 'failover_active' ? 0 : Math.min(99, Math.max(5, r.loadPercent + loadNoise))
      };
    });
  }

  /**
   * Toggle Failover for a specific cluster region
   */
  static toggleRegionFailover(regionId: string): RegionClusterStatus[] {
    this.regions = this.regions.map(r => {
      if (r.id === regionId) {
        const nextStatus = r.status === 'failover_active' ? 'online' : 'failover_active';
        return {
          ...r,
          status: nextStatus,
          activeInstances: nextStatus === 'failover_active' ? 0 : 12
        };
      }
      return r;
    });
    return this.getRegions();
  }

  /**
   * Returns rate limit configs
   */
  static getRateLimitProfiles(): RateLimitProfile[] {
    return this.rateLimits;
  }

  /**
   * Fetch active operations metrics
   */
  static getEnterpriseOpsMetrics(concurrentCount: number = 4): EnterpriseOpsMetrics {
    const isCentralFailover = this.regions.some(r => r.id === 'us-central1' && r.status === 'failover_active');
    
    // Extrapolate realistic metrics based on active container sessions
    const concurrentUsers = Math.max(8, concurrentCount * 4);
    const concurrentInterviews = concurrentCount;
    const queueLagSec = parseFloat((0.2 + (this.jobs.filter(j => j.status === 'queued').length * 0.45)).toFixed(2));
    const activeWorkers = 32;
    const workerUtilizationPercent = Math.min(95, Math.round(20 + (concurrentCount * 8.5) + (Math.sin(Date.now() / 15000) * 4)));
    const dbThroughputOpsSec = Math.round(15 + (concurrentCount * 2.8) + (Math.sin(Date.now() / 10000) * 3));
    const apiThroughputReqSec = Math.round(8 + (concurrentCount * 1.5) + (Math.sin(Date.now() / 8000) * 2));
    
    // Loads
    const avgLoad = parseFloat((0.45 + (concurrentCount * 0.12) + (Math.sin(Date.now() / 20000) * 0.05)).toFixed(2));
    const peakLoad = parseFloat((1.85 + (concurrentCount * 0.22)).toFixed(2));

    return {
      concurrentUsers,
      concurrentInterviews,
      queueLagSec,
      activeWorkers,
      workerUtilizationPercent,
      dbThroughputOpsSec,
      apiThroughputReqSec,
      averageSystemLoad: avgLoad,
      peakSystemLoad: peakLoad,
      globalFailoverTriggered: isCentralFailover,
      totalRegionsActive: this.regions.filter(r => r.status === 'online').length
    };
  }

  /**
   * Stress test high user loads predictions
   */
  static getStressPerformanceEstimates(users: number): {
    latencyMs: number;
    errorRatePercent: number;
    cpuSaturation: number;
    dbLagMs: number;
    stability: 'stable' | 'degraded' | 'critical';
  } {
    let latencyMs = 180;
    let errorRatePercent = 0.01;
    let cpuSaturation = 14;
    let dbLagMs = 8;
    let stability: 'stable' | 'degraded' | 'critical' = 'stable';

    if (users <= 10000) {
      latencyMs += (users / 10000) * 30;
      cpuSaturation += (users / 10000) * 25;
      dbLagMs += (users / 10000) * 12;
    } else if (users <= 25000) {
      latencyMs += 30 + ((users - 10000) / 15000) * 65;
      cpuSaturation += 25 + ((users - 10000) / 15000) * 30;
      dbLagMs += 12 + ((users - 10000) / 15000) * 20;
    } else if (users <= 50000) {
      stability = 'degraded';
      latencyMs += 95 + ((users - 25000) / 25000) * 120;
      errorRatePercent = parseFloat((0.01 + ((users - 25000) / 25000) * 0.45).toFixed(2));
      cpuSaturation += 30 + ((users - 25000) / 25000) * 25;
      dbLagMs += 32 + ((users - 25000) / 25000) * 45;
    } else {
      stability = 'critical';
      latencyMs += 215 + ((users - 50000) / 50000) * 290;
      errorRatePercent = parseFloat((0.46 + ((users - 50000) / 50000) * 2.8).toFixed(2));
      cpuSaturation = Math.min(99, Math.round(55 + ((users - 50000) / 50000) * 38));
      dbLagMs += 77 + ((users - 50000) / 50000) * 110;
    }

    return {
      latencyMs: Math.round(latencyMs),
      errorRatePercent,
      cpuSaturation: Math.round(cpuSaturation),
      dbLagMs: Math.round(dbLagMs),
      stability
    };
  }
}
