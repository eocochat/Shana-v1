import { ConversationState, RecruiterPersonality, GenomeSegment } from './conversationState';
import { ContextMemoryManager } from './contextMemory';
import { FollowUpEngine } from './followUpEngine';
import { InterruptionEngine } from './interruptionEngine';
import { PressureEngine } from './pressureEngine';
import { PersonalityEngine } from './personalityEngine';
import { EmotionEngine } from './emotionEngine';
import { CoachingEngine } from './coachingEngine';
import { RecruiterNotesManager } from './recruiterNotes';
import { TurnManager } from './turnManager';
import { ConversationAnalyticsManager } from './conversationAnalytics';
import { ResponsePlanner } from './responsePlanner';
import { SelfReflectionEngine } from './selfReflectionEngine';
import { RecruiterBrainEngine } from './recruiterBrain';
import { DigitalTwinEngine } from './digitalTwin';
import { EvidenceEngine } from './evidenceEngine';
import { CompetencyCoverageEngine } from './competencyCoverage';
import { RecruiterDecisionEngine } from './recruiterDecision';

export class ConversationDirector {
  /**
   * Initializes a fresh, clean conversation intelligence state
   */
  static initializeState(sessionId: string, personalityId: string): ConversationState {
    const personality = PersonalityEngine.getPersonality(personalityId);
    
    return {
      sessionId,
      isInitialized: true,
      currentTurn: 0,
      contextMemory: ContextMemoryManager.createInitialMemory(),
      pressureLevel: 'Neutral',
      personality,
      recruiterNotes: [],
      coachingData: CoachingEngine.createInitialData(),
      analytics: ConversationAnalyticsManager.createInitialAnalytics(),
      emotionState: EmotionEngine.createInitialState(),
      isCandidateSpeaking: true,
      isThinking: false,
      digitalTwin: DigitalTwinEngine.createInitialTwin(),
      recruiterBrainTurns: [],
      evidenceRecords: [],
      competenciesStatus: CompetencyCoverageEngine.evaluateCoverage([]),
      interviewGenome: []
    };
  }

