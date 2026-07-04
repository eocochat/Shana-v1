import { InterviewGenomeRecord } from './graphTypes';
import { GraphStateManager } from './graphState';
import { GraphUpdater } from './graphUpdater';

const GENOME_STORAGE_KEY = 'shana_interview_genomes_list';

export const InterviewGenome = {
  getGenomes(): InterviewGenomeRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(GENOME_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('[SHANA InterviewGenome] Failed to get genomes', e);
      return [];
    }
  },

  saveGenome(genome: InterviewGenomeRecord): void {
    if (typeof window === 'undefined') return;
    const genomes = this.getGenomes();
    const existingIdx = genomes.findIndex(g => g.sessionId === genome.sessionId);
    if (existingIdx !== -1) {
      genomes[existingIdx] = genome;
    } else {
      genomes.push(genome);
    }
    localStorage.setItem(GENOME_STORAGE_KEY, JSON.stringify(genomes));

    // Compile into GraphUpdater automatically to feed the universal Knowledge Graph
    try {
      const questionsAssessed = genome.questions.map(q => ({
        text: q.questionText,
        competencyId: q.competencies[0] || 'comp_problem_solving',
        userAnswer: 'Anonymized secure answer content',
        clarityScore: q.clarityScore,
        feedbackScore: q.feedbackScore,
        extractedEvidence: q.evidenceText || 'Proactive solution architecting',
        difficulty: q.difficulty
      }));

      const scoresBefore: Record<string, number> = {};
      const scoresAfter: Record<string, number> = {};

      genome.learningAcquisitions.forEach(acq => {
        scoresBefore[acq.competencyId] = acq.beforeScore;
        scoresAfter[acq.competencyId] = acq.afterScore;
      });

      GraphUpdater.updateGraphFromSession(genome.userId, genome.sessionId, {
        roleId: genome.roleId,
        industryId: genome.industryId,
        companyId: genome.companyId,
        overallScore: genome.overallReadiness,
        recommendation: genome.recruiterRecommendation,
        scoresBefore,
        scoresAfter,
        questionsAssessed
      });
    } catch (err) {
      console.warn('[SHANA InterviewGenome] Auto graph compilation failed:', err);
    }
  },

  getGenome(sessionId: string): InterviewGenomeRecord | null {
    const genomes = this.getGenomes();
    return genomes.find(g => g.sessionId === sessionId) || null;
  },

  listUserGenomes(userId: string): InterviewGenomeRecord[] {
    const genomes = this.getGenomes();
    return genomes.filter(g => g.userId === userId);
  }
};
