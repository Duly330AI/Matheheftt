import { TelemetryEvent } from '../telemetry/types';
import { DifficultyProfile, OperationType } from '../generator/profiles/difficultyProfiles';
import { engineRegistry, SkillDefinition } from '../engine';
import { SkillGraph } from './SkillGraph';

export interface SkillStats {
  attempts: number;
  errors: number;
  avgTime: number;
  hintUsage: number;
  score: number; // The new graph-based score [0, 1]
  lastUpdated: number; // Timestamp for decay
}

export class StudentModel {
  private skills: Record<string, SkillStats> = {};
  private graph: SkillGraph;

  constructor() {
    const allSkills = engineRegistry.list().flatMap(plugin => plugin.getSkills());
    this.graph = new SkillGraph(allSkills);
    this.initializeSkills(allSkills);
  }

  private initializeSkills(allSkills: SkillDefinition[]) {
    const now = Date.now();
    for (const skill of allSkills) {
      if (!this.skills[skill.id]) {
        this.skills[skill.id] = {
          attempts: 0,
          errors: 0,
          avgTime: 0,
          hintUsage: 0,
          score: 0.5, // Default starting score
          lastUpdated: now,
        };
      }
    }
  }

  public updateFromTelemetry(events: TelemetryEvent[]): void {
    let currentOperation: string | null = null;
    const now = Date.now();

    for (const event of events) {
      if (event.type === 'session_start') {
        currentOperation = event.payload.operation;
      }

      if (event.type === 'error') {
        const errorType = event.payload.errorType;
        const skillId = this.mapErrorTypeToSkill(errorType, currentOperation);
        if (skillId && this.skills[skillId]) {
          this.skills[skillId].errors += 1;
          this.skills[skillId].attempts += 1;
          this.skills[skillId].lastUpdated = now;

          // Propagate negative score
          this.graph.propagateScore(skillId, -0.1, (id, delta) => {
            if (this.skills[id]) {
              this.skills[id].score = Math.max(0, this.skills[id].score + delta);
              this.skills[id].lastUpdated = now;
            }
          });
        }
      }

      if (event.type === 'step_transition') {
        const skillId = this.mapOperationToMainSkill(currentOperation);
        if (skillId && this.skills[skillId]) {
          this.skills[skillId].attempts += 1;
          this.skills[skillId].lastUpdated = now;
          
          const duration = event.payload.durationSinceLastEvent || 0;
          if (duration > 0) {
            const stats = this.skills[skillId];
            stats.avgTime = stats.attempts === 1 ? duration : (stats.avgTime * (stats.attempts - 1) + duration) / stats.attempts;
          }

          // Propagate positive score
          this.graph.propagateScore(skillId, 0.05, (id, delta) => {
            if (this.skills[id]) {
              this.skills[id].score = Math.min(1, this.skills[id].score + delta);
              this.skills[id].lastUpdated = now;
            }
          });
        }
      }
    }
  }

  private mapErrorTypeToSkill(errorType: string | null, operation: string | null): string | null {
    if (!errorType || !operation) return null;

    const op = operation.toLowerCase();
    
    // Map specific error types to skills based on operation
    if (op === 'add' || op === 'addition') {
      if (errorType === 'CARRY_ERROR') return 'addition_carry';
      return 'addition_no_carry';
    }
    
    if (op === 'sub' || op === 'subtraction') {
      if (errorType === 'BORROW_ERROR') return 'subtraction_borrow';
      return 'subtraction_no_borrow';
    }
    
    if (op === 'mul' || op === 'multiplication') {
      return 'multiplication_basic';
    }
    
    if (op === 'div' || op === 'division') {
      if (errorType === 'ESTIMATION_ERROR') return 'division_estimation';
      if (errorType === 'CALCULATION_ERROR') return 'division_subtract'; // Or multiply
      if (errorType === 'FORGOT_BRING_DOWN') return 'division_process';
      return 'division_process';
    }
    
    if (op === 'algebra') {
      return 'algebra_expand_brackets';
    }
    
    if (op === 'insert_parentheses') {
      if (errorType === 'OPERATOR_MODIFICATION_ERROR') return 'algebra_parentheses_insertion';
      return 'algebra_parentheses_insertion';
    }

    // Fallback to legacy hint keys if errorType is actually a hint key
    switch (errorType) {
      case 'hint_carry_error': return 'addition_carry';
      case 'hint_borrow_error': return 'subtraction_borrow';
      case 'hint_algebra_error':
      case 'hint_algebra_expand_error': return 'algebra_expand_brackets';
      case 'division_estimate_too_large':
      case 'division_estimate_too_small': return 'division_estimation';
      case 'subtract_error': return 'division_subtract';
      case 'forgot_bring_down': return 'division_process';
      case 'multiply_error':
      case 'hint_multiply_digit_error': return 'multiplication_basic';
      case 'hint_add_column_error': return 'addition_no_carry';
      case 'hint_subtract_column_error': return 'subtraction_no_borrow';
      default: return this.mapOperationToMainSkill(operation);
    }
  }

