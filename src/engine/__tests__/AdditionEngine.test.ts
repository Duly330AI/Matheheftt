import { describe, it, expect } from 'vitest';
import { AdditionEngine, AdditionConfig } from '../AdditionEngine';
import { StepState, GridMatrix } from '../types';
import { runGenericEngineTests, TestCase } from './testHarness';

describe('AdditionEngine', () => {
  const engine = new AdditionEngine();

  const genericCases: TestCase<AdditionConfig>[] = [
    { name: 'Simple addition without carry', config: { operands: [12, 34] } },
    { name: 'Addition with carry', config: { operands: [345, 678] } },
    { name: 'Different length operands', config: { operands: [12, 345] } },
    { name: 'Multiple operands', config: { operands: [12, 34, 56] } },
    { name: 'Zeros', config: { operands: [100, 200] } },
  ];

  runGenericEngineTests('AdditionEngine', engine, genericCases);

  describe('Specific Logic Tests', () => {
    it('should generate correct grid and steps for 345 + 678', () => {
      const result = engine.generate({ operands: [345, 678] });

      expect(result.type).toBe('addition');
      expect(result.meta.rows).toBe(5); // 2 operands + 1 sep + 1 carry + 1 result
      expect(result.meta.cols).toBe(5); // maxDigits(1023) = 4 + 1 for '+'

      // Check grid layout
      const grid = result.grid;
      
      // Row 0: 345
      expect(grid[0][2].expectedValue).toBe('3');
      expect(grid[0][3].expectedValue).toBe('4');
      expect(grid[0][4].expectedValue).toBe('5');

      // Row 1: + 678
      expect(grid[1][0].expectedValue).toBe('+');
      expect(grid[1][2].expectedValue).toBe('6');
      expect(grid[1][3].expectedValue).toBe('7');
      expect(grid[1][4].expectedValue).toBe('8');

      // Row 2: Separator
      expect(grid[2][0].role).toBe('separator');

      // Row 3: Carries
      expect(grid[3][3].expectedValue).toBe('1'); // carry from 5+8
      expect(grid[3][2].expectedValue).toBe('1'); // carry from 4+7+1
      expect(grid[3][1].expectedValue).toBe('1'); // carry from 3+6+1

      // Row 4: Result
      expect(grid[4][4].expectedValue).toBe('3');
      expect(grid[4][3].expectedValue).toBe('2');
      expect(grid[4][2].expectedValue).toBe('0');
      expect(grid[4][1].expectedValue).toBe('1');
    });

    it('should handle numbers with different lengths', () => {
      const result = engine.generate({ operands: [12, 345] });

      const grid = result.grid;
      // Row 0: 12
      expect(grid[0][2].expectedValue).toBe('1');
      expect(grid[0][3].expectedValue).toBe('2');

      // Row 1: + 345
      expect(grid[1][0].expectedValue).toBe('+');
      expect(grid[1][1].expectedValue).toBe('3');
      expect(grid[1][2].expectedValue).toBe('4');
      expect(grid[1][3].expectedValue).toBe('5');
    });

    it('should validate a correct step', () => {
      const result = engine.generate({ operands: [12, 34] });
      const currentStep = result.steps[0]; // add_col_3 (2 + 4 = 6)

      // Create a user grid with the correct answer
      const userGrid: GridMatrix = JSON.parse(JSON.stringify(result.grid));
      userGrid[currentStep.targetCells[0].r][currentStep.targetCells[0].c].value = '6';

      const stepState: StepState = {
        userGrid,
        expectedGrid: result.grid,
        currentStep,
      };

      const validation = engine.validate(stepState);
      expect(validation.correct).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should validate an incorrect step and provide hints', () => {
      const result = engine.generate({ operands: [12, 34] });
      const currentStep = result.steps[0]; // add_col_3 (2 + 4 = 6)

      // Create a user grid with an incorrect answer
      const userGrid: GridMatrix = JSON.parse(JSON.stringify(result.grid));
      userGrid[currentStep.targetCells[0].r][currentStep.targetCells[0].c].value = '7';

      const stepState: StepState = {
        userGrid,
        expectedGrid: result.grid,
        currentStep,
      };

      const validation = engine.validate(stepState);
      expect(validation.correct).toBe(false);
      expect(validation.errors.length).toBe(1);
      expect(validation.errors[0].expected).toBe('6');
      expect(validation.errors[0].actual).toBe('7');
      
      expect(validation.hints?.length).toBe(1);
      expect(validation.hints?.[0].messageKey).toBe('hint_add_column_error');
      // Dependencies should be the two cells added: (0, 2) and (1, 2)
      expect(validation.hints?.[0].highlightCells).toEqual([
        { r: 0, c: 2 },
        { r: 1, c: 2 },
      ]);
    });
  });
});
