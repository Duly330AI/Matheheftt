import {
  Cell,
  CellError,
  GridMatrix,
  GridMeta,
  Hint,
  MathEngine,
  Position,
  Step,
  StepResult,
  StepState,
  ValidationResult,
} from './types';

import { EnginePlugin } from './registry';

export type SubtractionMethod = 'borrow' | 'complement';

export interface SubtractionConfig {
  minuend: number;
  subtrahend: number;
  method: SubtractionMethod;
}

export class SubtractionEngine implements MathEngine<SubtractionConfig> {
  generate(config: SubtractionConfig): StepResult {
    const { minuend, subtrahend, method } = config;

    if (minuend < subtrahend) {
      throw new Error('Negative results are not supported yet');
    }

    const strMinuend = minuend.toString();
    const strSubtrahend = subtrahend.toString();
    const maxDigits = strMinuend.length;

    // Grid layout:
    // Row 0: Borrows (for borrow method)
    // Row 1: Minuend
    // Row 2: Subtrahend (with minus sign)
    const isBorrow = method === 'borrow';
    const rows = 6;
    const cols = maxDigits + 1; // +1 for the minus sign

    const borrowRow = isBorrow ? 0 : -1;
    const minuendRow = isBorrow ? 1 : 0;
    const subtrahendRow = isBorrow ? 2 : 1;
    const separatorRow = isBorrow ? 3 : 2;
    const carryRow = isBorrow ? -1 : 3;
    const resultRow = isBorrow ? 4 : 4;

    const workingAreaStartRow = isBorrow ? 0 : 1;

    const grid: GridMatrix = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => this.createEmptyCell(r, c))
    );

    // Fill Minuend
    for (let i = 0; i < strMinuend.length; i++) {
      const c = cols - strMinuend.length + i;
      grid[minuendRow][c] = this.createCell(minuendRow, c, strMinuend[i], strMinuend[i], 'digit', false);
    }

    // Fill Subtrahend
    grid[subtrahendRow][0] = this.createCell(subtrahendRow, 0, '-', '-', 'operator', false);
    for (let i = 0; i < strSubtrahend.length; i++) {
      const c = cols - strSubtrahend.length + i;
      grid[subtrahendRow][c] = this.createCell(subtrahendRow, c, strSubtrahend[i], strSubtrahend[i], 'digit', false);
    }

    // Fill Separator
    for (let c = 0; c < cols; c++) {
      grid[separatorRow][c] = this.createCell(separatorRow, c, '-', '-', 'separator', false);
    }

    const steps: Step[] = [];
    
    if (method === 'borrow') {
      this.generateBorrowSteps(grid, strMinuend, strSubtrahend, cols, maxDigits, steps, minuendRow, subtrahendRow, borrowRow, resultRow);
    } else {
      this.generateComplementSteps(grid, strMinuend, strSubtrahend, cols, maxDigits, steps, minuendRow, subtrahendRow, carryRow, resultRow);
    }

    const meta: GridMeta = {
      rows,
      cols,
      resultRow,
      workingAreaStartRow,
    };

    return {
      type: 'subtraction',
      steps,
      grid,
      meta,
      metadata: {
        difficulty: 1,
        method,
      },
    };
  }

  private generateBorrowSteps(
    grid: GridMatrix,
    strMinuend: string,
    strSubtrahend: string,
    cols: number,
    maxDigits: number,
    steps: Step[],
    minuendRow: number,
    subtrahendRow: number,
    borrowRow: number,
    resultRow: number
  ) {
    let currentMinuend = strMinuend.split('').map(Number);
    // Pad subtrahend with leading zeros
    const paddedSubtrahend = strSubtrahend.padStart(maxDigits, '0').split('').map(Number);

    for (let colOffset = 0; colOffset < maxDigits; colOffset++) {
      const c = cols - 1 - colOffset;
      const digitIndex = maxDigits - 1 - colOffset;

      let topDigit = currentMinuend[digitIndex];
      const bottomDigit = paddedSubtrahend[digitIndex];

      const dependencies: Position[] = [{ r: minuendRow, c }];
      if (grid[subtrahendRow][c].value !== '') {
        dependencies.push({ r: subtrahendRow, c });
      }

      if (topDigit < bottomDigit) {
        // Need to borrow
        let borrowIndex = digitIndex - 1;
        while (borrowIndex >= 0 && currentMinuend[borrowIndex] === 0) {
          borrowIndex--;
        }

        if (borrowIndex < 0) {
          throw new Error('Invalid borrow state'); // Should not happen if minuend >= subtrahend
        }

        // Execute borrows from left to right back to our digit
        for (let i = borrowIndex; i < digitIndex; i++) {
          currentMinuend[i] -= 1;
          currentMinuend[i + 1] += 10;
          
          const borrowCol = cols - maxDigits + i;
          const targetCol = borrowCol + 1;

          grid[borrowRow][borrowCol] = this.createCell(borrowRow, borrowCol, '', currentMinuend[i].toString(), 'borrow', true);
          grid[borrowRow][targetCol] = this.createCell(borrowRow, targetCol, '', currentMinuend[i + 1].toString(), 'borrow', true);

          steps.push({
            id: `borrow_${borrowCol}_to_${targetCol}`,
            type: 'borrow',
            targetCells: [
              { r: borrowRow, c: borrowCol },
              { r: borrowRow, c: targetCol }
            ],
            expectedValues: [currentMinuend[i].toString(), currentMinuend[i + 1].toString()],
            explanationKey: 'borrow_explanation',
            nextFocus: { r: borrowRow, c: targetCol },
            dependencies: [{ r: minuendRow, c: borrowCol }, { r: minuendRow, c: targetCol }],
          });
        }
        
        // Update topDigit after borrowing
        topDigit = currentMinuend[digitIndex];
        // The dependency for the subtraction should be the borrow row, not the minuend row
        dependencies[0] = { r: borrowRow, c };
      }

      const resultDigit = topDigit - bottomDigit;
      grid[resultRow][c] = this.createCell(resultRow, c, '', resultDigit.toString(), 'result', true);

      steps.push({
        id: `sub_col_${c}`,
        type: 'subtract_column',
        targetCells: [{ r: resultRow, c }],
        expectedValues: [resultDigit.toString()],
        explanationKey: 'subtract_column_explanation',
        nextFocus: colOffset < maxDigits - 1 ? { r: resultRow, c: c - 1 } : null,
        dependencies,
      });
    }
  }

  private generateComplementSteps(
    grid: GridMatrix,
    strMinuend: string,
    strSubtrahend: string,
    cols: number,
    maxDigits: number,
    steps: Step[],
    minuendRow: number,
    subtrahendRow: number,
    carryRow: number,
    resultRow: number
  ) {
    const paddedMinuend = strMinuend.padStart(maxDigits, '0').split('').map(Number);
    const paddedSubtrahend = strSubtrahend.padStart(maxDigits, '0').split('').map(Number);
    
    let carry = 0;

    for (let colOffset = 0; colOffset < maxDigits; colOffset++) {
      const c = cols - 1 - colOffset;
      const digitIndex = maxDigits - 1 - colOffset;

      const topDigit = paddedMinuend[digitIndex];
      const bottomDigit = paddedSubtrahend[digitIndex];

      const dependencies: Position[] = [{ r: minuendRow, c }];
      if (grid[subtrahendRow][c].value !== '') {
        dependencies.push({ r: subtrahendRow, c });
      }
      if (carry > 0) {
        dependencies.push({ r: carryRow, c });
      }

      let resultDigit = topDigit - bottomDigit - carry;
      let nextCarry = 0;

      if (resultDigit < 0) {
        resultDigit += 10;
        nextCarry = 1;
      }

      grid[resultRow][c] = this.createCell(resultRow, c, '', resultDigit.toString(), 'result', true);

      steps.push({
        id: `sub_col_${c}`,
        type: 'subtract_column',
        targetCells: [{ r: resultRow, c }],
        expectedValues: [resultDigit.toString()],
        explanationKey: 'subtract_column_explanation',
        nextFocus: nextCarry > 0 ? { r: carryRow, c: c - 1 } : (colOffset < maxDigits - 1 ? { r: resultRow, c: c - 1 } : null),
        dependencies,
      });

      if (nextCarry > 0) {
        grid[carryRow][c - 1] = this.createCell(carryRow, c - 1, '', nextCarry.toString(), 'carry', true);
        steps.push({
          id: `carry_col_${c - 1}`,
          type: 'carry',
          targetCells: [{ r: carryRow, c: c - 1 }],
          expectedValues: [nextCarry.toString()],
          explanationKey: 'carry_explanation',
          nextFocus: { r: resultRow, c: c - 1 },
          dependencies: [{ r: resultRow, c }],
        });
      }

      carry = nextCarry;
    }
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
      hints.push({
        messageKey: `hint_${currentStep.type}_error`,
        highlightCells: currentStep.dependencies || [],
      });
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

export const SubtractionPlugin: EnginePlugin<SubtractionConfig> = {
  id: 'subtraction',
  displayName: 'Subtraktion',
  create: () => new SubtractionEngine(),
  getSkills: () => [
    {
      id: 'subtraction_no_borrow',
      name: 'Subtraktion ohne Entleihen',
      domain: 'subtraction',
      description: 'Einfache Spaltensubtraktion ohne Entleihen',
      decayHalfLife: 30,
    },
    {
      id: 'subtraction_borrow',
      name: 'Subtraktion mit Entleihen',
      domain: 'subtraction',
      description: 'Spaltensubtraktion mit Entleihen von der nächsten Spalte',
      dependsOn: ['subtraction_no_borrow'],
      decayHalfLife: 14,
    },
  ],
  getDifficultySchema: () => ({}),
};
