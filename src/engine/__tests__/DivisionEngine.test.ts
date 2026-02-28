import { describe, it, expect } from 'vitest';
import { DivisionEngine } from '../DivisionEngine';
import { StepState } from '../types';

describe('DivisionEngine', () => {
  const engine = new DivisionEngine();

  describe('generate', () => {
    it('should generate a simple division task without remainder', () => {
      const result = engine.generate({ dividend: 84, divisor: 2 });
      
      expect(result.type).toBe('division');
      expect(result.steps.length).toBeGreaterThan(0);
      
      // Check top row
      const topRow = result.grid[0].map(c => c.value || c.expectedValue).join('').trim();
      expect(topRow).toBe('84 : 2 = 42');
    });

    it('should generate a division task with remainder', () => {
      const result = engine.generate({ dividend: 85, divisor: 2 });
      
      const topRow = result.grid[0].map(c => c.value || c.expectedValue).join('').trim();
      expect(topRow).toBe('85 : 2 = 42 R 1');
      
      // The last step should be the remainder step
      const lastStep = result.steps[result.steps.length - 1];
      expect(lastStep.type).toBe('divide_remainder');
      expect(lastStep.expectedValues).toEqual(['1']);
    });

    it('should handle division by zero', () => {
      expect(() => engine.generate({ dividend: 10, divisor: 0 })).toThrow('Division by zero is not allowed');
    });
  });

  describe('validate', () => {
    it('should detect too large estimate', () => {
      const result = engine.generate({ dividend: 84, divisor: 2 });
      const estimateStep = result.steps.find(s => s.type === 'divide_estimate')!;
      
      const userGrid = JSON.parse(JSON.stringify(result.grid));
      // User enters 5 instead of 4
      userGrid[estimateStep.targetCells[0].r][estimateStep.targetCells[0].c].value = '5';
      
      const state: StepState = {
        userGrid,
        expectedGrid: result.grid,
        currentStep: estimateStep,
      };
      
      const validation = engine.validate(state);
      expect(validation.correct).toBe(false);
      expect(validation.hints?.[0].messageKey).toBe('division_estimate_too_large');
    });

    it('should detect too small estimate', () => {
      const result = engine.generate({ dividend: 84, divisor: 2 });
      const estimateStep = result.steps.find(s => s.type === 'divide_estimate')!;
      
      const userGrid = JSON.parse(JSON.stringify(result.grid));
      // User enters 3 instead of 4
      userGrid[estimateStep.targetCells[0].r][estimateStep.targetCells[0].c].value = '3';
      
      const state: StepState = {
        userGrid,
        expectedGrid: result.grid,
        currentStep: estimateStep,
      };
      
      const validation = engine.validate(state);
      expect(validation.correct).toBe(false);
      expect(validation.hints?.[0].messageKey).toBe('division_estimate_too_small');
    });

    it('should detect multiply error', () => {
      const result = engine.generate({ dividend: 84, divisor: 2 });
      const multiplyStep = result.steps.find(s => s.type === 'divide_multiply')!;
      
      const userGrid = JSON.parse(JSON.stringify(result.grid));
      // User enters 9 instead of 8
      userGrid[multiplyStep.targetCells[0].r][multiplyStep.targetCells[0].c].value = '9';
      
      const state: StepState = {
        userGrid,
        expectedGrid: result.grid,
        currentStep: multiplyStep,
      };
      
      const validation = engine.validate(state);
      expect(validation.correct).toBe(false);
      expect(validation.hints?.[0].messageKey).toBe('multiply_error');
    });
  });
});
