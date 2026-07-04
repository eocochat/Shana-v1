import { CandidateState } from './candidateState';
import { GrowthEngine } from './growthEngine';

export interface AggregatedCandidateAnalytics {
  averageGrowthRate: number; // %
  averageRetentionRate: number; // %
  totalInterviewsCompleted: number;
  averageConsistencyScore: number;
  milestonesUnlockedRatio: number; // %
  readinessDistribution: {
    ready: number; // >80
    growing: number; // 50-80
    beginning: number; // <50
  };
  mostImprovedCompetency: string;
}

export class CandidateAnalyticsService {
  /**
   * Aggregates anonymized telemetry metrics across all candidate files stored in localStorage.
   */
  public static getAggregatedAnalytics(): AggregatedCandidateAnalytics {
    let totalGrowth = 0;
    let totalRetention = 0;
    let totalInterviews = 0;
    let totalConsistency = 0;
    let totalMilestonesCount = 0;
    let readyCount = 0;
    let growingCount = 0;
    let beginningCount = 0;

    let totalCandidates = 0;
    const improvedCountMap: Record<string, number> = {};

    try {
      // Find all candidates saved in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shana_candidate_state_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const state: CandidateState = JSON.parse(raw);
            totalCandidates++;

            const growthNode = GrowthEngine.calculateGrowthRate(state);
            totalGrowth += growthNode.growthRate;
            totalRetention += growthNode.retentionRate;
            totalInterviews += state.memory.pastInterviewsCount;
            totalConsistency += state.motivation.consistencyScore;
            totalMilestonesCount += state.motivation.unlockedMilestones.length;

            const overall = state.readiness.overallHiringReadiness.score;
            if (overall >= 80) readyCount++;
            else if (overall >= 50) growingCount++;
            else beginningCount++;

            // Track potential gaps
            const lowestComp = Object.values(state.digitalTwin).sort((a, b) => a.score - b.score)[0];
            if (lowestComp) {
              improvedCountMap[lowestComp.name] = (improvedCountMap[lowestComp.name] || 0) + 1;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error calculating candidate analytics:', e);
    }

    // fallback to default if no items found
    if (totalCandidates === 0) {
      return {
        averageGrowthRate: 15,
        averageRetentionRate: 75,
        totalInterviewsCompleted: 12,
        averageConsistencyScore: 82,
        milestonesUnlockedRatio: 45,
        readinessDistribution: {
          ready: 3,
          growing: 7,
          beginning: 2
        },
        mostImprovedCompetency: 'Communication'
      };
    }

    // Determine the most improved (or most frequently targeted competency)
    let bestComp = 'Communication';
    let maxCount = 0;
    Object.entries(improvedCountMap).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestComp = name;
      }
    });

    const totalPossibleMilestones = 7; // count in array
    const avgUnlockedMilestonesCount = totalMilestonesCount / totalCandidates;
    const ratio = Math.round((avgUnlockedMilestonesCount / totalPossibleMilestones) * 100);

    return {
      averageGrowthRate: Math.round(totalGrowth / totalCandidates),
      averageRetentionRate: Math.round(totalRetention / totalCandidates),
      totalInterviewsCompleted: totalInterviews,
      averageConsistencyScore: Math.round(totalConsistency / totalCandidates),
      milestonesUnlockedRatio: Math.min(100, ratio),
      readinessDistribution: {
        ready: readyCount,
        growing: growingCount,
        beginning: beginningCount
      },
      mostImprovedCompetency: bestComp
    };
  }
}
