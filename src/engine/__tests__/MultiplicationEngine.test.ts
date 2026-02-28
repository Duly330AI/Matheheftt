import { describe, it, expect } from 'vitest';
import { MultiplicationEngine, MultiplicationConfig } from '../MultiplicationEngine';
import { runGenericEngineTests, TestCase } from './testHarness';

describe('MultiplicationEngine', () => {
  const engine = new MultiplicationEngine();

  const genericCases: TestCase<MultiplicationConfig>[] = [
    { name: 'Simple multiplication (single digit)', config: { multiplicand: 45, multiplier: 2 } },
    { name: 'Multiplication with two digits', config: { multiplicand: 345, multiplier: 12 } },
    { name: 'Multiplication with zero', config: { multiplicand: 304, multiplier: 20 } },
  ];

  runGenericEngineTests('MultiplicationEngine', engine, genericCases);

  describe('Specific Logic Tests', () => {
    it('should generate correct steps for 345 * 12', () => {
      const result = engine.generate({ multiplicand: 345, multiplier: 12 });

      expect(result.type).toBe('multiplication');
      // Rows: 2 (carries) + 1 (top) + 1 (sep) + 2 (partials) + 1 (sep) + 1 (carry) + 1 (result) = 9
      expect(result.meta.rows).toBe(9);
      
      const grid = result.grid;
      
      // Row 2: 345 * 12
      // Top row string: "345 * 12" length 8
      // Product: 4140 length 4
      // cols = max(8, 4+1) = 8
      expect(result.meta.cols).toBe(8);

      // Partial 1: 3450
      expect(grid[4][4].expectedValue).toBe('3');
      expect(grid[4][5].expectedValue).toBe('4');
      expect(grid[4][6].expectedValue).toBe('5');
      expect(grid[4][7].expectedValue).toBe('0');

      // Partial 2: 690
      expect(grid[5][5].expectedValue).toBe('6');
      expect(grid[5][6].expectedValue).toBe('9');
      expect(grid[5][7].expectedValue).toBe('0');

      // Result: 4140
      expect(grid[8][4].expectedValue).toBe('4');
      expect(grid[8][5].expectedValue).toBe('1');
      expect(grid[8][6].expectedValue).toBe('4');
      expect(grid[8][7].expectedValue).toBe('0');
    });
  });
});
