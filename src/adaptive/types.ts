import { CognitiveLoadState } from '../cognitive/types';

export interface ResponseAction {
  difficultyModifier: number; // -1 (easier), 0 (same), +1 (harder)
  enableHints: boolean;
  reduceDigits: boolean;
  focusMode: boolean; // e.g., hide distractions, slow down
  motivationalMessage: string | null;
}

export interface ResponseContext {
  loadState: CognitiveLoadState;
  skillConfidence: number; // 0.0 to 1.0
  recentErrorRate: number; // 0.0 to 1.0 (last N steps)
  consecutiveSuccesses: number;
}
