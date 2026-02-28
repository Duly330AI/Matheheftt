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

export interface DivisionConfig {
  dividend: number;
  divisor: number;
}

export class DivisionEngine implements MathEngine<DivisionConfig> {
  generate(config: DivisionConfig): StepResult {
    const { dividend, divisor } = config;

    if (divisor === 0) {
      throw new Error('Division by zero is not allowed');
    }

    const strDividend = dividend.toString();
    const strDivisor = divisor.toString();
    const quotient = Math.floor(dividend / divisor);
    const strQuotient = quotient.toString();
    const remainder = dividend % divisor;
    const strRemainder = remainder.toString();

    // Calculate grid dimensions
    // Row 0: D : d = Q R r
    // For each digit in dividend (or step), we have:
    // multiply row, separator row, subtract row (which becomes the new slice)
    // Actually, the number of steps depends on how we slice the dividend.
    
    // Let's simulate the division to find the number of rows and columns.
    let currentSliceStr = '';
    let stepsCount = 0;
    
    // We will build the steps and grid dynamically.
    // Max rows: 1 (top) + strQuotient.length * 3 (multiply, separator, subtract/bring_down)
    const rows = 1 + strQuotient.length * 3;
    
    // Cols: dividend + ' : ' + divisor + ' = ' + quotient + ' R ' + remainder
    let topRowLen = strDividend.length + 3 + strDivisor.length + 3 + strQuotient.length;
    if (remainder > 0) {
      topRowLen += 3 + strRemainder.length;
    }
    const cols = Math.max(topRowLen, strDividend.length + 2); // +2 for safety

    const grid: GridMatrix = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => this.createEmptyCell(r, c))
    );

    // Fill top row (Row 0)
    let cOffset = 2; // Start at 2 to leave room for the minus sign
    // Dividend
    const dividendStartCol = cOffset;
    for (let i = 0; i < strDividend.length; i++) {
      grid[0][cOffset++] = this.createCell(0, cOffset - 1, strDividend[i], strDividend[i], 'digit', false);
    }
    grid[0][cOffset++] = this.createCell(0, cOffset - 1, ' ', ' ', 'empty', false);
    grid[0][cOffset++] = this.createCell(0, cOffset - 1, ':', ':', 'operator', false);
    grid[0][cOffset++] = this.createCell(0, cOffset - 1, ' ', ' ', 'empty', false);
    
    // Divisor
    for (let i = 0; i < strDivisor.length; i++) {
      grid[0][cOffset++] = this.createCell(0, cOffset - 1, strDivisor[i], strDivisor[i], 'digit', false);
    }
    grid[0][cOffset++] = this.createCell(0, cOffset - 1, ' ', ' ', 'empty', false);
    grid[0][cOffset++] = this.createCell(0, cOffset - 1, '=', '=', 'operator', false);
    grid[0][cOffset++] = this.createCell(0, cOffset - 1, ' ', ' ', 'empty', false);
    
    const quotientStartCol = cOffset;
    // We don't fill the quotient yet, it will be filled by the user.
    // But we set the expected values.
    for (let i = 0; i < strQuotient.length; i++) {
      grid[0][cOffset++] = this.createCell(0, cOffset - 1, '', strQuotient[i], 'result', true);
    }
    
    const remainderStartCol = cOffset;
    if (remainder > 0) {
      grid[0][cOffset++] = this.createCell(0, cOffset - 1, ' ', ' ', 'empty', false);
      grid[0][cOffset++] = this.createCell(0, cOffset - 1, 'R', 'R', 'operator', false);
      grid[0][cOffset++] = this.createCell(0, cOffset - 1, ' ', ' ', 'empty', false);
      for (let i = 0; i < strRemainder.length; i++) {
        grid[0][cOffset++] = this.createCell(0, cOffset - 1, '', strRemainder[i], 'result', true);
      }
    }

    const steps: Step[] = [];
    
    let dividendIndex = 0;
    let currentVal = 0;
    let currentRow = 0;
    let quotientIndex = 0;

    while (dividendIndex < strDividend.length) {
      // For the very first step, we might take multiple digits.
      if (dividendIndex === 0) {
        while (dividendIndex < strDividend.length && currentVal < divisor) {
          currentVal = currentVal * 10 + parseInt(strDividend[dividendIndex], 10);
          dividendIndex++;
        }
      } else {
        // Bring down one digit
        const broughtDownDigit = parseInt(strDividend[dividendIndex], 10);
        currentVal = currentVal * 10 + broughtDownDigit;
        
        // Add bring down step
        const bringDownCol = dividendStartCol + dividendIndex;
        
        if (!grid[currentRow]) {
          grid.push(Array.from({ length: cols }, (_, c) => this.createEmptyCell(currentRow, c)));
        }
        
        grid[currentRow][bringDownCol] = this.createCell(currentRow, bringDownCol, '', broughtDownDigit.toString(), 'digit', true);
        steps.push({
          id: `bring_down_${dividendIndex}`,
          type: 'divide_bring_down',
          targetCells: [{ r: currentRow, c: bringDownCol }],
          expectedValues: [broughtDownDigit.toString()],
          explanationKey: 'divide_bring_down_explanation',
          nextFocus: { r: 0, c: quotientStartCol + quotientIndex },
        });
        dividendIndex++;
      }

      // Estimate
      const qDigit = parseInt(strQuotient[quotientIndex] || '0', 10);
      const qCol = quotientStartCol + quotientIndex;
      
      steps.push({
        id: `estimate_${quotientIndex}`,
        type: 'divide_estimate',
        targetCells: [{ r: 0, c: qCol }],
        expectedValues: [qDigit.toString()],
        explanationKey: 'divide_estimate_explanation',
        nextFocus: { r: currentRow + 1, c: dividendStartCol + dividendIndex - 1 }, // Focus on multiply row
      });

      currentRow++; // Move to multiply row

      // Multiply
      const multiplyRes = qDigit * divisor;
      const strMultiplyRes = multiplyRes.toString();
      
      // Place multiply result right-aligned under the current slice
      const multEndCol = dividendStartCol + dividendIndex - 1;
      const multStartCol = multEndCol - strMultiplyRes.length + 1;
      
      // Ensure row exists before accessing
      if (!grid[currentRow]) {
        grid.push(Array.from({ length: cols }, (_, c) => this.createEmptyCell(currentRow, c)));
      }
      
      grid[currentRow][multStartCol - 1] = this.createCell(currentRow, multStartCol - 1, '-', '-', 'operator', false);
      
      const multTargetCells: Position[] = [];
      const multExpectedValues: string[] = [];
      
      for (let i = 0; i < strMultiplyRes.length; i++) {
        const c = multStartCol + i;
        grid[currentRow][c] = this.createCell(currentRow, c, '', strMultiplyRes[i], 'digit', true);
        multTargetCells.push({ r: currentRow, c });
        multExpectedValues.push(strMultiplyRes[i]);
      }
      
      steps.push({
        id: `multiply_${quotientIndex}`,
        type: 'divide_multiply',
        targetCells: multTargetCells,
        expectedValues: multExpectedValues,
        explanationKey: 'divide_multiply_explanation',
        nextFocus: { r: currentRow + 2, c: multEndCol }, // Focus on subtract row
      });

      currentRow++;
      
      // Separator
      if (!grid[currentRow]) {
        grid.push(Array.from({ length: cols }, (_, c) => this.createEmptyCell(currentRow, c)));
      }
      for (let c = multStartCol - 1; c <= multEndCol; c++) {
        grid[currentRow][c] = this.createCell(currentRow, c, '-', '-', 'separator', false);
      }
      currentRow++;

      // Subtract
      const topNumber = currentVal;
      const bottomNumber = multiplyRes;
      currentVal = topNumber - bottomNumber;
      const strSubRes = currentVal.toString();
      
      const subEndCol = multEndCol;
      
      // Add carry row
      const subCarryRow = currentRow;
      if (!grid[subCarryRow]) {
        grid.push(Array.from({ length: cols }, (_, c) => this.createEmptyCell(subCarryRow, c)));
      }
      currentRow++;

      // Add result row
      const subResultRow = currentRow;
      if (!grid[subResultRow]) {
        grid.push(Array.from({ length: cols }, (_, c) => this.createEmptyCell(subResultRow, c)));
      }
      
      const maxDigits = Math.max(topNumber.toString().length, bottomNumber.toString().length);
      const paddedTop = topNumber.toString().padStart(maxDigits, '0').split('').map(Number);
      const paddedBottom = bottomNumber.toString().padStart(maxDigits, '0').split('').map(Number);
      
      let carry = 0;
      let lastSubStepId = '';
      
      for (let colOffset = 0; colOffset < maxDigits; colOffset++) {
        const c = subEndCol - colOffset;
        const digitIndex = maxDigits - 1 - colOffset;
        
        const tDigit = paddedTop[digitIndex];
        const bDigit = paddedBottom[digitIndex];
        
        let resDigit = tDigit - bDigit - carry;
        let nextCarry = 0;
        if (resDigit < 0) {
          resDigit += 10;
          nextCarry = 1;
        }
        
        // We always write the digit unless it's a leading zero AND it's not the only digit
        const isLeadingZero = resDigit === 0 && colOffset > 0 && currentVal < Math.pow(10, colOffset);
        
        if (!isLeadingZero) {
          grid[subResultRow][c] = this.createCell(subResultRow, c, '', resDigit.toString(), 'digit', true);
          
          const stepId = `subtract_${quotientIndex}_col_${c}`;
          steps.push({
            id: stepId,
            type: 'divide_subtract',
            targetCells: [{ r: subResultRow, c }],
            expectedValues: [resDigit.toString()],
            explanationKey: 'divide_subtract_explanation',
            nextFocus: nextCarry > 0 ? { r: subCarryRow, c: c - 1 } : (colOffset < maxDigits - 1 ? { r: subResultRow, c: c - 1 } : null),
          });
          lastSubStepId = stepId;
        }

        if (nextCarry > 0) {
          grid[subCarryRow][c - 1] = this.createCell(subCarryRow, c - 1, '', nextCarry.toString(), 'carry', true);
          const carryStepId = `subtract_${quotientIndex}_carry_${c - 1}`;
          steps.push({
            id: carryStepId,
            type: 'carry',
            targetCells: [{ r: subCarryRow, c: c - 1 }],
            expectedValues: [nextCarry.toString()],
            explanationKey: 'carry_explanation',
            nextFocus: { r: subResultRow, c: c - 1 },
          });
          lastSubStepId = carryStepId;
        }
        carry = nextCarry;
      }
      
      // Fix nextFocus for the last step of subtraction
      if (lastSubStepId) {
        const lastStep = steps.find(s => s.id === lastSubStepId);
        if (lastStep) {
          lastStep.nextFocus = dividendIndex < strDividend.length ? { r: subResultRow, c: dividendStartCol + dividendIndex } : null;
        }
      }

      quotientIndex++;
    }

    // Remainder step if needed
    if (remainder > 0) {
      const remTargetCells: Position[] = [];
      const remExpectedValues: string[] = [];
      for (let i = 0; i < strRemainder.length; i++) {
        const c = remainderStartCol + 3 + i;
        remTargetCells.push({ r: 0, c });
        remExpectedValues.push(strRemainder[i]);
      }
      
      steps.push({
        id: `remainder`,
        type: 'divide_remainder',
        targetCells: remTargetCells,
        expectedValues: remExpectedValues,
        explanationKey: 'divide_remainder_explanation',
        nextFocus: null,
      });
    }

    // Trim empty rows
    const actualRows = currentRow + 1;
    const trimmedGrid = grid.slice(0, actualRows);

    const meta: GridMeta = {
      rows: actualRows,
      cols,
      resultRow: 0,
      workingAreaStartRow: 1,
    };

    return {
      type: 'division',
      steps,
      grid: trimmedGrid,
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
      // Pedagogical validation
      if (currentStep.type === 'divide_estimate') {
        const userVal = parseInt(userGrid[currentStep.targetCells[0].r][currentStep.targetCells[0].c].value, 10);
        const expectedVal = parseInt(currentStep.expectedValues[0], 10);
        
        if (!isNaN(userVal)) {
          if (userVal > expectedVal) {
            hints.push({
              messageKey: 'division_estimate_too_large',
              highlightCells: currentStep.targetCells,
              errorType: 'ESTIMATION_ERROR'
            });
          } else if (userVal < expectedVal) {
            hints.push({
              messageKey: 'division_estimate_too_small',
              highlightCells: currentStep.targetCells,
              errorType: 'ESTIMATION_ERROR'
            });
          }
        } else {
          hints.push({
            messageKey: 'hint_divide_estimate_error',
            highlightCells: currentStep.targetCells,
            errorType: 'ESTIMATION_ERROR'
          });
        }
      } else if (currentStep.type === 'divide_multiply') {
        hints.push({
          messageKey: 'multiply_error',
          highlightCells: currentStep.targetCells,
          errorType: 'CALCULATION_ERROR'
        });
      } else if (currentStep.type === 'divide_subtract') {
        hints.push({
          messageKey: 'subtract_error',
          highlightCells: currentStep.targetCells,
          errorType: 'CALCULATION_ERROR'
        });
      } else if (currentStep.type === 'divide_bring_down') {
        hints.push({
          messageKey: 'forgot_bring_down',
          highlightCells: currentStep.targetCells,
          errorType: 'FORGOT_BRING_DOWN'
        });
      } else if (currentStep.type === 'divide_remainder') {
        hints.push({
          messageKey: 'hint_divide_remainder_error',
          highlightCells: currentStep.targetCells,
          errorType: 'REMAINDER_ERROR'
        });
      } else {
        hints.push({
          messageKey: `hint_${currentStep.type}_error`,
          highlightCells: currentStep.targetCells,
          errorType: 'CALCULATION_ERROR'
        });
      }
    }

    return { 
      correct, 
      errorType: hints.length > 0 ? (hints[0].errorType || 'CALCULATION_ERROR') : null,
      errors, 
      hints 
    };
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

export const DivisionPlugin: EnginePlugin<DivisionConfig> = {
  id: 'division',
  displayName: 'Division',
  create: () => new DivisionEngine(),
  getSkills: () => [
    {
      id: 'division_estimation',
      name: 'Division Schätzung',
      domain: 'division',
      description: 'Schätzen der nächsten Ziffer im Quotienten',
      dependsOn: ['multiplication_basic'],
      decayHalfLife: 14,
    },
    {
      id: 'division_subtract',
      name: 'Division Subtraktion',
      domain: 'division',
      description: 'Subtrahieren des Teilprodukts',
      dependsOn: ['subtraction_borrow'],
      decayHalfLife: 14,
    },
    {
      id: 'division_process',
      name: 'Division Ablauf',
      domain: 'division',
      description: 'Herunterholen und Gesamtablauf der Division',
      dependsOn: ['division_estimation', 'division_subtract'],
      decayHalfLife: 7,
    },
  ],
  getDifficultySchema: () => ({}),
};
