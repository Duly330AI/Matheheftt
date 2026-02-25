export interface CellData {
  value: string;
  underlined: boolean;
  carry?: string;
  isValid?: boolean | null;
  isCarryValid?: boolean | null;
}

export type TaskType = 'mixed' | '+' | '-' | '*' | ':' | '1x1';

export interface Profile {
  id: string;
  name: string;
  totalScore: number;
  highscores: Record<TaskType, number[]>;
}

export interface TaskResult {
  grid: Record<string, CellData>;
  solutionMap: Record<string, string>;
  carryMap: Record<string, string>;
  taskHeight: number;
  focusR: number;
  focusC: number;
  autoMoveDir: 'left' | 'right' | 'down' | 'none';
}

export interface SessionState {
  isActive: boolean;
  currentTaskIndex: number; // 1-based
  totalTasks: number;
  score: number;
  startTime: number;
  taskStartTime: number;
}
