import {
  Cell,
  CellError,
  GridMatrix,
  GridMeta,
  Hint,
  MathEngine,
  OperationType,
  Position,
  Step,
  StepResult,
  StepState,
  ValidationResult,
} from './types';

import { EnginePlugin } from './registry';

export interface AdditionConfig {
  operands: number[];
}

export class AdditionEngine implements MathEngine<AdditionConfig> {
  generate(config: AdditionConfig): StepResult {
    const { operands } = config;
    if (operands.length < 2) throw new Error('Addition requires at least 2 operands');

    // Calculate sum to determine max digits
    const sum = operands.reduce((a, b) => a + b, 0);
    const maxDigits = sum.toString().length;
    
    // Grid dimensions
    // Rows: operands.length + 1 (separator) + 1 (carries) + 1 (result)
    const rows = operands.length + 3;
    const cols = maxDigits + 1; // +1 for the operator '+'

    const resultRow = rows - 1;
    const carryRow = rows - 2;
    const separatorRow = rows - 3;
    const workingAreaStartRow = 0;

    const grid: GridMatrix = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => this.createEmptyCell(r, c))
    );

    // Fill operands
    operands.forEach((num, index) => {
      const strNum = num.toString();
      const r = index;
      
      // Place operator on the last operand row
      if (index === operands.length - 1) {
        grid[r][0] = this.createCell(r, 0, '+', '+', 'operator', false);
      }

      // Place digits right-aligned
      for (let i = 0; i < strNum.length; i++) {
        const c = cols - strNum.length + i;
        grid[r][c] = this.createCell(r, c, strNum[i], strNum[i], 'digit', false);
      }
    });

    // Fill separator
    for (let c = 0; c < cols; c++) {
      grid[separatorRow][c] = this.createCell(separatorRow, c, '-', '-', 'separator', false);
    }

    const steps: Step[] = [];
    let carry = 0;

    // Process column by column from right to left
    for (let colOffset = 0; colOffset < maxDigits; colOffset++) {
      const c = cols - 1 - colOffset;
      
      let columnSum = carry;
      const dependencies: Position[] = [];
      
      // Add carry dependency if exists
      if (carry > 0) {
        dependencies.push({ r: carryRow, c });
      }

      for (let r = 0; r < operands.length; r++) {
        const cell = grid[r][c];
        if (cell.value !== '') {
          columnSum += parseInt(cell.value, 10);
          dependencies.push({ r, c });
        }
      }

      const resultDigit = columnSum % 10;
      const nextCarry = Math.floor(columnSum / 10);

      // Set expected result digit
      grid[resultRow][c] = this.createCell(resultRow, c, '', resultDigit.toString(), 'result', true);
      
      // Step 1: Add column and write result
      steps.push({
        id: `add_col_${c}`,
        type: 'add_column',
        targetCells: [{ r: resultRow, c }],
        expectedValues: [resultDigit.toString()],
        explanationKey: 'add_column_explanation',
        nextFocus: nextCarry > 0 ? { r: carryRow, c: c - 1 } : (c > 1 ? { r: resultRow, c: c - 1 } : null),
        dependencies,
      });

      // Step 2: Write carry if needed
      if (nextCarry > 0) {
        grid[carryRow][c - 1] = this.createCell(carryRow, c - 1, '', nextCarry.toString(), 'carry', true);
        steps.push({
          id: `carry_col_${c - 1}`,
          type: 'carry',
          targetCells: [{ r: carryRow, c: c - 1 }],
          expectedValues: [nextCarry.toString()],
          explanationKey: 'carry_explanation',
          nextFocus: { r: resultRow, c: c - 1 },
          dependencies: [{ r: resultRow, c }], // depends on the result of the previous column
        });
      }
      
      carry = nextCarry;
    }

    const meta: GridMeta = {
      rows,
      cols,
      resultRow,
      workingAreaStartRow,
    };

    return {
      type: 'addition',
      steps,
      grid,
      meta,
      metadata: {
        difficulty: 1,
      },
    };
  }

  validate(stepState: StepState): ValidationResult {
    const { userGrid, currentStep } = stepState;
    const errors: CellError[] = [];
    const hints: Hint[] = [];

    let correct = true;

    for (let i = 0; i < currentStep.targetCells.length; i++) {
      const pos = currentStep.targetCells[i];
      const userCell = userGrid[pos.r][pos.c];
      const expectedValue = currentStep.expectedValues[i];

      if (userCell.value !== expectedValue) {
        correct = false;
        errors.push({
          position: pos,
          expected: expectedValue,
          actual: userCell.value,
        });
      }
    }

    if (!correct) {
      if (currentStep.type === 'carry') {
        hints.push({
          messageKey: 'hint_carry_error',
          highlightCells: currentStep.dependencies || [],
        });
      } else if (currentStep.type === 'add_column') {
        hints.push({
          messageKey: 'hint_add_column_error',
          highlightCells: currentStep.dependencies || [],
        });
      }
    }

    return { correct, errors, hints };
  }

  private createEmptyCell(r: number, c: number): Cell {
    return {
      id: `${r},${c}`,
      value: '',
      expectedValue: '',
      role: 'empty',
      isEditable: false,
    };
  }

  private createCell(r: number, c: number, value: string, expected: string, role: Cell['role'], isEditable: boolean): Cell {
    return {
      id: `${r},${c}`,
      value,
      expectedValue: expected,
      role,
      isEditable,
    };
  }
}

export const AdditionPlugin: EnginePlugin<AdditionConfig> = {
  id: 'addition',
  displayName: 'Addition',
  create: () => new AdditionEngine(),
  getSkills: () => [
    {
      id: 'addition_no_carry',
      name: 'Addition ohne Übertrag',
      domain: 'addition',
      description: 'Einfache Spaltenaddition ohne Übertrag',
      decayHalfLife: 30,
    },
    {
      id: 'addition_carry',
      name: 'Addition mit Übertrag',
      domain: 'addition',
      description: 'Spaltenaddition mit Übertrag in die nächste Spalte',
      dependsOn: ['addition_no_carry'],
      decayHalfLife: 14,
    },
  ],
  getDifficultySchema: () => ({}),
};
