import { StudentModel } from '../student/StudentModel';
import { TelemetryEvent } from '../telemetry/types';
import { CognitiveLoadState } from '../cognitive/types';
import { StudentSnapshot } from './types';

export class SnapshotBuilder {
  public static build(
    studentModel: StudentModel,
    telemetry: TelemetryEvent[],
    currentLoadState: CognitiveLoadState,
    currentDifficulty: string
  ): StudentSnapshot {
    const timestamp = Date.now();
    
    // Get all skill scores
    const skills = studentModel.getAllSkillScores();
    const skillHistory = studentModel.getSkillHistory();
    
    const accuracy = this.calculateAccuracy(telemetry);
    const avgSolveTime = this.calculateAvgSolveTime(telemetry);
    const frustrationIndex = this.calculateFrustration(telemetry, currentLoadState);
    const masteryLevel = this.calculateMastery(skills);

    return {
      timestamp,
      skills,
      skillHistory,
      loadState: currentLoadState,
      accuracy,
      avgSolveTime,
      currentDifficulty,
      frustrationIndex,
      masteryLevel
    };
  }

  private static calculateAccuracy(events: TelemetryEvent[]): number {
    const attempts = events.filter(e => e.type === 'step_transition' || e.type === 'error');
    if (attempts.length === 0) return 1.0;
    
    const errors = events.filter(e => e.type === 'error').length;
    const successes = events.filter(e => e.type === 'step_transition').length;
    
    const total = successes + errors;
    if (total === 0) return 1.0;
    const accuracy = successes / total;
    return isNaN(accuracy) ? 1.0 : accuracy;
  }

  private static calculateAvgSolveTime(events: TelemetryEvent[]): number {
    const transitions = events.filter(e => e.type === 'step_transition');
    if (transitions.length === 0) return 0;
    
    const totalTime = transitions.reduce((sum, e) => sum + (e.payload.durationSinceLastEvent || 0), 0);
    const avg = totalTime / transitions.length;
    return isNaN(avg) ? 0 : avg;
  }

  private static calculateFrustration(events: TelemetryEvent[], loadState: CognitiveLoadState): number {
    // Simple heuristic: High load + recent errors
    const recentEvents = events.slice(-10);
    const recentErrors = recentEvents.filter(e => e.type === 'error').length;
    
    let index = 0;
    if (loadState === CognitiveLoadState.OVERLOADED) index += 0.5;
    if (loadState === CognitiveLoadState.HIGH) index += 0.2;
    
    index += (recentErrors / 10) * 0.5;
    
    const result = Math.min(1.0, index);
    return isNaN(result) ? 0 : result;
  }

  private static calculateMastery(skills: Record<string, number>): number {
    const scores = Object.values(skills).filter(v => !isNaN(v));
    if (scores.length === 0) return 0;
    
    const sum = scores.reduce((acc, val) => acc + val, 0);
    const mastery = sum / scores.length;
    return isNaN(mastery) ? 0 : mastery;
  }
}
