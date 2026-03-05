import { describe, it, expect } from 'vitest';
import { ParenthesesEvaluationStrategy } from '../strategies/parenthesesEvaluation.strategy';
import { SeededRandom } from '../seed/SeededRandom';

describe('ParenthesesEvaluationStrategy', () => {
  it('generates valid problem configurations', () => {
    const strategy = new ParenthesesEvaluationStrategy();
    const rng = new SeededRandom(12345);
    
    const config = strategy.generate({ operation: 'parentheses_evaluation', digits: 2 }, rng);
    
    expect(config.type).toBe('parentheses_evaluation');
    expect(config.a).toBeGreaterThanOrEqual(10);
    expect(config.a).toBeLessThanOrEqual(99);
    expect(config.b).toBeGreaterThanOrEqual(10);
    expect(config.b).toBeLessThanOrEqual(99);
    expect(config.c).toBeGreaterThanOrEqual(10);
    expect(config.c).toBeLessThanOrEqual(99);
    expect(['+', '-']).toContain(config.outerOp);
    expect(['+', '-']).toContain(config.innerOp);
    
    const inner = config.innerOp === '+' ? config.b! + config.c! : config.b! - config.c!;
    const final = config.outerOp === '+' ? config.a! + inner : config.a! - inner;
    
    expect(inner).toBeGreaterThanOrEqual(0);
    expect(final).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic with the same seed', () => {
    const strategy = new ParenthesesEvaluationStrategy();
    
    const rng1 = new SeededRandom(42);
    const config1 = strategy.generate({ operation: 'parentheses_evaluation', digits: 2 }, rng1);
    
    const rng2 = new SeededRandom(42);
    const config2 = strategy.generate({ operation: 'parentheses_evaluation', digits: 2 }, rng2);
    
    expect(config1).toEqual(config2);
  });
});
