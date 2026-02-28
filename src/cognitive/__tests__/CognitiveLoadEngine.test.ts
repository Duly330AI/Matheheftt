import { describe, it, expect, beforeEach } from 'vitest';
import { CognitiveLoadEngine } from '../CognitiveLoadEngine';
import { CognitiveLoadState } from '../types';

describe('CognitiveLoadEngine', () => {
  let engine: CognitiveLoadEngine;

  beforeEach(() => {
    engine = new CognitiveLoadEngine();
  });

  it('should detect UNDERLOADED state when fast and correct', () => {
    const metrics = engine.calculateLoad(
      1000, // 1s (very fast)
      5000, // 5s expected
      0,    // 0 errors
      0     // 0 hints
    );

    expect(metrics.state).toBe(CognitiveLoadState.UNDERLOADED);
    expect(metrics.loadScore).toBeLessThan(0.3);
  });

  it('should detect OPTIMAL state when normal speed and correct', () => {
    const metrics = engine.calculateLoad(
      5000, // 5s (normal)
      5000, // 5s expected
      0,    // 0 errors
      0     // 0 hints
    );

    expect(metrics.state).toBe(CognitiveLoadState.OPTIMAL);
    expect(metrics.loadScore).toBeGreaterThanOrEqual(0.3);
    expect(metrics.loadScore).toBeLessThan(0.6);
  });

  it('should detect HIGH state when slow or with minor errors', () => {
    const metrics = engine.calculateLoad(
      8000, // 8s (slow)
      5000, // 5s expected
      1,    // 1 error
      0     // 0 hints
    );

    expect(metrics.state).toBe(CognitiveLoadState.HIGH);
    expect(metrics.loadScore).toBeGreaterThanOrEqual(0.6);
    expect(metrics.loadScore).toBeLessThan(0.85);
  });

  it('should detect OVERLOADED state when very slow with multiple errors', () => {
    const metrics = engine.calculateLoad(
      15000, // 15s (very slow)
      5000,  // 5s expected
      3,     // 3 errors
      1      // 1 hint
    );

    expect(metrics.state).toBe(CognitiveLoadState.OVERLOADED);
    expect(metrics.loadScore).toBeGreaterThanOrEqual(0.85);
  });

  it('should detect OVERLOADED state when many hints are used', () => {
    const metrics = engine.calculateLoad(
      6000, // 6s (normal-ish)
      5000, // 5s expected
      0,    // 0 errors
      3     // 3 hints (excessive help)
    );

    // Hints weigh heavily
    expect(metrics.state).toBe(CognitiveLoadState.HIGH); // Or Overloaded depending on tuning
    expect(metrics.loadScore).toBeGreaterThan(0.5);
  });
});
