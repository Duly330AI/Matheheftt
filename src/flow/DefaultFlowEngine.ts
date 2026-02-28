import { MathSessionState } from '../session/sessionTypes';
import { FlowEngine, FocusTarget, AnimationInstruction } from './types';

export class DefaultFlowEngine implements FlowEngine {
  public getNextFocus(state: MathSessionState): FocusTarget | null {
    if (state.status === 'finished') {
      return null;
    }

    const currentStep = state.steps[state.currentStepIndex];
    if (!currentStep) return null;

    // 1. Error Correction Focus
    // If we are in an error state, focus the first highlighted cell that is editable
    if (state.status === 'error' && state.highlights.length > 0) {
      for (const highlightStr of state.highlights) {
        const [r, c] = highlightStr.split(',').map(Number);
        const cell = state.grid[r]?.[c];
        if (cell && cell.isEditable) {
          return {
            cellId: cell.id,
            reason: 'error',
          };
        }
      }
      
      // If no highlighted cell is editable, focus the first target cell
      for (const pos of currentStep.targetCells) {
        const cell = state.grid[pos.r]?.[pos.c];
        if (cell && cell.isEditable) {
          return {
            cellId: cell.id,
            reason: 'error',
          };
        }
      }
    }

    // 2. Step Start / Auto Advance Focus
    // Find the first target cell that is empty
    for (const pos of currentStep.targetCells) {
      const cell = state.grid[pos.r]?.[pos.c];
      if (cell && cell.value === '') {
        return {
          cellId: cell.id,
          reason: state.status === 'solving' ? 'auto-advance' : 'step-start', // Simplified reason logic
        };
      }
    }

    // 3. If all target cells are filled but we haven't validated yet (or are in correct state)
    // we might not want to focus anything, or focus the last filled cell.
    // For now, return null to remove focus and let the user press Enter or wait for auto-advance.
    return null;
  }

  public shouldAdvanceStep(state: MathSessionState): boolean {
    // Only advance if the state is explicitly 'correct'
    return state.status === 'correct';
  }

  public shouldAutoFocusNext(state: MathSessionState): boolean {
    // In a real app, this could depend on a user profile (e.g., speed adaptation).
    // For now, we auto-focus if we are in solving or error state and there's an empty cell.
    return state.status === 'solving' || state.status === 'error';
  }

  public getAnimation(state: MathSessionState): AnimationInstruction | null {
    if (state.status === 'error') {
      return {
        type: 'error-shake',
        cells: state.highlights,
      };
    }

    if (state.status === 'correct') {
      const currentStep = state.steps[state.currentStepIndex];
      if (currentStep) {
        return {
          type: 'success-flash',
          cells: currentStep.targetCells.map(pos => `${pos.r},${pos.c}`),
        };
      }
    }

    if (state.status === 'finished') {
      return {
        type: 'step-complete',
      };
    }

    return null;
  }
}
