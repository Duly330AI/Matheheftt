import { describe, it, expect } from 'vitest';
import { ParenthesesEvaluationEngine } from '../algebra/ParenthesesEvaluationEngine';

describe('ParenthesesEvaluationEngine', () => {
  it('generates correct grid and steps for + and +', () => {
    const engine = new ParenthesesEvaluationEngine();
    const result = engine.generate({ a: 10, b: 20, c: 30, outerOp: '+', innerOp: '+' });

    expect(result.type).toBe('parentheses_evaluation');
    expect(result.steps.length).toBeGreaterThan(2);
    
    const stepInnerResult = result.steps.find(s => s.type === 'parentheses_inner_result');
    expect(stepInnerResult).toBeDefined();
    expect(stepInnerResult!.expectedValues.join('')).toBe('50');
    
    const stepSubstitute = result.steps.find(s => s.type === 'parentheses_substitute');
    expect(stepSubstitute).toBeDefined();
    expect(stepSubstitute!.expectedValues.join('')).toBe('10+');
  });

  it('generates correct grid and steps for + and -', () => {
    const engine = new ParenthesesEvaluationEngine();
    const result = engine.generate({ a: 10, b: 30, c: 20, outerOp: '+', innerOp: '-' });

    expect(result.type).toBe('parentheses_evaluation');
    const stepInnerResult = result.steps.find(s => s.type === 'parentheses_inner_result');
    expect(stepInnerResult!.expectedValues.join('')).toBe('10');
    const stepSubstitute = result.steps.find(s => s.type === 'parentheses_substitute');
    expect(stepSubstitute!.expectedValues.join('')).toBe('10+');
  });

  it('generates correct grid and steps for - and +', () => {
    const engine = new ParenthesesEvaluationEngine();
    const result = engine.generate({ a: 50, b: 20, c: 10, outerOp: '-', innerOp: '+' });

    expect(result.type).toBe('parentheses_evaluation');
    const stepInnerResult = result.steps.find(s => s.type === 'parentheses_inner_result');
    expect(stepInnerResult!.expectedValues.join('')).toBe('30');
    const stepSubstitute = result.steps.find(s => s.type === 'parentheses_substitute');
    expect(stepSubstitute!.expectedValues.join('')).toBe('50-');
  });

  it('generates correct grid and steps for - and -', () => {
    const engine = new ParenthesesEvaluationEngine();
    const result = engine.generate({ a: 50, b: 30, c: 20, outerOp: '-', innerOp: '-' });

    expect(result.type).toBe('parentheses_evaluation');
    const stepInnerResult = result.steps.find(s => s.type === 'parentheses_inner_result');
    expect(stepInnerResult!.expectedValues.join('')).toBe('10');
    const stepSubstitute = result.steps.find(s => s.type === 'parentheses_substitute');
    expect(stepSubstitute!.expectedValues.join('')).toBe('50-');
  });

  it('validates partial input for parentheses_inner_result correctly', () => {
    const engine = new ParenthesesEvaluationEngine();
    const result = engine.generate({ a: 10, b: 20, c: 30, outerOp: '+', innerOp: '+' });
    
    const step1 = result.steps.find(s => s.type === 'parentheses_inner_result')!;
    
    // Create a mock user grid
    const userGrid = result.grid.map(row => row.map(cell => ({ ...cell })));
    
    // Partially correct input: '5' instead of '50'
    const pos1 = step1.targetCells[0];
    userGrid[pos1.r][pos1.c].value = '5';
    
    const validation = engine.validate({
      userGrid,
      expectedGrid: result.grid,
      currentStep: step1
    });
    
    expect(validation.correct).toBe(false);
    expect(validation.errorType).toBeNull(); // No error type for partial correct input
    expect(validation.errors.length).toBe(0); // No errors, just incomplete
    expect(validation.correctCells?.length).toBe(1); // One correct cell
  });

  it('validates incorrect input for parentheses_inner_result correctly', () => {
    const engine = new ParenthesesEvaluationEngine();
    const result = engine.generate({ a: 10, b: 20, c: 30, outerOp: '+', innerOp: '+' });
    
    const step1 = result.steps.find(s => s.type === 'parentheses_inner_result')!;
    
    // Create a mock user grid
    const userGrid = result.grid.map(row => row.map(cell => ({ ...cell })));
    
    // Incorrect input: '4' instead of '50'
    const pos1 = step1.targetCells[0];
    userGrid[pos1.r][pos1.c].value = '4';
    
    const validation = engine.validate({
      userGrid,
      expectedGrid: result.grid,
      currentStep: step1
    });
    
    expect(validation.correct).toBe(false);
    expect(validation.errorType).toBe('WRONG_PARENTHESES_RESULT');
    expect(validation.errors.length).toBe(1);
  });
});