  /**
   * The master orchestration turn cycle.
   * Processes candidate input, executes all sub-engines sequentially,
   * updates the comprehensive session state, and drafts the tailored prompt directive.
   */
  static processCandidateTurn(
    currentState: ConversationState,
    userInput: string,
    targetRole: string,
    industry: string,
    language: 'English' | 'French' | string,
    cvContextText: string,
    difficulty: 'Easy' | 'Mid' | 'Hard' | string = 'Mid',
    isManualSubmit: boolean = true,
    elapsedTurnSeconds: number = 0,
    totalExpectedQuestions: number = 6
  ): {
    updatedState: ConversationState;
    plannedSystemPrompt: string;
    interruptionPreface: string;
  } {
    const isEng = language === 'English' || language === 'EN' || language === 'en';
    
    // Fallback/Safety state check
    let state = currentState.isInitialized 
      ? { ...currentState } 
      : this.initializeState(currentState.sessionId || 'temp_session', currentState.personality?.id || 'corporate');

    // Handle initial greeting turn (candidate hasn't spoken yet)
    if (userInput.trim().length === 0 && state.currentTurn === 0) {
      state.currentTurn = 1;
      const plannedSystemPrompt = ResponsePlanner.planSystemPrompt(
        state,
        targetRole,
        industry,
        language,
        cvContextText,
        totalExpectedQuestions
      );

      return {
        updatedState: state,
        plannedSystemPrompt,
        interruptionPreface: ""
      };
    }

    // 1. Context Memory Extractor
    state.contextMemory = ContextMemoryManager.extractFromText(userInput, state.contextMemory);

    // 2. Interruption Detection Engine
    const interruptionResult = InterruptionEngine.evaluate(userInput, elapsedTurnSeconds);
    const isInterrupted = interruptionResult.triggered;
    const interruptionPreface = isEng ? interruptionResult.prefaceEN : interruptionResult.prefaceFR;

    if (isInterrupted) {
      state.analytics.interruptionCount += 1;
    }

    // 3. Follow-Up Strategy Analyzer
    const followUpStrategy = FollowUpEngine.analyzeResponse(userInput, state.contextMemory);
    const isFollowUp = (followUpStrategy.category !== 'Clarification');
    
    // Add current follow-up theme to topics already discussed to avoid duplicates
    if (!state.contextMemory.topicsAlreadyDiscussed.includes(followUpStrategy.category)) {
      state.contextMemory.topicsAlreadyDiscussed.push(followUpStrategy.category);
    }

    // 4. Emotional State Assessment
    state.emotionState = EmotionEngine.analyzeText(userInput, state.emotionState);

    // 5. Dynamic Pressure Tuner
    state.pressureLevel = PressureEngine.calculatePressure(
      state.pressureLevel,
      state.emotionState,
      difficulty,
      state.currentTurn
    );

    // 6. Voice & Interaction Coaching Engine (Logged quietly for final scorecard)
    const fillerWordsCount = Object.values(state.coachingData.fillerWordsUsedCount).reduce((a, b) => a + b, 0);
    const starCompletenessScore = state.coachingData.starCompletenessTrend[state.coachingData.starCompletenessTrend.length - 1] || 50;

    state.coachingData = CoachingEngine.evaluateTurn(
      userInput,
      state.emotionState.confidence,
      isInterrupted,
      state.coachingData
    );

    // 7. Continuous Recruiter Notes Engine
    const newNotes = RecruiterNotesManager.generateTurnNotes(
      userInput,
      state.currentTurn,
      starCompletenessScore,
      fillerWordsCount
    );
    state.recruiterNotes = [...state.recruiterNotes, ...newNotes];

    // 8. Turn Transition Manager
    state = TurnManager.transitionToAI(state);

    // 9. Update Conversation Analytics
    // We assume typical turn text lengths for AI will be generated; we'll update words on response saving.
    state.analytics = ConversationAnalyticsManager.updateAnalytics(
      state.analytics,
      userInput,
      "", // Will be updated when AI outputs
      isFollowUp,
      isInterrupted,
      state.pressureLevel,
      elapsedTurnSeconds
    );

    // 9.1 Run Recruiter Brain (Layer 1)
    const currentBrainTurn = RecruiterBrainEngine.processTurn(state, userInput, targetRole);
    state.recruiterBrainTurns = [...(state.recruiterBrainTurns || []), currentBrainTurn];

    // 9.2 Update Candidate Digital Twin (Layer 2)
    state.digitalTwin = DigitalTwinEngine.updateTwin(state, userInput);

    // 9.3 Extract Evidence (Layer 3)
    state.evidenceRecords = EvidenceEngine.extractEvidence(state, userInput);

    // 9.4 Check Competency Coverage (Layer 4)
    state.competenciesStatus = CompetencyCoverageEngine.evaluateCoverage(state.evidenceRecords);
    const coverageDirectives = CompetencyCoverageEngine.getDirectivesForMissingCompetencies(state.competenciesStatus, language);

    // 9.5 Compile Decision (Layer 5)
    state.recruiterDecision = RecruiterDecisionEngine.compileDecision(state);

    // 9.6 Save Genome Segment (SHANA Interview Genome)
    const lastQuestion = state.recruiterNotes[state.recruiterNotes.length - 1]?.textEN || "Please tell me about your background.";
    const currentGenomeTurn: GenomeSegment = {
      turn: state.currentTurn,
      question: lastQuestion,
      competency: currentBrainTurn.competencyVerified,
      evidence: state.evidenceRecords
        .filter(r => r.competency === currentBrainTurn.competencyVerified)
        .map(r => r.description),
      confidence: currentBrainTurn.credibilityScore,
      behavior: `Confidence: ${state.emotionState.confidence}%, Stress: ${state.emotionState.stress}%`,
      outcome: currentBrainTurn.stance === 'challenge' ? 'Pushed with deep-dive challenge' : 'Competency approved, proceeding'
    };
    state.interviewGenome = [...(state.interviewGenome || []), currentGenomeTurn];

    // 9.7 Run Self-Reflection Loop
    const reflectionResult = SelfReflectionEngine.evaluatePerformance(state, userInput, language);
    state.selfReflection = reflectionResult.selfReflection;

    // 10. Generate Response Prompt via ResponsePlanner
    let customizedDirectives = isEng 
      ? `\n[FOLLOW-UP DIRECTIVE (Category: ${followUpStrategy.category})]:\n${followUpStrategy.directiveEN}`
      : `\n[RELANCE DIRECTIVE (Catégorie: ${followUpStrategy.category})]:\n${followUpStrategy.directiveFR}`;

    if (reflectionResult.directivesEN && isEng) {
      customizedDirectives += `\n\n[SELF-REFLECTION RECTIFICATION]:\n${reflectionResult.directivesEN}`;
    } else if (reflectionResult.directivesFR && !isEng) {
      customizedDirectives += `\n\n[SELF-REFLECTION RECTIFICATION]:\n${reflectionResult.directivesFR}`;
    }

    if (coverageDirectives.instructionEN && isEng) {
      customizedDirectives += `\n\n[COMPETENCY RECTIFICATION SCENARIO]:\n${coverageDirectives.instructionEN}`;
    } else if (coverageDirectives.instructionFR && !isEng) {
      customizedDirectives += `\n\n[COMPETENCY RECTIFICATION SCENARIO]:\n${coverageDirectives.instructionFR}`;
    }

    if (isInterrupted) {
      customizedDirectives += isEng
        ? `\n\n[CRITICAL INTERRUPTION EVENT]: You have politely interrupted the candidate. You MUST open your response by acknowledging this interruption politely using this EXACT preface: "${interruptionResult.prefaceEN}" and then proceed straight to your follow-up.`
        : `\n\n[ÉVÈNEMENT D'INTERRUPTION DIRECT]: Vous avez poliment interrompu le candidat. Vous DEVEZ commencer votre réponse par cette phrase EXACTE : "${interruptionResult.prefaceFR}" avant d'enchaîner directement sur votre relance.`;
    }

    const plannedSystemPrompt = ResponsePlanner.planSystemPrompt(
      state,
      targetRole,
      industry,
      language,
      cvContextText + customizedDirectives,
      totalExpectedQuestions
    );

    return {
      updatedState: state,
      plannedSystemPrompt,
      interruptionPreface
    };
  }

