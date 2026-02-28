import { GridMatrix, Step, StepResult, ErrorType } from '../engine/types';

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
  errorType?: ErrorType | null;
  stepResult: StepResult | null;
};

export type SessionSnapshot = {
  state: MathSessionState;
  timestamp: number;
};
