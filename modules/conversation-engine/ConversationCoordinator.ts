import { TurnManager } from "./TurnManager";
import { InterruptionDetector } from "./InterruptionDetector";
import { SpeechQueue, SpeechItem } from "./SpeechQueue";
import { ResumeController } from "./ResumeController";
import { TurnState, TurnMemory } from "./types";

export class ConversationCoordinator {
  public turnManager: TurnManager;
  public interruptionDetector: InterruptionDetector;
  public speechQueue: SpeechQueue;
  public resumeController: ResumeController;

  private clarificationCount: number = 0;
  private lastInputTime: number = 0;
  private isFrenchMode: boolean = false;

  constructor() {
    this.turnManager = new TurnManager();
    this.interruptionDetector = new InterruptionDetector();
    this.speechQueue = new SpeechQueue();
    this.resumeController = new ResumeController();
  }

  public setLanguage(language: string): void {
    this.isFrenchMode = language?.toLowerCase().includes("fren") || language?.toLowerCase() === "fr";
  }

  /**
   * Rule 1: User interrupts AI
   * Called immediately when candidate starts speaking.
   */
  public handleCandidateSpeechStart(currentTranscript: string): boolean {
    const currentState = this.turnManager.getState();
    const isAiSpeaking = currentState === "ai_speaking";

    if (isAiSpeaking && this.interruptionDetector.isInterruption(currentTranscript, true)) {
      console.log("[ConversationCoordinator] Interruption detected! Executing Rule 1 (Stop AI and switch turn).");
      
      // Stop and save position for possible resume (Rule 7)
      const interrupted = this.speechQueue.stopAndSavePosition();
      if (interrupted) {
        this.turnManager.setResumePosition(interrupted.position);
      }

      this.turnManager.transitionTo("interrupted");
      this.turnManager.transitionTo("candidate_speaking");
      return true; // Successfully handled interruption
    }

    return false;
  }

  /**
   * Called to register user's active speaking/silence timer.
   */
  public updateLastInputTime(): void {
    this.lastInputTime = Date.now();
  }

  /**
   * Rule 3: Hesitation Detection & Handling
   */
  public handleHesitation(transcript: string): { isHesitating: boolean; nudgeText?: string } {
    const isHesitating = this.interruptionDetector.detectHesitation(transcript, this.isFrenchMode);
    
    if (isHesitating) {
      console.log("[ConversationCoordinator] Hesitation detected in speech. Delaying response (Rule 3).");
      this.turnManager.setResponseState("hesitating");
      
      const nudgeText = this.isFrenchMode 
        ? "Prenez votre temps..." 
        : "Take your time...";
        
      return { isHesitating: true, nudgeText };
    }

    return { isHesitating: false };
  }

  /**
   * Rule 4: Smart Waiting
   * Returns wait duration in milliseconds before follow-up / speaking to sound natural.
   */
  public getWaitingTimeMs(windowType: "short" | "normal" | "extended"): number {
    switch (windowType) {
      case "short":
        return 1000; // 1s
      case "normal":
        return 2000; // 2s
      case "extended":
        return 4000; // 4s
      default:
        return 2000;
    }
  }

  /**
   * Rule 6: Clarification Mode
   * Check if we should clarify. Maximum of one clarification per turn or answer.
   */
  public shouldRequestClarification(transcript: string): boolean {
    if (this.clarificationCount >= 1) return false;

    const text = transcript.trim().toLowerCase();
    if (!text) return false;

    // Check if the answer is extremely short or vague
    const words = text.split(/\s+/);
    if (words.length <= 3) {
      this.clarificationCount++;
      return true;
    }

    // Common vague answers
    const vaguePhrases = this.isFrenchMode
      ? ["je ne sais pas", "pas sûr", "peut-être", "oui", "non", "bof"]
      : ["i don't know", "not sure", "maybe", "yes", "no", "idk"];

    if (vaguePhrases.includes(text)) {
      this.clarificationCount++;
      return true;
    }

    return false;
  }

  public getClarificationPhrase(): string {
    if (this.isFrenchMode) {
      return "Pourriez-vous préciser votre pensée ou donner un exemple ?";
    } else {
      return "Could you explain that in more detail or provide a quick example?";
    }
  }

  public resetClarificationCount(): void {
    this.clarificationCount = 0;
  }

  /**
   * Rule 2: Early Answers
   * Checks if candidate answered before AI finished speaking.
   */
  public handleCandidateAnswer(
    finalTranscript: string,
    wasAiInterrupted: boolean
  ): { action: "continue" | "clarify" | "move_next"; response?: string } {
    
    this.turnManager.transitionTo("processing");

    // Clear speech queue to prevent any delayed audio overlap (Rule 5)
    this.speechQueue.clear();

    const text = finalTranscript.trim();
    if (!text) {
      return { action: "continue" };
    }

    // Rule 6: Clarification check
    if (this.shouldRequestClarification(text)) {
      this.turnManager.setResponseState("clarifying");
      return { 
        action: "clarify", 
        response: this.getClarificationPhrase() 
      };
    }

    // Rule 2: Check if AI was interrupted with an early answer
    if (wasAiInterrupted) {
      this.turnManager.setResponseState("early_answered");
      console.log("[ConversationCoordinator] Early answer captured. AI adapting response.");
      
      const ackResponse = this.isFrenchMode ? "Entendu. Passons à la suite." : "Understood. Let's move on.";
      return { action: "move_next", response: ackResponse };
    }

    this.turnManager.setResponseState("normal");
    return { action: "continue" };
  }

  /**
   * Helper to clean up all active speech states
   */
  public terminateCurrentTurn(): void {
    this.speechQueue.clear();
    this.turnManager.transitionTo("idle");
  }

  public reset(): void {
    this.turnManager.reset();
    this.speechQueue.clear();
    this.clarificationCount = 0;
    this.lastInputTime = 0;
  }
}
