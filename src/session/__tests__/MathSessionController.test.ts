import { describe, it, expect, beforeEach } from 'vitest';
import { MathSessionController } from '../MathSessionController';
import { engineRegistry, MathEngine } from '../../engine';

describe('MathSessionController', () => {
  let controller: MathSessionController<any>;
  let engine: MathEngine<any>;

  beforeEach(() => {
    engine = engineRegistry.get('addition').create();
    controller = new MathSessionController(engine);
  });

  it('starts in idle state', () => {
    const state = controller.getState();
    expect(state.status).toBe('idle');
    expect(state.grid.length).toBe(0);
  });

  it('generates problem and transitions to solving', () => {
    controller.start({ operands: [12, 34] });
    const state = controller.getState();
    
    expect(state.status).toBe('solving');
    expect(state.steps.length).toBeGreaterThan(0);
    expect(state.currentStepIndex).toBe(0);
    expect(state.grid.length).toBeGreaterThan(0);
    expect(state.expectedGrid.length).toBeGreaterThan(0);
  });

  it('advances step when correct', () => {
    controller.start({ operands: [12, 34] });
    let state = controller.getState();
    
    const currentStep = state.steps[state.currentStepIndex];
    const targetCell = currentStep.targetCells[0];
    const expectedValue = currentStep.expectedValues[0];
    const cellId = state.grid[targetCell.r][targetCell.c].id;

    // Input correct value
    controller.input(cellId, expectedValue);
    state = controller.getState();
    
    expect(state.status).toBe('correct');
    expect(state.highlights.length).toBe(0);

    // Call next to advance
    controller.next();
    state = controller.getState();
    
    expect(state.status).toBe('solving');
    expect(state.currentStepIndex).toBe(1);
  });

  it('does not advance when incorrect and sets highlights', () => {
    controller.start({ operands: [12, 34] });
    let state = controller.getState();
    
    const currentStep = state.steps[state.currentStepIndex];
    const targetCell = currentStep.targetCells[0];
    const cellId = state.grid[targetCell.r][targetCell.c].id;

    // Input incorrect value
    controller.input(cellId, '9');
    state = controller.getState();
    
    expect(state.status).toBe('error');
    expect(state.highlights.length).toBeGreaterThan(0);
    expect(state.hintMessageKey).toBeDefined();
    expect(state.currentStepIndex).toBe(0); // Did not advance
  });

  it('finishes after last step', () => {
    controller.start({ operands: [12, 34] });
    let state = controller.getState();
    
    // Complete all steps
    while (state.currentStepIndex < state.steps.length) {
      const currentStep = state.steps[state.currentStepIndex];
      const targetCell = currentStep.targetCells[0];
      const expectedValue = currentStep.expectedValues[0];
      const cellId = state.grid[targetCell.r][targetCell.c].id;

      controller.input(cellId, expectedValue);
      state = controller.getState();
      expect(state.status).toBe('correct');
      
      controller.next();
      state = controller.getState();
      
      if (state.status === 'finished') {
        break;
      }
    }

    expect(state.status).toBe('finished');
  });

  it('can reset the session', () => {
    controller.start({ operands: [12, 34] });
    controller.reset();
    const state = controller.getState();
    expect(state.status).toBe('idle');
    expect(state.grid.length).toBe(0);
  });
});
