import { MathEngine, StepState, GridMatrix } from '../engine/types';
import { MathSessionState, MathSessionStatus, SessionSnapshot } from './sessionTypes';

export class MathSessionController<TConfig = any> {
  private engine: MathEngine<TConfig>;
  private state: MathSessionState;
  private history: SessionSnapshot[] = [];

  constructor(engine: MathEngine<TConfig>) {
    this.engine = engine;
    this.state = this.getInitialState();
  }

  private getInitialState(): MathSessionState {
    return {
      status: 'idle',
      grid: [],
      expectedGrid: [],
      steps: [],
      currentStepIndex: 0,
      highlights: [],
      hintMessageKey: null,
      hintMessage: null,
      stepResult: null,
    };
  }

  private saveSnapshot() {
    this.history.push({
      state: JSON.parse(JSON.stringify(this.state)), // Deep copy for immutability
      timestamp: Date.now(),
    });
  }

  private transition(newStatus: MathSessionStatus, updates: Partial<MathSessionState> = {}) {
    this.saveSnapshot();
    this.state = {
      ...this.state,
      ...updates,
      status: newStatus,
    };
  }

  public start(config: TConfig): void {
    const stepResult = this.engine.generate(config);

    // Create an empty user grid based on the generated grid
    const userGrid: GridMatrix = JSON.parse(JSON.stringify(stepResult.grid));
    for (let r = 0; r < userGrid.length; r++) {
      for (let c = 0; c < userGrid[r].length; c++) {
        if (userGrid[r][c].isEditable) {
          userGrid[r][c].value = '';
        }
      }
    }

    this.transition('generated', {
      grid: userGrid,
      expectedGrid: stepResult.grid,
      steps: stepResult.steps,
      currentStepIndex: 0,
      highlights: [],
      hintMessageKey: null,
      hintMessage: null,
      stepResult,
    });

    // Move immediately to solving state
    this.transition('solving');
  }

  public input(cellId: string, value: string): void {
    if (this.state.status !== 'solving' && this.state.status !== 'error') {
      return;
    }

    const currentStep = this.state.steps[this.state.currentStepIndex];
    if (!currentStep) return;

    // Update the grid
    const newGrid = this.state.grid.map(row => [...row]);
    let cellUpdated = false;

    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[r].length; c++) {
        if (newGrid[r][c].id === cellId) {
          newGrid[r][c] = { ...newGrid[r][c], value };
          cellUpdated = true;
        }
      }
    }

    if (!cellUpdated) return;

    // Validate immediately on every input change to provide instant feedback.
    // The engine is responsible for handling incomplete inputs gracefully (e.g. via prefix matching).
    this.validateStep(newGrid);
  }

  public validateStep(gridToValidate?: GridMatrix): void {
      if (this.state.status !== 'solving' && this.state.status !== 'error') return;
      
      const currentStep = this.state.steps[this.state.currentStepIndex];
      if (!currentStep) return;

      const newGrid = gridToValidate || this.state.grid;

      const stepState: StepState = {
        userGrid: newGrid,
        expectedGrid: this.state.expectedGrid,
        currentStep,
      };

      const validation = this.engine.validate(stepState);
      
      console.log('Validation Result:', validation);

      if (validation.correct) {
        // Mark target cells as correct
        const correctGrid = newGrid.map((row, r) => row.map((cell, c) => {
             // Check if cell is part of current step target cells
             const isTarget = currentStep.targetCells.some(pos => pos.r === r && pos.c === c);
             // For insert_parentheses, mark ALL non-empty algebra terms in row 1 as correct
             if (currentStep.type === 'insert_parentheses' && r === 1 && cell.role === 'algebra_term' && cell.value) {
                 return { ...cell, status: 'correct' as const };
             }
             if (isTarget) {
                 return { ...cell, status: 'correct' as const };
             }
             return cell;
        }));

        this.transition('correct', {
          grid: correctGrid,
          highlights: [],
          hintMessageKey: null,
          hintMessage: null,
          hintSeverity: 'none',
          hintSkillTag: undefined,
          errorType: null,
        });
        console.log('State status after transition:', this.state.status);
      } else {
        let highlights = validation.hints?.[0]?.highlightCells.map(pos => `${pos.r},${pos.c}`) || [];
        
        // Fallback: If engine didn't provide highlights but we have an error, highlight the target cells
        if (highlights.length === 0 && validation.errorType) {
             highlights = currentStep.targetCells.map(pos => `${pos.r},${pos.c}`);
        }

        // Mark incorrect cells in the grid
        const errorGrid = newGrid.map((row, r) => row.map((cell, c) => {
            // Check if this cell is part of the error highlights OR is a target cell that is wrong
            // For simplicity, if we are in error state, any filled target cell that isn't correct is potentially incorrect.
            // But better: use the validation errors if available.
            
            const isErrorCell = validation.errors.some(e => e.position.r === r && e.position.c === c);
            
            if (isErrorCell) {
                return { ...cell, status: 'incorrect' as const };
            }
            return cell;
        }));

        const hintMessageKey = validation.hints?.[0]?.messageKey || 'hint_error';
        const hintMessage = validation.hints?.[0]?.message || null;
        const hintSeverity = validation.hints?.[0]?.severity || 'procedural';
        const hintSkillTag = validation.hints?.[0]?.skillTag;
        const errorType = validation.errorType;

        this.transition('error', {
          grid: errorGrid,
          highlights,
          hintMessageKey,
          hintMessage,
          hintSeverity,
          hintSkillTag,
          errorType,
        });
      }
  }

  public next(): void {
    if (this.state.status !== 'correct') {
      return;
    }

    const nextIndex = this.state.currentStepIndex + 1;
    if (nextIndex < this.state.steps.length) {
      this.transition('solving', {
        currentStepIndex: nextIndex,
      });
    } else {
      this.transition('finished');
    }
  }

  public reset(): void {
    this.saveSnapshot();
    this.state = this.getInitialState();
  }

  public clearUserInputs(): void {
    if (this.state.status !== 'solving' && this.state.status !== 'error') return;

    this.saveSnapshot();

    const newGrid = this.state.grid.map(row => row.map(cell => {
      if (cell.isEditable) {
        return { ...cell, value: '' };
      }
      return cell;
    }));

    this.state = {
      ...this.state,
      grid: newGrid,
      status: 'solving',
      highlights: [],
      hintMessageKey: null,
      hintMessage: null
    };
  }

  public getState(): MathSessionState {
    return this.state;
  }

  public undo(): void {
    if (this.history.length > 0) {
      const snapshot = this.history.pop();
      if (snapshot) {
        this.state = snapshot.state;
      }
    }
  }
}
