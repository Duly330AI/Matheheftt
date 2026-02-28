import { GridMatrix, Step, StepResult } from '../engine/types';

export type MathSessionStatus = 'idle' | 'generated' | 'solving' | 'error' | 'correct' | 'finished';

export type MathSessionState = {
  status: MathSessionStatus;
  grid: GridMatrix;
  expectedGrid: GridMatrix;
  steps: Step[];
  currentStepIndex: number;
  highlights: string[];
  hintMessageKey: string | null;
  hintMessage?: string | null;
  hintSeverity?: 'minor' | 'procedural' | 'conceptual' | 'none';
  hintSkillTag?: string;
  stepResult: StepResult | null;
};

export type SessionSnapshot = {
  state: MathSessionState;
  timestamp: number;
};
