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

    // Check if all target cells for the current step are filled
    const allFilled = currentStep.targetCells.every(
      pos => newGrid[pos.r][pos.c].value !== ''
    );

    if (allFilled) {
      const stepState: StepState = {
        userGrid: newGrid,
        expectedGrid: this.state.expectedGrid,
        currentStep,
      };

      const validation = this.engine.validate(stepState);

      if (validation.correct) {
        // Mark target cells as correct
        const correctGrid = newGrid.map((row, r) => row.map((cell, c) => {
             // Check if cell is part of current step target cells
             const isTarget = currentStep.targetCells.some(pos => pos.r === r && pos.c === c);
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
      } else {
        const highlights = validation.hints?.[0]?.highlightCells.map(pos => `${pos.r},${pos.c}`) || [];
        const hintMessageKey = validation.hints?.[0]?.messageKey || 'hint_error';
        const hintMessage = validation.hints?.[0]?.message || null;
        const hintSeverity = validation.hints?.[0]?.severity || 'procedural';
        const hintSkillTag = validation.hints?.[0]?.skillTag;
        const errorType = validation.errorType;

        this.transition('error', {
          grid: newGrid,
          highlights,
          hintMessageKey,
          hintMessage,
          hintSeverity,
          hintSkillTag,
          errorType,
        });
      }
    } else {
      // Still solving, just updated the grid
      this.transition('solving', {
        grid: newGrid,
        highlights: [],
        hintMessageKey: null,
        hintMessage: null,
        hintSeverity: 'none',
        hintSkillTag: undefined,
        errorType: null,
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
