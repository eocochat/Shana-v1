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
      score: 50,
      confidence: 50,
      history: [{ timestamp: new Date().toISOString(), score: 50 }]
    };

    skillEvolution[id] = {
      competencyId: id,
      timeline: [
        { week: 1, score: 50 }
      ]
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
      averageSpeakingSpeed: 130,
      vocabularyRichness: 60,
      sentenceStructure: 60,
      answerClarity: 55,
      conciseness: 55,
      fillerWordFrequency: 3.5,
      conversationFlow: 60,
      history: [{ timestamp: new Date().toISOString(), clarity: 55, conciseness: 55 }]
    },
    confidence: {
      beginningConfidence: 55,
      peakConfidence: 65,
      confidenceRecovery: 50,
      confidenceUnderPressure: 45,
      confidenceDuringTechnical: 40,
      trend: [{ timestamp: new Date().toISOString(), overallConfidence: 55 }]
    },
    stress: {
      hesitations: 2.5,
      speechInterruptions: 1,
      longPauses: 1,
      rapidSpeechInstances: 1,
      emotionalRecovery: 60,
      pressureTolerance: 55,
      stressResilienceIndex: 60
    },
    learning: {
      style: 'Practice Oriented',
      adaptabilityRate: 50,
      repetitionRequirement: 3,
      coachingReceptivity: 75,
      practiceCompletionRate: 0
    },
    behavioral: {
      leadershipStyle: 'Empathetic Facilitator',
      ownershipIndex: 50,
      conflictManagementStyle: 'Collaborative Solver',
      decisionMakingStyle: 'Balanced Analytical',
      collaborationIndex: 55,
      initiativeIndex: 50,
      curiosityIndex: 60,
      professionalMaturity: 55
    },
    personality: {
      reserved: 30,
      analytical: 55,
      confident: 50,
      reflective: 45,
      collaborative: 60,
      assertive: 40,
      adaptive: 50
    },
    skillEvolution,
    readiness: {
      behavioralReadiness: { score: 50, explanation: 'Foundational understanding. Tends to answer with scenario descriptions rather than measurable results.' },
      technicalReadiness: { score: 50, explanation: 'Displays acceptable core domain familiarity, needs to describe architectural trade-offs.' },
      leadershipReadiness: { score: 45, explanation: 'Exhibits team guiding instinct; needs structured delegation and accountability framing.' },
      executiveReadiness: { score: 40, explanation: 'Needs practice with brief business impact high-level summaries for leadership review.' },
      companyReadiness: { score: 50, explanation: 'Grasps general customer problems; needs specific cultural and goal alignment values.' },
      overallHiringReadiness: { score: 47, explanation: 'Promising profile. Focus on practicing the STAR methodology and incorporating metrics.' }
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
