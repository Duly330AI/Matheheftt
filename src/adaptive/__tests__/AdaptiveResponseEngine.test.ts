import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveResponseEngine } from '../AdaptiveResponseEngine';
import { CognitiveLoadState } from '../../cognitive/types';
import { ResponseContext } from '../types';

describe('AdaptiveResponseEngine', () => {
  let engine: AdaptiveResponseEngine;

  beforeEach(() => {
    engine = new AdaptiveResponseEngine();
  });

  it('should simplify task when OVERLOADED and weak skill', () => {
    const context: ResponseContext = {
      loadState: CognitiveLoadState.OVERLOADED,
      skillConfidence: 0.4, // Weak
      recentErrorRate: 0.8, // Many errors
      consecutiveSuccesses: 0,
    };

    const action = engine.decide(context);

    expect(action.difficultyModifier).toBe(-1);
    expect(action.reduceDigits).toBe(true);
    expect(action.enableHints).toBe(true);
    expect(action.focusMode).toBe(true);
    expect(action.motivationalMessage).toContain('Schritt für Schritt');
  });

  it('should enable hints when HIGH load and struggling', () => {
    const context: ResponseContext = {
      loadState: CognitiveLoadState.HIGH,
      skillConfidence: 0.4, // Lower confidence to trigger message
      recentErrorRate: 0.4, // Some errors
      consecutiveSuccesses: 0,
    };

    const action = engine.decide(context);

    expect(action.enableHints).toBe(true);
    expect(action.difficultyModifier).toBe(0); // Don't reduce difficulty yet
    expect(action.motivationalMessage).toContain('Fast geschafft');
  });

  it('should increase difficulty when UNDERLOADED and successful', () => {
    const context: ResponseContext = {
      loadState: CognitiveLoadState.UNDERLOADED,
      skillConfidence: 0.9,
      recentErrorRate: 0.0,
      consecutiveSuccesses: 3,
    };

    const action = engine.decide(context);

    expect(action.difficultyModifier).toBe(1);
    expect(action.motivationalMessage).toContain('Zu einfach');
  });

  it('should warn about careless errors when UNDERLOADED but failing', () => {
    const context: ResponseContext = {
      loadState: CognitiveLoadState.UNDERLOADED,
      skillConfidence: 0.8,
      recentErrorRate: 0.5, // Fast but wrong
      consecutiveSuccesses: 0,
    };

    const action = engine.decide(context);

    expect(action.focusMode).toBe(true);
    expect(action.motivationalMessage).toContain('Nicht raten');
    expect(action.difficultyModifier).toBe(0); // Don't make it harder if failing
  });

  it('should not interfere during OPTIMAL flow', () => {
    const context: ResponseContext = {
      loadState: CognitiveLoadState.OPTIMAL,
      skillConfidence: 0.7,
      recentErrorRate: 0.1,
      consecutiveSuccesses: 2,
    };

    const action = engine.decide(context);

    expect(action.difficultyModifier).toBe(0);
    expect(action.enableHints).toBe(false);
    expect(action.focusMode).toBe(false);
    expect(action.motivationalMessage).toBeNull();
  });
});
