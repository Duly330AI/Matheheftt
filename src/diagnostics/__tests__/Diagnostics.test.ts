import { describe, it, expect } from 'vitest';
import { EngineValidator } from '../EngineValidator';
import { MathEngine, StepResult, Step, GridMatrix, StepState, ValidationResult } from '../../engine/types';
import { PerformanceMonitor } from '../PerformanceMonitor';

class MockEngine implements MathEngine {
  generate(config: any): StepResult {
    return {
      type: 'addition',
      meta: { rows: 2, cols: 1, resultRow: 1, workingAreaStartRow: 0 },
      metadata: { difficulty: 1 },
      grid: [
        [{ id: '0,0', role: 'digit', value: '1', expectedValue: '1', isEditable: false }],
        [{ id: '1,0', role: 'digit', value: '2', expectedValue: '2', isEditable: false }]
      ],
      steps: [
        {
          id: 'step_1',
          type: 'add_column',
          targetCells: [{ r: 0, c: 0 }],
          expectedValues: ['1'],
          explanationKey: 'add',
          nextFocus: null,
          dependencies: []
        }
      ]
    };
  }
  validate(stepState: StepState): ValidationResult {
    return { correct: true, errors: [], hints: [] };
  }
}

class BadMockEngine implements MathEngine {
  generate(config: any): StepResult {
    return {
      type: 'addition',
      meta: { rows: 1, cols: 1, resultRow: 0, workingAreaStartRow: 0 },
      metadata: { difficulty: 1 },
      grid: [
        [{ id: '0,0', role: 'digit', value: '1', expectedValue: '1', isEditable: false }]
      ],
      steps: [
        {
          id: 'step_1',
          type: 'add_column',
          targetCells: [{ r: 99, c: 99 }], // Does not exist
          expectedValues: ['1'],
          explanationKey: 'add',
          nextFocus: null,
          dependencies: []
        }
      ]
    };
  }
  validate(stepState: StepState): ValidationResult {
    return { correct: true, errors: [], hints: [] };
  }
}

describe('EngineValidator', () => {
  it('validates a correct engine', () => {
    const engine = new MockEngine();
    const report = EngineValidator.validate(engine, { type: 'add', operands: [1, 2] });
    expect(report.isValid).toBe(true);
    expect(report.errors.length).toBe(0);
  });

  it('detects engine inconsistencies automatically', () => {
    const engine = new BadMockEngine();
    const report = EngineValidator.validate(engine, { type: 'add', operands: [1, 2] });
    expect(report.isValid).toBe(false);
    expect(report.errors[0]).toContain('does not exist in grid');
  });
});

describe('PerformanceMonitor', () => {
  it('measures execution time', () => {
    const result = PerformanceMonitor.measure('test', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });
    expect(result).toBeGreaterThan(0);
  });
});
