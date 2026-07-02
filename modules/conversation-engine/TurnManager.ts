import { TurnState, TurnMemory } from "./types";

export class TurnManager {
  private state: TurnState = "idle";
  private memory: TurnMemory = {
    lastSpeaker: "none",
    interruptionCount: 0,
    responseState: "normal",
    resumePosition: 0,
    totalTurns: 0,
  };

  private stateChangeListeners: Set<(state: TurnState) => void> = new Set();

  public getState(): TurnState {
    return this.state;
  }

  public transitionTo(newState: TurnState): void {
    if (this.state === newState) return;
    console.log(`[TurnManager] State transition: ${this.state} -> ${newState}`);
    this.state = newState;

    if (newState === "ai_speaking") {
      this.memory.lastSpeaker = "ai";
    } else if (newState === "candidate_speaking") {
      this.memory.lastSpeaker = "candidate";
    } else if (newState === "interrupted") {
      this.memory.interruptionCount++;
    }

    this.notifyListeners();
  }

  public getMemory(): TurnMemory {
    return { ...this.memory };
  }

  public setResponseState(resState: TurnMemory["responseState"]): void {
    this.memory.responseState = resState;
  }

  public setResumePosition(pos: number): void {
    this.memory.resumePosition = pos;
  }

  public incrementTurns(): void {
    this.memory.totalTurns++;
  }

  public subscribe(callback: (state: TurnState) => void): () => void {
    this.stateChangeListeners.add(callback);
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  public reset(): void {
    this.state = "idle";
    this.memory = {
      lastSpeaker: "none",
      interruptionCount: 0,
      responseState: "normal",
      resumePosition: 0,
      totalTurns: 0,
    };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error("[TurnManager] Listener notification error:", err);
      }
    });
  }
}
