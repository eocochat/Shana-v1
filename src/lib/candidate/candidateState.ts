export interface DigitalTwinCompetency {
  id: string;
  name: string;
  score: number; // 0 - 100
  confidence: number; // 0 - 100
  history: { timestamp: string; score: number }[];
}

export interface CommunicationMetrics {
  averageSpeakingSpeed: number; // words per minute
  vocabularyRichness: number; // 0 - 100
  sentenceStructure: number; // 0 - 100
  answerClarity: number; // 0 - 100
  conciseness: number; // 0 - 100
  fillerWordFrequency: number; // occurrences per 100 words
  conversationFlow: number; // 0 - 100
  history: { timestamp: string; clarity: number; conciseness: number }[];
}

export interface ConfidenceProfile {
  beginningConfidence: number; // 0 - 100
  peakConfidence: number; // 0 - 100
  confidenceRecovery: number; // 0 - 100
  confidenceUnderPressure: number; // 0 - 100
  confidenceDuringTechnical: number; // 0 - 100
  trend: { timestamp: string; overallConfidence: number }[];
}

export interface StressMetrics {
  hesitations: number; // count per answer
  speechInterruptions: number; // count
  longPauses: number; // count
  rapidSpeechInstances: number; // count
  emotionalRecovery: number; // 0 - 100
  pressureTolerance: number; // 0 - 100
  stressResilienceIndex: number; // 0 - 100
}

export type LearningStyle = 'Fast Learner' | 'Practice Oriented' | 'Visual/Structured' | 'Needs Confidence Building';

export interface LearningProfile {
  style: LearningStyle;
  adaptabilityRate: number; // 0 - 100
  repetitionRequirement: number; // 0 - 100
  coachingReceptivity: number; // 0 - 100
  practiceCompletionRate: number; // 0 - 100
}

export interface BehavioralProfile {
  leadershipStyle: string; // e.g., 'Empathetic Facilitator', 'Direct Controller'
  ownershipIndex: number; // 0 - 100
  conflictManagementStyle: string; // e.g., 'Collaborative Solver', 'Avoider'
  decisionMakingStyle: string; // e.g., 'Data-Driven Analytical', 'Intuitive'
  collaborationIndex: number; // 0 - 100
  initiativeIndex: number; // 0 - 100
  curiosityIndex: number; // 0 - 100
  professionalMaturity: number; // 0 - 100
}

export interface PersonalityTraits {
  reserved: number; // 0 - 100
  analytical: number; // 0 - 100
  confident: number; // 0 - 100
  reflective: number; // 0 - 100
  collaborative: number; // 0 - 100
  assertive: number; // 0 - 100
  adaptive: number; // 0 - 100
}

export interface SkillEvolutionNode {
  competencyId: string;
  timeline: { week: number; score: number }[];
}

export interface ReadinessScore {
  score: number; // 0 - 100
  explanation: string;
}

export interface ReadinessProfile {
  behavioralReadiness: ReadinessScore;
  technicalReadiness: ReadinessScore;
  leadershipReadiness: ReadinessScore;
  executiveReadiness: ReadinessScore;
  companyReadiness: ReadinessScore;
  overallHiringReadiness: ReadinessScore;
}

export interface CoachingStrategyState {
  currentWeek: number;
  activeTrack: string;
  focusTarget: string;
  weeklyPlan: string[];
}

export interface ImprovementPlannerState {
  immediateImprovements: string[];
  weeklyObjectives: string[];
  monthlyObjectives: string[];
  priorityCompetencies: string[];
  suggestedPracticeSessions: string[];
  learningResources: { title: string; url: string; category: string }[];
}

export interface CandidateMemoryState {
  pastInterviewsCount: number;
  repeatedWeaknesses: string[];
  recurringStrengths: string[];
  careerGoals: string;
  targetCompanies: string[];
  preferredIndustries: string[];
  learningHistory: string[];
}

export interface AchievementMilestone {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  icon: string;
}

export interface MotivationState {
  streakCount: number;
  lastPracticeDate: string | null;
  consistencyScore: number; // 0 - 100
  unlockedMilestones: string[];
  milestones: AchievementMilestone[];
}

