import { StudentModel } from '../student/StudentModel';
import { TaskDescriptor, SessionSummary, PlannedTask } from './types';

export interface LearningPlannerConfig {
  weights: {
    skillWeakness: number;
    novelty: number;
    spacing: number;
    difficultyFit: number;
    frustrationRisk: number;
  };
}

export class LearningPathPlanner {
  private seed: number;
  private config: LearningPlannerConfig;

  constructor(seed: number, config?: Partial<LearningPlannerConfig>) {
    this.seed = seed;
    this.config = {
      weights: {
        skillWeakness: 2.0,
        novelty: 0.5,
        spacing: 1.0,
        difficultyFit: 1.5,
        frustrationRisk: 2.5,
        ...config?.weights,
      },
    };
  }

  public nextTask(input: {
    studentModel: StudentModel;
    availableTasks: TaskDescriptor[];
    sessionHistory: SessionSummary[];
  }): PlannedTask {
    const { studentModel, availableTasks, sessionHistory } = input;
    const weakSkills = studentModel.getWeakSkills();

    let bestTask: TaskDescriptor | null = null;
    let bestScore = -Infinity;
    let bestReason = '';

    for (const task of availableTasks) {
      const scoreResult = this.scoreTask(task, studentModel, sessionHistory, weakSkills);
      
      // Add a tiny deterministic jitter to break ties
      const jitter = this.pseudoRandom(task.id) * 0.01;
      const finalScore = scoreResult.score + jitter;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestTask = task;
        bestReason = scoreResult.reason;
      }
    }

    if (!bestTask) {
      throw new Error('No available tasks provided to planner');
    }

    return {
      task: bestTask,
      score: bestScore,
      reason: bestReason,
    };
  }

  private scoreTask(
    task: TaskDescriptor,
    studentModel: StudentModel,
    history: SessionSummary[],
    weakSkills: string[]
  ): { score: number; reason: string } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Skill Weakness (Train weak skills)
    const trainedWeakSkills = task.skillsTrained.filter(skill => weakSkills.includes(skill));
    if (trainedWeakSkills.length > 0) {
      const weaknessBoost = trainedWeakSkills.length * this.config.weights.skillWeakness;
      score += weaknessBoost;
      reasons.push(`Trains weak skills: ${trainedWeakSkills.join(', ')}`);
    }

    // 2. Difficulty Fit (Avoid too hard/too easy)
    // We use the student model's recommended difficulty as a baseline
    const recommended = studentModel.getRecommendedDifficulty(task.operation);
    const fitScore = this.calculateDifficultyFit(task.difficulty, recommended);
    score += fitScore * this.config.weights.difficultyFit;
    if (fitScore > 0.5) reasons.push('Good difficulty fit');

    // 3. Frustration Risk (Avoid repeated failures)
    // If the student failed similar tasks recently, penalize
    const recentFailures = history
      .slice(-3)
      .filter(h => !h.success && this.isSimilarTask(h.taskId, task.id)).length;
    
    if (recentFailures > 0) {
      const penalty = recentFailures * this.config.weights.frustrationRisk;
      score -= penalty;
      reasons.push(`Avoids frustration (recent failures: ${recentFailures})`);
    }

    // 4. Spacing (Avoid immediate repetition of exact same task type)
    const lastTask = history[history.length - 1];
    if (lastTask && this.isSimilarTask(lastTask.taskId, task.id)) {
      score -= this.config.weights.spacing;
      reasons.push('Spacing penalty');
    }

    // 5. Novelty (Slight boost for tasks not seen recently)
    // Simplified: if operation hasn't been done in last 5 tasks
    const recentOperations = history.slice(-5).map(h => this.getOperationFromId(h.taskId));
    if (!recentOperations.includes(task.operation)) {
      score += this.config.weights.novelty;
      reasons.push('Novelty boost');
    }

    return { score, reason: reasons.join('; ') };
  }

  private calculateDifficultyFit(actual: any, recommended: any): number {
    // Simple heuristic: exact match is 1.0, mismatches reduce score
    let match = 1.0;
    
    if (actual.digits !== recommended.digits) match -= 0.3;
    if (actual.requireCarry !== recommended.requireCarry) match -= 0.2;
    if (actual.requireBorrow !== recommended.requireBorrow) match -= 0.2;
    if (actual.requireRemainder !== recommended.requireRemainder) match -= 0.2;

    return Math.max(0, match);
  }

  private isSimilarTask(id1: string, id2: string): boolean {
    // Assuming ID contains operation info, e.g., "add_3_digits_carry"
    // For now, simple string equality or prefix match
    return id1 === id2 || id1.split('_')[0] === id2.split('_')[0];
  }

  private getOperationFromId(id: string): string {
    return id.split('_')[0];
  }

  // Deterministic pseudo-random number generator based on seed and input string
  private pseudoRandom(input: string): number {
    let h = 0xdeadbeef;
    for (let i = 0; i < input.length; i++) {
      h = Math.imul(h ^ input.charCodeAt(i), 2654435761);
    }
    h = Math.imul(h ^ this.seed, 1597334677);
    return ((h >>> 0) / 4294967296);
  }
}
