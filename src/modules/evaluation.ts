import { AIOperationsController } from '../services/ai-monitoring';

export interface AIOpsEvaluation {
  id: string;
  candidateName: string;
  roleApplied: string;
  generatedScore: number; // 0 to 100, read-only (no direct editing)
  completion: number; // percentage (e.g. 100%)
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'HOLD' | 'REJECT';
  confidenceLevel: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'flagged' | 'review_requested';
  timestamp: string;
  interviewConfig: {
    durationLimit: string;
    vocalRequired: boolean;
    mirrorAssessment: boolean;
    languages: string[];
  };
}

const EVALUATIONS_KEY = 'shana_aiops_evaluations';

export const EvaluationMonitor = {
  getEvaluations(): AIOpsEvaluation[] {
    try {
      const saved = localStorage.getItem(EVALUATIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const seeded: AIOpsEvaluation[] = [
      {
        id: 'eval_01',
        candidateName: 'Jean Candidat',
        roleApplied: 'SRE Specialist',
        generatedScore: 84,
        completion: 100,
        recommendation: 'HIRE',
        confidenceLevel: 'high',
        status: 'pending',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        interviewConfig: {
          durationLimit: '20 min',
          vocalRequired: true,
          mirrorAssessment: false,
          languages: ['FR']
        }
      },
      {
        id: 'eval_02',
        candidateName: 'Clara Dubois',
        roleApplied: 'Senior Frontend Engineer',
        generatedScore: 92,
        completion: 100,
        recommendation: 'STRONG_HIRE',
        confidenceLevel: 'high',
        status: 'approved',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        interviewConfig: {
          durationLimit: '15 min',
          vocalRequired: false,
          mirrorAssessment: true,
          languages: ['FR', 'EN']
        }
      },
      {
        id: 'eval_03',
        candidateName: 'Arthur Pendragon',
        roleApplied: 'Technical Product Manager',
        generatedScore: 52,
        completion: 75,
        recommendation: 'REJECT',
        confidenceLevel: 'medium',
        status: 'flagged',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        interviewConfig: {
          durationLimit: '30 min',
          vocalRequired: true,
          mirrorAssessment: true,
          languages: ['EN']
        }
      },
      {
        id: 'eval_04',
        candidateName: 'Emma Watson',
        roleApplied: 'AI Research Intern',
        generatedScore: 78,
        completion: 95,
        recommendation: 'HOLD',
        confidenceLevel: 'low',
        status: 'review_requested',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        interviewConfig: {
          durationLimit: '25 min',
          vocalRequired: true,
          mirrorAssessment: false,
          languages: ['EN']
        }
      }
    ];
    this.saveEvaluations(seeded);
    return seeded;
  },

  saveEvaluations(evaluations: AIOpsEvaluation[]): void {
    localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
  },

  updateStatus(id: string, status: AIOpsEvaluation['status'], userEmail: string): void {
    const evals = this.getEvaluations();
    const target = evals.find(e => e.id === id);
    if (target) {
      const oldStatus = target.status;
      target.status = status;
      this.saveEvaluations(evals);

      // Log to AIOperations audit
      AIOperationsController.logAudit(
        'review_action',
        `Changed Evaluation ${id} status from ${oldStatus} to ${status.toUpperCase()}`,
        userEmail
      );
    }
  }
};

export const InterviewInspector = {
  // Utility class demonstrating secure, compliance-ready telemetry view constraints
  canAccessTranscript(): boolean {
    return false; // STRICT NO TRANSCRIPT COMPLIANCE RULE
  },

  canAccessUserVideo(): boolean {
    return false; // STRICT NO VIDEO COMPLIANCE RULE
  },

  getInspectionParameters(sessionId: string) {
    return {
      sessionId,
      regulatoryCompliance: 'GDPR / AI Act Compliant Log Only',
      auditRestricted: ['transcript', 'video_recording', 'voice_raw_biometrics'],
      accessibleMetadata: ['phase_timeline', 'interview_configuration', 'network_jitter_telemetry', 'timestamp_map']
    };
  }
};
