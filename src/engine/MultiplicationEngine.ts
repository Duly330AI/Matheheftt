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

export interface MultiplicationConfig {
  multiplicand: number;
  multiplier: number;
}

export class MultiplicationEngine implements MathEngine<MultiplicationConfig> {
  generate(config: MultiplicationConfig): StepResult {
    const { multiplicand, multiplier } = config;

    const strMultiplicand = multiplicand.toString();
    const strMultiplier = multiplier.toString();
    const product = multiplicand * multiplier;
    const strProduct = product.toString();

    const partialProducts: string[] = [];
    for (let i = 0; i < strMultiplier.length; i++) {
      const digit = parseInt(strMultiplier[i], 10);
      const zeros = strMultiplier.length - 1 - i;
      const partial = (multiplicand * digit * Math.pow(10, zeros)).toString();
      partialProducts.push(partial);
    }

    // Grid layout:
    // Row 0: Multiplicand * Multiplier
    // Row 1: Separator
    // Row 2 to 2+numPartials-1: Carries for partial products
    // Row 2+numPartials to ...: Partial products
    // Row ...: Separator
    // Row ...: Carries for addition
    // Row ...: Final Result

    const numPartials = partialProducts.length;
    const topRow = 0;
    const sepRow1 = 1;
    const carryRowsMultStart = 2;
    const partialStartRow = carryRowsMultStart + numPartials;
    
    // If only 1 partial product, no need for addition step
    const rows = numPartials > 1 ? partialStartRow + numPartials + 3 : partialStartRow + numPartials; 
    
    // Width: "345 * 12" length is 3 + 3 + 2 = 8.
    // Product length is 4.
    const topRowStr = `${strMultiplicand} * ${strMultiplier}`;
    const cols = Math.max(topRowStr.length, strProduct.length + 1); // +1 for safety or carry

    const grid: GridMatrix = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => this.createEmptyCell(r, c))
    );

    const steps: Step[] = [];

    // Row topRow: Top Row
    let cOffset = cols - topRowStr.length;
    const multiplicandStartCol = cOffset;
    for (let i = 0; i < strMultiplicand.length; i++) {
      grid[topRow][cOffset++] = this.createCell(topRow, cOffset - 1, strMultiplicand[i], strMultiplicand[i], 'digit', false);
    }
    grid[topRow][cOffset++] = this.createCell(topRow, cOffset - 1, ' ', ' ', 'empty', false);
    grid[topRow][cOffset++] = this.createCell(topRow, cOffset - 1, '*', '*', 'operator', false);
    grid[topRow][cOffset++] = this.createCell(topRow, cOffset - 1, ' ', ' ', 'empty', false);
    for (let i = 0; i < strMultiplier.length; i++) {
      grid[topRow][cOffset++] = this.createCell(topRow, cOffset - 1, strMultiplier[i], strMultiplier[i], 'digit', false);
    }

    // Row sepRow1: Separator
    for (let c = 0; c < cols; c++) {
      grid[sepRow1][c] = this.createCell(sepRow1, c, '-', '-', 'separator', false);
    }

    // Partial Products
    for (let p = 0; p < numPartials; p++) {
      const r = partialStartRow + p;
      const multiplierDigit = parseInt(strMultiplier[p], 10);
      const zeros = strMultiplier.length - 1 - p;
      const multiplierDigitCol = cols - strMultiplier.length + p;

      let carry = 0;
      let lastStepId = '';

      // Trailing zeros
      for (let z = 0; z < zeros; z++) {
        const c = cols - 1 - z;
        grid[r][c] = this.createCell(r, c, '', '0', 'result', true);
        
        const stepId = `partial_${p}_zero_${z}`;
        steps.push({
          id: stepId,
          type: 'multiply_zero',
          targetCells: [{ r, c }],
          expectedValues: ['0'],
          explanationKey: 'multiply_zero_explanation',
          nextFocus: { r, c: c - 1 },
          dependencies: [{ r: topRow, c: multiplierDigitCol }],
        });
        lastStepId = stepId;
      }

      // Digits
      for (let i = strMultiplicand.length - 1; i >= 0; i--) {
        const mDigit = parseInt(strMultiplicand[i], 10);
        const prod = mDigit * multiplierDigit + carry;
        const resDigit = prod % 10;
        const nextCarry = Math.floor(prod / 10);
        
        const c = cols - 1 - zeros - (strMultiplicand.length - 1 - i);
        
        grid[r][c] = this.createCell(r, c, '', resDigit.toString(), 'result', true);
        
        const stepId = `partial_${p}_digit_${i}`;
        steps.push({
          id: stepId,
          type: 'multiply_digit',
          targetCells: [{ r, c }],
          expectedValues: [resDigit.toString()],
          explanationKey: 'multiply_digit_explanation',
          nextFocus: (nextCarry > 0 && i > 0) ? { r: carryRowsMultStart + p, c: c - 1 } : { r, c: c - 1 },
          dependencies: [{ r: topRow, c: multiplierDigitCol }, { r: topRow, c: multiplicandStartCol + i }],
        });
        lastStepId = stepId;

        if (nextCarry > 0 && i > 0) {
          const carryCol = c - 1;
          const carryRow = carryRowsMultStart + p;
          grid[carryRow][carryCol] = this.createCell(carryRow, carryCol, '', nextCarry.toString(), 'carry', true);
          
          const carryStepId = `partial_${p}_carry_${i}`;
          steps.push({
            id: carryStepId,
            type: 'carry',
            targetCells: [{ r: carryRow, c: carryCol }],
            expectedValues: [nextCarry.toString()],
            explanationKey: 'carry_explanation',
            nextFocus: { r, c: c - 1 },
            dependencies: [{ r, c }],
          });
          lastStepId = carryStepId;
        }
        carry = nextCarry;
      }

      if (carry > 0) {
        const c = cols - 1 - zeros - strMultiplicand.length;
        grid[r][c] = this.createCell(r, c, '', carry.toString(), 'result', true);
        
        const stepId = `partial_${p}_final_carry`;
        steps.push({
          id: stepId,
          type: 'multiply_digit',
          targetCells: [{ r, c }],
          expectedValues: [carry.toString()],
          explanationKey: 'multiply_digit_explanation',
          nextFocus: null,
          dependencies: [{ r: topRow, c: multiplierDigitCol }],
        });
        lastStepId = stepId;
      }
      
      // Fix nextFocus of the last step of this partial product
      if (lastStepId && p < numPartials - 1) {
        const lastStep = steps.find(s => s.id === lastStepId);
        if (lastStep) {
          lastStep.nextFocus = { r: r + 1, c: cols - 1 };
        }
      } else if (lastStepId && numPartials > 1) {
        const lastStep = steps.find(s => s.id === lastStepId);
        if (lastStep) {
          lastStep.nextFocus = { r: rows - 1, c: cols - 1 }; // Focus on final addition
        }
      }
    }

    // Addition of partial products
    if (numPartials > 1) {
      const sepRow2 = partialStartRow + numPartials;
      const carryRowAdd = sepRow2 + 1;
      const resultRow = carryRowAdd + 1;

      for (let c = 0; c < cols; c++) {
        grid[sepRow2][c] = this.createCell(sepRow2, c, '-', '-', 'separator', false);
      }

      // Add '+' operator
      grid[partialStartRow][0] = this.createCell(partialStartRow, 0, '+', '+', 'operator', false);

      let carry = 0;
      for (let colOffset = 0; colOffset < strProduct.length; colOffset++) {
        const c = cols - 1 - colOffset;
        let sum = carry;
        const dependencies: Position[] = [];

        if (carry > 0) {
          dependencies.push({ r: carryRowAdd, c });
        }

        for (let p = 0; p < numPartials; p++) {
          const r = partialStartRow + p;
          if (grid[r][c].value !== '' || grid[r][c].expectedValue !== '') {
            sum += parseInt(grid[r][c].expectedValue || '0', 10);
            dependencies.push({ r, c });
          }
        }

        const resultDigit = sum % 10;
        const nextCarry = Math.floor(sum / 10);

        grid[resultRow][c] = this.createCell(resultRow, c, '', resultDigit.toString(), 'result', true);

        steps.push({
          id: `add_partial_col_${c}`,
          type: 'add_column',
          targetCells: [{ r: resultRow, c }],
          expectedValues: [resultDigit.toString()],
          explanationKey: 'add_column_explanation',
          nextFocus: nextCarry > 0 ? { r: carryRowAdd, c: c - 1 } : (colOffset < strProduct.length - 1 ? { r: resultRow, c: c - 1 } : null),
          dependencies,
        });

        if (nextCarry > 0) {
          grid[carryRowAdd][c - 1] = this.createCell(carryRowAdd, c - 1, '', nextCarry.toString(), 'carry', true);
          steps.push({
            id: `carry_partial_col_${c - 1}`,
            type: 'carry',
            targetCells: [{ r: carryRowAdd, c: c - 1 }],
            expectedValues: [nextCarry.toString()],
            explanationKey: 'carry_explanation',
            nextFocus: { r: resultRow, c: c - 1 },
            dependencies: [{ r: resultRow, c }],
          });
        }

        carry = nextCarry;
      }
    }

    const meta: GridMeta = {
      rows,
      cols,
      resultRow: rows - 1,
      workingAreaStartRow: topRow,
    };

    return {
      type: 'multiplication',
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

export const MultiplicationPlugin: EnginePlugin<MultiplicationConfig> = {
  id: 'multiplication',
  displayName: 'Multiplikation',
  create: () => new MultiplicationEngine(),
  getSkills: () => [
    {
      id: 'multiplication_basic',
      name: 'Einmaleins',
      domain: 'multiplication',
      description: 'Grundlegendes Einmaleins',
      decayHalfLife: 30,
    },
    {
      id: 'multiplication_carry',
      name: 'Multiplikation mit Übertrag',
      domain: 'multiplication',
      description: 'Multiplikation mit Übertrag',
      dependsOn: ['multiplication_basic', 'addition_carry'],
      decayHalfLife: 14,
    },
  ],
  getDifficultySchema: () => ({}),
};
