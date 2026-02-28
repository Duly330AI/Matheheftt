import { MathSessionState } from '../session/sessionTypes';

export type FocusReason = 'step-start' | 'auto-advance' | 'error' | 'manual';

export type FocusTarget = {
  cellId: string;
  reason: FocusReason;
};

export type AnimationInstruction =
  | { type: 'success-flash'; cells: string[] }
  | { type: 'error-shake'; cells: string[] }
  | { type: 'step-complete' };

export interface FlowEngine {
  getNextFocus(state: MathSessionState): FocusTarget | null;
  shouldAdvanceStep(state: MathSessionState): boolean;
  shouldAutoFocusNext(state: MathSessionState): boolean;
  getAnimation(state: MathSessionState): AnimationInstruction | null;
}
