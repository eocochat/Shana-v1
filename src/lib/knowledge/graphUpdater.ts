import { GraphStateManager } from './graphState';
import { EvidenceGraph } from './evidenceGraph';
import { LearningGraph } from './learningGraph';
import { RecommendationGraph } from './recommendationGraph';
import { GraphNode, GraphEdge } from './graphTypes';

export const GraphUpdater = {
  /**
   * Safe, asynchronous-friendly graph update function called post-interview.
   * Extracts evidence chains, registers learning metrics, and increments graph versions.
   */
  updateGraphFromSession(
    userId: string,
    sessionId: string,
    data: {
      roleId: string;
      industryId: string;
      companyId?: string;
      overallScore: number;
      recommendation: 'hire' | 'consider' | 'reject';
      scoresBefore: Record<string, number>;
      scoresAfter: Record<string, number>;
      questionsAssessed: {
        text: string;
        competencyId: string;
        userAnswer: string;
        clarityScore: number;
        feedbackScore: number;
        extractedEvidence?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
      }[];
    }
  ): void {
    const state = GraphStateManager.getGraphState();
    const now = new Date().toISOString();
    const updateId = `upd_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Create Genome Record reference in state data to track updates
    if (!state.data) {
      state.data = {};
    }
    if (!state.data.genomes) {
      state.data.genomes = [];
    }
    if (!state.data.updatesLog) {
      state.data.updatesLog = [];
    }

    // 2. Map & Register Questions, Answers, and Evidence
    data.questionsAssessed.forEach((q, idx) => {
      const qNodeId = `q_${sessionId}_${idx}`;
      const defaultDiff = q.difficulty || 'medium';
      
      // Update/add Question node
      GraphStateManager.updateNode({
        id: qNodeId,
        type: 'question',
        label: q.text.substring(0, 45) + '...',
        data: {
          fullText: q.text,
          difficulty: defaultDiff,
          successRate: q.feedbackScore,
          effectivenessRating: 85
        },
        lastUpdated: now
      });

      // Connect Question to its competency
      GraphStateManager.updateEdge({
        id: `edge_${qNodeId}_assesses_${q.competencyId}`,
        source: qNodeId,
        target: q.competencyId,
        type: 'assesses',
        weight: 0.9,
        lastUpdated: now
      });

      // If the candidate gave high-quality answers, extract as an Evidence Node
      if (q.extractedEvidence && q.feedbackScore >= 65) {
        const evidenceId = `ev_${sessionId}_${idx}`;
        EvidenceGraph.addOrUpdateEvidence(
          evidenceId,
          q.extractedEvidence,
          `Achieved ${q.feedbackScore}% in session evaluation.`,
          q.feedbackScore,
          { questionText: q.text }
        );

        // Connect evidence to competency
        EvidenceGraph.linkEvidenceToCompetency(evidenceId, q.competencyId, q.feedbackScore / 100);

        // Connect evidence to recruiter decision node
        const decisionId = `dec_${sessionId}`;
        GraphStateManager.updateEdge({
          id: `edge_${evidenceId}_leads_to_${decisionId}`,
          source: evidenceId,
          target: decisionId,
          type: 'leads_to',
          weight: q.feedbackScore / 100,
          lastUpdated: now
        });
      }
    });

    // 3. Register Recruiter Decision Node
    const decisionNodeId = `dec_${sessionId}`;
    GraphStateManager.updateNode({
      id: decisionNodeId,
      type: 'recruiter_decision',
      label: `Outcome: ${data.recommendation.toUpperCase()}`,
      data: {
        decisionType: data.recommendation,
        notes: `System assessment score: ${data.overallScore}%`,
        confidenceScore: 88,
        userId: 'anonymized_user_id' // Strict privacy control
      },
      lastUpdated: now
    });

    // 4. Map & Register Learning Outcomes (Deltas & Improvements)
    Object.entries(data.scoresAfter).forEach(([competencyId, scoreAfter]) => {
      const scoreBefore = data.scoresBefore[competencyId] || 50;
      if (scoreAfter > scoreBefore) {
        const outcomeId = `lrn_${sessionId}_${competencyId}`;
        const topic = state.nodes[competencyId]?.label || 'Professional Excellence';
        
        LearningGraph.addCoachingPathway(
          outcomeId,
          topic,
          'warmup',
          scoreBefore,
          scoreAfter,
          Math.max(5, scoreAfter - scoreBefore)
        );

        // Link outcome to competency
        LearningGraph.linkOutcomeToCompetency(outcomeId, competencyId, 0.85);

        // Generate dynamic recommendation if competency remains below target (e.g. 75%)
        if (scoreAfter < 75) {
          const recId = `strategy_${competencyId}_gap`;
          RecommendationGraph.addCoachingStrategy(
            recId,
            `Accelerated ${topic} Workout`,
            `Intense simulations targeted at elevating ${topic} from current level of ${scoreAfter}%.`,
            ['Focused audio drill with 3 active scenarios', 'Confidence-building breathing warm-ups'],
            competencyId
          );
        }
      }
    });

    // 5. Version the update to guarantee no overwrites of history
    const oldVersion = state.version;
    const parts = oldVersion.split('.').map(Number);
    parts[2] += 1; // Increment patch version
    const newVersion = parts.join('.');
    
    state.version = newVersion;
    state.data.updatesLog.push({
      updateId,
      timestamp: now,
      sessionId,
      previousVersion: oldVersion,
      newVersion,
      nodesAddedCount: data.questionsAssessed.length + 1
    });

    // 6. Save modified graph state
    GraphStateManager.saveState(state);
  }
};
