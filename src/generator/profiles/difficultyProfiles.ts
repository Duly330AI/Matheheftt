export type OperationType = 'add' | 'sub' | 'mul' | 'div' | 'algebra' | 'simplify_terms';

export type DifficultyProfile = {
  operation: OperationType;
  digits: number;
  requireCarry?: boolean;
  requireBorrow?: boolean;
  allowNegative?: boolean;
  requireRemainder?: boolean;
  stepCountMin?: number;
  stepCountMax?: number;
  pedagogicFocus?: 'carry' | 'borrow' | 'placevalue' | 'speed' | 'expand' | 'simplify';
  fixedOperand?: number;
};

export interface ProblemConfig {
  type: OperationType;
  // Addition
  operands?: number[];
  // Subtraction
  minuend?: number;
  subtrahend?: number;
  method?: 'borrow' | 'complement';
  // Multiplication
  multiplicand?: number;
  multiplier?: number;
  // Division
  dividend?: number;
  divisor?: number;
  // Algebra
  factor?: string;
  terms?: string[];
  operators?: string[];
  level?: number;
}

export interface GenerationStrategy {
  generate(profile: DifficultyProfile, rng: import('../seed/SeededRandom').SeededRandom): ProblemConfig;
}
