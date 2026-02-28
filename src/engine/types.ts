export type Position = {
  r: number;
  c: number;
};

export type CellRole =
  | 'digit'
  | 'operator'
  | 'carry'
  | 'borrow'
  | 'result'
  | 'separator'
  | 'empty'
  | 'helper'
  | 'algebra_term';

export type ValidationState = 'correct' | 'incorrect' | 'pending';

export type Cell = {
  id: string; // e.g. "r,c" or semantic id
  value: string;
  expectedValue: string;
  role: CellRole;
  isEditable: boolean;
  status?: ValidationState;
  sourceCells?: string[]; // IDs of cells this value depends on
};

export type GridMatrix = Cell[][];

export type GridMeta = {
  rows: number;
  cols: number;
  resultRow: number;
  workingAreaStartRow: number;
};

export type StepType =
  | 'add_column'
  | 'carry'
  | 'borrow'
  | 'subtract_column'
  | 'multiply_digit'
  | 'multiply_zero'
  | 'divide_estimate'
  | 'divide_multiply'
  | 'divide_subtract'
  | 'divide_bring_down'
  | 'divide_remainder'
  | 'algebra_expand'
  | 'insert_parentheses'
  | 'finished';

export type Step = {
  id: string;
  type: StepType;
  targetCells: Position[];
  expectedValues: string[];
  explanationKey: string;
  nextFocus: Position | null;
  dependencies?: Position[]; // Cells needed for this step
};

export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'algebra' | 'simplify_terms' | 'insert_parentheses';

export type StepMeta = {
  difficulty: number;
  method?: string; // e.g. 'borrow' vs 'complement'
};

export type StepResult = {
  type: OperationType;
  steps: Step[];
  grid: GridMatrix;
  meta: GridMeta;
  metadata: StepMeta;
};

export type ErrorType = 
  // Algebra
  | 'SIGN' 
  | 'LIKE_TERM' 
  | 'DISTRIBUTION' 
  | 'ORDER' 
  | 'CONCEPTUAL' 
  | 'INCOMPLETE'
  | 'LIKE_TERM_NOT_COMBINED'
  | 'CONSTANT_NOT_COMBINED'
  | 'PARTIAL_SIMPLIFICATION'
  | 'SIGN_MISAPPLICATION'
  | 'VARIABLE_MISMATCH'
  | 'ORDER_OF_OPERATIONS_ERROR'
  | 'MISSING_PARENTHESES'
  | 'REDUNDANT_PARENTHESES'
  | 'INVALID_STRUCTURE'
  | 'OPERATOR_MODIFICATION_ERROR'
  | 'OPERATOR_REORDER_ERROR'
  // Arithmetic
  | 'CARRY_ERROR'
  | 'BORROW_ERROR'
  | 'CALCULATION_ERROR'
  | 'PLACE_VALUE_ERROR'
  | 'ESTIMATION_ERROR'
  | 'FORGOT_BRING_DOWN'
  | 'REMAINDER_ERROR'
  | 'NONE';

export type CellError = {
  position: Position;
  expected: string;
  actual: string;
};

export type Hint = {
  messageKey: string;
  message?: string;
  highlightCells: Position[];
  severity?: 'minor' | 'procedural' | 'conceptual' | 'none';
  skillTag?: string;
  errorType?: ErrorType;
};

export type ValidationResult = {
  correct: boolean;
  errorType: ErrorType | null;
  errors: CellError[];
  hints?: Hint[];
};

export type StepState = {
  userGrid: GridMatrix;
  expectedGrid: GridMatrix;
  currentStep: Step;
};

export interface MathEngine<ProblemConfig = any> {
  generate(problemConfig: ProblemConfig): StepResult;
  validate(stepState: StepState): ValidationResult;
}
