import { describe, it, expect } from 'vitest';
import { SubtractionEngine, SubtractionConfig } from '../SubtractionEngine';
import { runGenericEngineTests, TestCase } from './testHarness';

describe('SubtractionEngine', () => {
  const engine = new SubtractionEngine();

  const genericCases: TestCase<SubtractionConfig>[] = [
    { name: 'Simple subtraction (borrow)', config: { minuend: 45, subtrahend: 12, method: 'borrow' } },
    { name: 'Subtraction with borrow (borrow)', config: { minuend: 42, subtrahend: 15, method: 'borrow' } },
    { name: 'Subtraction with multiple borrows (borrow)', config: { minuend: 304, subtrahend: 125, method: 'borrow' } },
    { name: 'Simple subtraction (complement)', config: { minuend: 45, subtrahend: 12, method: 'complement' } },
    { name: 'Subtraction with carry (complement)', config: { minuend: 42, subtrahend: 15, method: 'complement' } },
    { name: 'Subtraction with multiple carries (complement)', config: { minuend: 304, subtrahend: 125, method: 'complement' } },
  ];

  runGenericEngineTests('SubtractionEngine', engine, genericCases);

  describe('Specific Logic Tests - Borrow Method', () => {
    it('should generate correct steps for 304 - 125', () => {
      const result = engine.generate({ minuend: 304, subtrahend: 125, method: 'borrow' });

      expect(result.type).toBe('subtraction');
      expect(result.meta.rows).toBe(6);
      expect(result.meta.cols).toBe(4); // 3 digits + 1 for '-'

      const grid = result.grid;
      
      // Row 1: 304
      expect(grid[1][1].expectedValue).toBe('3');
      expect(grid[1][2].expectedValue).toBe('0');
      expect(grid[1][3].expectedValue).toBe('4');

      // Row 2: - 125
      expect(grid[2][0].expectedValue).toBe('-');
      expect(grid[2][1].expectedValue).toBe('1');
      expect(grid[2][2].expectedValue).toBe('2');
      expect(grid[2][3].expectedValue).toBe('5');

      // Row 0: Borrows
      // After borrowing from 3 to 0, then 10 to 4:
      // 3 becomes 2
      expect(grid[0][1].expectedValue).toBe('2');
      // 0 becomes 10, then 9
      expect(grid[0][2].expectedValue).toBe('9');
      // 4 becomes 14
      expect(grid[0][3].expectedValue).toBe('14');

      // Row 4: Result
      expect(grid[4][3].expectedValue).toBe('9'); // 14 - 5
      expect(grid[4][2].expectedValue).toBe('7'); // 9 - 2
      expect(grid[4][1].expectedValue).toBe('1'); // 2 - 1
    });
  });

  describe('Specific Logic Tests - Complement Method', () => {
    it('should generate correct steps for 304 - 125', () => {
      const result = engine.generate({ minuend: 304, subtrahend: 125, method: 'complement' });

      expect(result.type).toBe('subtraction');
      expect(result.meta.rows).toBe(6);
      expect(result.meta.cols).toBe(4); // 3 digits + 1 for '-'

      const grid = result.grid;
      
      // Row 0: 304
      expect(grid[0][1].expectedValue).toBe('3');
      expect(grid[0][2].expectedValue).toBe('0');
      expect(grid[0][3].expectedValue).toBe('4');

      // Row 1: - 125
      expect(grid[1][0].expectedValue).toBe('-');
      expect(grid[1][1].expectedValue).toBe('1');
      expect(grid[1][2].expectedValue).toBe('2');
      expect(grid[1][3].expectedValue).toBe('5');

      // Row 3: Carries
      expect(grid[3][2].expectedValue).toBe('1'); // carry from 4 - 5
      expect(grid[3][1].expectedValue).toBe('1'); // carry from 0 - 2 - 1

      // Row 4: Result
      expect(grid[4][3].expectedValue).toBe('9'); // 14 - 5
      expect(grid[4][2].expectedValue).toBe('7'); // 10 - 2 - 1
      expect(grid[4][1].expectedValue).toBe('1'); // 3 - 1 - 1
    });
  });
});
