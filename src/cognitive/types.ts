export enum CognitiveLoadState {
  UNDERLOADED = 'underloaded', // Boredom risk
  OPTIMAL = 'optimal',         // Flow state
  HIGH = 'high',               // Challenging but manageable
  OVERLOADED = 'overloaded',   // Frustration risk
}

export interface CognitiveMetrics {
  loadScore: number; // 0.0 to 1.0+ (normalized load index)
  state: CognitiveLoadState;
  factors: {
    timeLoad: number;
    errorLoad: number;
    hintLoad: number;
  };
}
