import { DifficultyProfile, OperationType } from '../generator/profiles/difficultyProfiles';

export interface TaskDescriptor {
  id: string;
  operation: OperationType;
  difficulty: DifficultyProfile;
  skillsTrained: string[];
  estimatedTime: number; // in seconds
}

export interface SessionSummary {
  taskId: string;
  success: boolean;
  timestamp: number;
}

export interface PlannedTask {
  task: TaskDescriptor;
  score: number;
  reason: string;
}