  private mapOperationToMainSkill(operation: string | null): string | null {
    if (!operation) return null;
    
    // Support both short and long names
    const op = operation.toLowerCase();
    if (op === 'add' || op === 'addition') return 'addition_no_carry';
    if (op === 'sub' || op === 'subtraction') return 'subtraction_no_borrow';
    if (op === 'mul' || op === 'multiplication') return 'multiplication_basic';
    if (op === 'div' || op === 'division') return 'division_process';
    if (op === 'algebra') return 'algebra_expand_brackets';
    if (op === 'insert_parentheses') return 'algebra_parentheses_insertion';
    
    return null;
  }

  public getSkillScore(skillId: string): number {
    const stats = this.skills[skillId];
    if (!stats) return 0.5;

    // Apply decay
    const node = this.graph.getNode(skillId);
    const halfLifeDays = node?.definition.decayHalfLife || 30;
    const halfLifeMs = halfLifeDays * 24 * 60 * 60 * 1000;
    
    const now = Date.now();
    const elapsedMs = now - stats.lastUpdated;
    
    // Decay formula: score = score * (0.5 ^ (elapsed / halfLife))
    // But we only decay towards 0.5 (neutral), not 0
    const decayFactor = Math.pow(0.5, elapsedMs / halfLifeMs);
    const decayedScore = 0.5 + (stats.score - 0.5) * decayFactor;
    
    return decayedScore;
  }

  public getAllSkillScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const skillId in this.skills) {
      scores[skillId] = this.getSkillScore(skillId);
    }
    return scores;
  }

  public getWeakSkills(): string[] {
    const weakSkills: string[] = [];
    for (const [skillId, stats] of Object.entries(this.skills)) {
      if (stats.attempts >= 3 && this.getSkillScore(skillId) < 0.6) {
        weakSkills.push(skillId);
      }
    }
    return weakSkills;
  }

  public getRecommendedDifficulty(operation: OperationType): DifficultyProfile {
    const weakSkills = this.getWeakSkills();
    
    const profile: DifficultyProfile = {
      operation,
      digits: 3,
    };

    switch (operation) {
      case 'add':
        profile.requireCarry = weakSkills.includes('addition_carry');
        break;
      case 'sub':
        profile.requireBorrow = weakSkills.includes('subtraction_borrow');
        profile.allowNegative = false;
        break;
      case 'mul':
        profile.digits = this.getSkillScore('multiplication_basic') > 0.8 ? 4 : 3;
        break;
      case 'div':
        profile.requireRemainder = weakSkills.includes('division_process');
        break;
    }

    return profile;
  }

  public predictSuccess(task: any): number {
    // Simple logistic approximation placeholder
    return 0.8;
  }

  public serialize(): string {
    return JSON.stringify(this.skills);
  }

  public static deserialize(json: string): StudentModel {
    const model = new StudentModel();
    try {
      const parsed = JSON.parse(json);
      // Merge parsed data, keeping default values for missing fields
      for (const key in parsed) {
        if (model.skills[key]) {
          model.skills[key] = { ...model.skills[key], ...parsed[key] };
        } else {
          model.skills[key] = parsed[key];
        }
      }
    } catch (e) {
      console.error('Failed to deserialize StudentModel', e);
    }
    return model;
  }
}
