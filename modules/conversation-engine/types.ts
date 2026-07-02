export type TurnState = 
  | "idle"
  | "ai_speaking"
  | "candidate_speaking"
  | "interrupted"
  | "waiting"
  | "processing";

export interface TurnMemory {
  lastSpeaker: "ai" | "candidate" | "none";
  interruptionCount: number;
  responseState: "normal" | "early_answered" | "hesitating" | "clarifying";
  resumePosition: number; // character index or progress ratio
  totalTurns: number;
}
