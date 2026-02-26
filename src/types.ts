export interface CellData {
  value: string;
  underlined: boolean;
  carry?: string;
  isValid?: boolean | null;
  isCarryValid?: boolean | null;
}

export type TaskType = 'mixed' | '+' | '-' | '*' | ':' | '1x1';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'time_attack' | 'exam';

export interface Profile {
  id: string;
  name: string;
  avatar?: string; // e.g., 'cat', 'dog', 'girl', 'boy'
  totalScore: number;
  scores: Record<string, number>; // Detailed scores per category (e.g., 'mixed', '+', '1x1-7')
  highscores: Record<string, number[]>; // Highscores per category
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
  gameMode: GameMode;
  difficulty: Difficulty;
  timeLimit?: number;
  remainingTime?: number;
  examReviewMode?: boolean;
}
