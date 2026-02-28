import { CognitiveLoadState, CognitiveMetrics } from './types';

export class CognitiveLoadEngine {
  private static readonly BASE_LOAD = 0.1; // Intrinsic load of doing any task
  private static readonly TIME_WEIGHT = 0.35;
  private static readonly ERROR_WEIGHT = 0.35;
  private static readonly HINT_WEIGHT = 0.2;

  /**
   * Calculates the cognitive load for a single step interaction.
   * 
   * @param stepDurationMs Actual time taken for the step in milliseconds
   * @param expectedDurationMs Expected/Average time for this type of step (from StudentModel)
   * @param errorCount Number of errors made in this step
   * @param hintCount Number of hints requested in this step
   */
  public calculateLoad(
    stepDurationMs: number,
    expectedDurationMs: number,
    errorCount: number,
    hintCount: number
  ): CognitiveMetrics {
    // 1. Time Load (Normalized Ratio)
    // If expected is 0 (first time), assume current is baseline (ratio 1.0)
    const timeRatio = expectedDurationMs > 0 ? stepDurationMs / expectedDurationMs : 1.0;
    
    // Direct ratio mapping, capped at 1.2 to allow "very slow" to contribute slightly more than "slow"
    // 0.5x time -> 0.5 load
    // 1.0x time -> 1.0 load
    const timeLoad = Math.min(1.2, Math.max(0.0, timeRatio));

    // 2. Error Load
    // Each error adds significant load.
    // 1 error -> 0.35
    // 2 errors -> 0.7
    // 3+ errors -> 1.0
    const errorLoad = Math.min(1.0, errorCount * 0.35);

    // 3. Hint Load
    // Asking for help implies load.
    // 1 hint -> 0.5
    // 2+ hints -> 1.0
    const hintLoad = Math.min(1.0, hintCount * 0.5);

    // Weighted Average
    let rawScore = 
      CognitiveLoadEngine.BASE_LOAD +
      (timeLoad * CognitiveLoadEngine.TIME_WEIGHT) +
      (errorLoad * CognitiveLoadEngine.ERROR_WEIGHT) +
      (hintLoad * CognitiveLoadEngine.HINT_WEIGHT);

    // Boost score if multiple factors are high (synergy effect)
    // e.g. Slow AND Errors -> likely much harder than just slow
    if (timeLoad > 1.0 && errorLoad > 0.3) {
      rawScore += 0.1;
    }

    const loadScore = Math.min(1.2, Math.max(0.0, rawScore));

    return {
      loadScore,
      state: this.mapScoreToState(loadScore),
      factors: {
        timeLoad,
        errorLoad,
        hintLoad
      }
    };
  }

  private mapScoreToState(score: number): CognitiveLoadState {
    if (score < 0.35) return CognitiveLoadState.UNDERLOADED; // Slightly raised threshold
    if (score < 0.65) return CognitiveLoadState.OPTIMAL;     // Slightly wider optimal range
    if (score < 0.85) return CognitiveLoadState.HIGH;
    return CognitiveLoadState.OVERLOADED;
  }
}
