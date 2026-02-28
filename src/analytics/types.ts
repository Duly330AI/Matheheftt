import { CognitiveLoadState } from '../cognitive/types';

export interface StudentSnapshot {
  timestamp: number;
  skills: Record<string, number>; // Skill ID -> Score (0-1)
  loadState: CognitiveLoadState;
  accuracy: number; // 0-1
  avgSolveTime: number; // ms
  currentDifficulty: string; // e.g. "add_3_carry"
  frustrationIndex: number; // 0-1
  masteryLevel: number; // 0-1
}

export interface KPI {
  mastery: number;
  struggle: number;
  focus: number;
  confidence: number;
}

export interface TeacherInsight {
  type: 'alert' | 'recommendation' | 'praise';
  message: string;
  relatedSkill?: string;
  priority: 'low' | 'medium' | 'high';
}