export interface PersonalizedRecommendations {
  practiceSessions: string[];
  learningPlans: string[];
  companySimulations: string[];
  interviewDifficulty: 'Entry' | 'Intermediate' | 'Advanced' | 'Elite';
  careerPaths: string[];
  courses: string[];
  dailyExercises: string[];
}

export interface CandidateState {
  userId: string;
  digitalTwin: Record<string, DigitalTwinCompetency>;
  communication: CommunicationMetrics;
  confidence: ConfidenceProfile;
  stress: StressMetrics;
  learning: LearningProfile;
  behavioral: BehavioralProfile;
  personality: PersonalityTraits;
  skillEvolution: Record<string, SkillEvolutionNode>;
  readiness: ReadinessProfile;
  coachingStrategy: CoachingStrategyState;
  improvementPlanner: ImprovementPlannerState;
  memory: CandidateMemoryState;
  motivation: MotivationState;
  recommendations: PersonalizedRecommendations;
  lastUpdated: string;
}

export function createDefaultCandidateState(userId: string): CandidateState {
  const compIds = [
    'communication',
    'leadership',
    'ownership',
    'technical_skills',
    'problem_solving',
    'conflict_resolution',
    'adaptability',
    'teamwork',
    'customer_focus',
    'learning_ability',
    'decision_making'
  ];

  const digitalTwin: Record<string, DigitalTwinCompetency> = {};
  const skillEvolution: Record<string, SkillEvolutionNode> = {};

  compIds.forEach(id => {
    const readableName = id
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    digitalTwin[id] = {
      id,
      name: readableName,
      score: 0,
      confidence: 0,
      history: []
    };

    skillEvolution[id] = {
      competencyId: id,
      timeline: []
    };
  });

  const milestones: AchievementMilestone[] = [
    { id: 'first_interview', title: 'First Steps', description: 'Complete your first diagnostic interview simulation', unlockedAt: null, icon: 'Compass' },
    { id: 'high_score_80', title: 'STAR Achiever', description: 'Attain a competency score of 80% or greater in any category', unlockedAt: null, icon: 'Award' },
    { id: 'communication_master', title: 'Communication Master', description: 'Sustain peak speaking clarity with zero filler words', unlockedAt: null, icon: 'MessageSquare' },
    { id: 'leadership_builder', title: 'Leadership Builder', description: 'Establish high-impact executive presence indicators', unlockedAt: null, icon: 'Shield' },
    { id: 'star_expert', title: 'STAR Expert', description: 'Log multiple structured STAR outcomes with precise metrics', unlockedAt: null, icon: 'Zap' },
    { id: 'technical_specialist', title: 'Technical Specialist', description: 'Validate advanced architectural domain depth', unlockedAt: null, icon: 'Code' },
    { id: 'hiring_ready', title: 'Hiring Ready', description: 'Achieve an overall hiring readiness metric above 85%', unlockedAt: null, icon: 'CheckCircle' }
  ];

  return {
    userId,
    digitalTwin,
    communication: {
      averageSpeakingSpeed: 0,
      vocabularyRichness: 0,
      sentenceStructure: 0,
      answerClarity: 0,
      conciseness: 0,
      fillerWordFrequency: 0,
      conversationFlow: 0,
      history: []
    },
    confidence: {
      beginningConfidence: 0,
      peakConfidence: 0,
      confidenceRecovery: 0,
      confidenceUnderPressure: 0,
      confidenceDuringTechnical: 0,
      trend: []
    },
    stress: {
      hesitations: 0,
      speechInterruptions: 0,
      longPauses: 0,
      rapidSpeechInstances: 0,
      emotionalRecovery: 0,
      pressureTolerance: 0,
      stressResilienceIndex: 0
    },
    learning: {
      style: 'Practice Oriented',
      adaptabilityRate: 0,
      repetitionRequirement: 0,
      coachingReceptivity: 0,
      practiceCompletionRate: 0
    },
    behavioral: {
      leadershipStyle: 'Non Évalué / Not Evaluated',
      ownershipIndex: 0,
      conflictManagementStyle: 'Non Évalué / Not Evaluated',
      decisionMakingStyle: 'Non Évalué / Not Evaluated',
      collaborationIndex: 0,
      initiativeIndex: 0,
      curiosityIndex: 0,
      professionalMaturity: 0
    },
    personality: {
      reserved: 0,
      analytical: 0,
      confident: 0,
      reflective: 0,
      collaborative: 0,
      assertive: 0,
      adaptive: 0
    },
    skillEvolution,
    readiness: {
      behavioralReadiness: { score: 0, explanation: 'Aucune simulation d\'entretien comportemental effectuée pour le moment. / No behavioral interview simulation completed yet.' },
      technicalReadiness: { score: 0, explanation: 'Aucune question technique validée pour le moment. / No technical questions validated yet.' },
      leadershipReadiness: { score: 0, explanation: 'Aucun indicateur de leadership enregistré pour le moment. / No leadership indicators recorded yet.' },
      executiveReadiness: { score: 0, explanation: 'Aucune présentation exécutive évaluée pour le moment. / No executive presentation evaluated yet.' },
      companyReadiness: { score: 0, explanation: 'Alignement entreprise en attente d\'évaluation. / Company alignment pending evaluation.' },
      overallHiringReadiness: { score: 0, explanation: 'Réalisez votre première simulation pour activer et calibrer votre indice d\'embauche global. / Start your first simulation to calibrate your overall readiness index.' }
    },
    coachingStrategy: {
      currentWeek: 1,
      activeTrack: 'Behavioral Interviews',
      focusTarget: 'Direct Achievement Structure',
      weeklyPlan: [
        'Practice STAR answers focusing purely on Task and Action details',
        'Record a 2-minute mock introduction with zero verbal pauses',
        'Analyze a leadership-driven team conflict resolution scenario'
      ]
    },
    improvementPlanner: {
      immediateImprovements: ['Avoid starting answers with long background descriptions', 'Use precise metrics instead of subjective phrases like "a lot"'],
      weeklyObjectives: ['Perfect a clean introduction template', 'Complete 3 guided practice runs in the coaching module'],
      monthlyObjectives: ['Build a portfolio of 5 strong project stories covering conflict and failure', 'Elevate overall communication conciseness score to 75%'],
      priorityCompetencies: ['communication', 'ownership'],
      suggestedPracticeSessions: ['STAR Framework Drill', 'Under-Pressure Situational Simulation'],
      learningResources: [
        { title: 'The Ultimate Guide to STAR Method', url: '#', category: 'Behavioral' },
        { title: 'Mastering Verbal Concision', url: '#', category: 'Communication' }
      ]
    },
    memory: {
      pastInterviewsCount: 0,
      repeatedWeaknesses: [],
      recurringStrengths: [],
      careerGoals: 'Growth in product engineering and technical leadership.',
      targetCompanies: ['Google', 'Stripe', 'Airbnb'],
      preferredIndustries: ['Technology', 'Fintech', 'SaaS'],
      learningHistory: ['Introductory calibrator completed']
    },
    motivation: {
      streakCount: 0,
      lastPracticeDate: null,
      consistencyScore: 100,
      unlockedMilestones: [],
      milestones
    },
    recommendations: {
      practiceSessions: ['2-Minute Introduction Warmup', 'Conflict Resolution Mini-Simulation'],
      learningPlans: ['4-Week Behavioral Interview Masterplan', 'Technical Executive Speech Alignment'],
      companySimulations: ['Stripe System Design Simulation', 'Airbnb Leadership panel prep'],
      interviewDifficulty: 'Intermediate',
      careerPaths: ['Senior Software Engineer', 'Engineering Manager', 'Tech Lead'],
      courses: ['Executive Communication Bootcamp', 'Pragmatic Systems Engineering'],
      dailyExercises: ['Practice pausing for 2 seconds before answering', 'Explain a complex backend cache concept in 3 sentences']
    },
    lastUpdated: new Date().toISOString()
  };
}