  /**
   * Post-response update helper. Call this when the AI response has successfully resolved.
   * This updates the AI word metrics and prepares the state for the candidate's next turn.
   */
  static recordAIResponse(
    currentState: ConversationState,
    aiResponseText: string
  ): ConversationState {
    let state = { ...currentState };
    
    // Register AI words to analytics
    const aiWords = aiResponseText.trim().split(/\s+/).filter(w => w.length > 0).length;
    state.analytics.totalAIWords += aiWords;

    // Transition turn ownership back to candidate
    state = TurnManager.transitionToCandidate(state);

    return state;
  }
}

export interface TurnDetectorConfig {
  silenceThreshold: number;          // Volume level below which is considered silent (default 5-10 out of 100)
  silenceDurationThresholdMs: number; // Duration of continuous silence to trigger transition (e.g., 1500ms)
  minSpeechDurationMs: number;       // Minimum talking duration to establish that candidate actually started speaking (e.g., 1000ms)
  volumeVarianceThreshold: number;   // Threshold of variance below which signal is considered flat/silent (default 1.5 - 2.0)
  historySize: number;               // Number of samples to keep for variance calculation
}

export class TurnDetector {
  private config: TurnDetectorConfig;
  private volumeHistory: number[] = [];
  private silenceStartTime: number | null = null;
  private speechStartTime: number | null = null;
  private hasSpoken: boolean = false;

  constructor(config?: Partial<TurnDetectorConfig>) {
    this.config = {
      silenceThreshold: 10,
      silenceDurationThresholdMs: 1500,
      minSpeechDurationMs: 1000,
      volumeVarianceThreshold: 2.0,
      historySize: 45, // roughly 750ms at 60fps
      ...config
    };
  }

  /**
   * Processes a single volume sample and returns whether a turn completion (Listening -> Analyzing) is triggered.
   * @param volume Current volume (0 to 100)
   * @param timestamp Optional timestamp (defaults to Date.now())
   */
  public feedVolumeSample(volume: number, timestamp: number = Date.now()): boolean {
    // 1. Accumulate history
    this.volumeHistory.push(volume);
    if (this.volumeHistory.length > this.config.historySize) {
      this.volumeHistory.shift();
    }

    // 2. Compute variance and mean
    const n = this.volumeHistory.length;
    let mean = 0;
    let variance = 0;

    if (n > 0) {
      const sum = this.volumeHistory.reduce((acc, v) => acc + v, 0);
      mean = sum / n;
      const squaredDiffsSum = this.volumeHistory.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
      variance = squaredDiffsSum / n;
    }

    // 3. Determine if current frame represents silence.
    // A frame is silent if the volume is below the threshold and there is no significant volume fluctuation (variance is low).
    const isSilenceFrame = volume < this.config.silenceThreshold && variance < this.config.volumeVarianceThreshold;

    if (!isSilenceFrame) {
      // User is actively speaking
      if (!this.hasSpoken) {
        if (this.speechStartTime === null) {
          this.speechStartTime = timestamp;
        } else if (timestamp - this.speechStartTime >= this.config.minSpeechDurationMs) {
          this.hasSpoken = true;
          console.log("[TurnDetector] Active speech detected and validated.");
        }
      }
      // Reset silence startTime as there is activity
      this.silenceStartTime = null;
    } else {
      // User is silent/quiet
      this.speechStartTime = null; // Reset speech start if it was just brief noise < minSpeechDurationMs
      
      if (this.hasSpoken) {
        if (this.silenceStartTime === null) {
          this.silenceStartTime = timestamp;
        } else {
          const silenceDuration = timestamp - this.silenceStartTime;
          if (silenceDuration >= this.config.silenceDurationThresholdMs) {
            console.log(`[TurnDetector] Turn completion triggered: silence duration = ${silenceDuration}ms, variance = ${variance.toFixed(2)}`);
            this.reset();
            return true; // Trigger transition!
          }
        }
      }
    }

    return false;
  }

  public reset(): void {
    this.volumeHistory = [];
    this.silenceStartTime = null;
    this.speechStartTime = null;
    this.hasSpoken = false;
  }

  public setHasSpoken(spoken: boolean): void {
    this.hasSpoken = spoken;
  }

  public getHasSpoken(): boolean {
    return this.hasSpoken;
  }
}

