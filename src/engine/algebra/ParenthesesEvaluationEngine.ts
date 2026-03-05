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
} from '../types';
import { AdditionEngine } from '../AdditionEngine';
import { SubtractionEngine } from '../SubtractionEngine';

export interface ParenthesesEvaluationConfig {
  a: number;
  b: number;
  c: number;
  outerOp: '+' | '-';
  innerOp: '+' | '-';
}

export class ParenthesesEvaluationEngine implements MathEngine<ParenthesesEvaluationConfig> {
  generate(config: ParenthesesEvaluationConfig): StepResult {
    const { a, b, c, outerOp, innerOp } = config;
    
    const innerResult = innerOp === '+' ? b + c : b - c;
    const finalResult = outerOp === '+' ? a + innerResult : a - innerResult;

    // 1. Generate the top part of the grid (3 rows)
    // Row 0: a outerOp ( b innerOp c ) =
    // Row 1: a outerOp innerResult
    // Row 2: empty separator
    
    // Let's determine the width needed.
    const exprStr = `${a} ${outerOp} ( ${b} ${innerOp} ${c} ) =`;
    const cols = Math.max(exprStr.length, finalResult.toString().length + 2); // +2 for operator and space in sub-engine
    
    const topGrid: GridMatrix = Array.from({ length: 3 }, (_, r) =>
      Array.from({ length: cols }, (_, c) => this.createEmptyCell(r, c))
    );

    // Fill Row 0
    for (let i = 0; i < exprStr.length; i++) {
      if (exprStr[i] !== ' ') {
        topGrid[0][i] = this.createCell(0, i, exprStr[i], exprStr[i], 'algebra_term', false);
      }
    }

    // Step 1: parentheses_inner_result
    // The user needs to type the innerResult.
    // Where should it be placed? Underneath the parentheses.
    // Let's find the center of the parentheses.
    const parenStart = exprStr.indexOf('(');
    const parenEnd = exprStr.indexOf(')');
    const innerResultStr = innerResult.toString();
    
    // We'll place it right-aligned under the closing parenthesis, or just starting at parenStart + 2
    const innerResultStartCol = Math.max(0, parenEnd - innerResultStr.length);
    
    const step1TargetCells: Position[] = [];
    const step1ExpectedValues: string[] = [];
    
    for (let i = 0; i < innerResultStr.length; i++) {
      const c = innerResultStartCol + i;
      topGrid[1][c] = this.createCell(1, c, '', innerResultStr[i], 'result', true);
      step1TargetCells.push({ r: 1, c });
      step1ExpectedValues.push(innerResultStr[i]);
    }

    // Step 2: parentheses_substitute
    // The user needs to type `a` and `outerOp` in Row 1.
    const aStr = a.toString();
    const step2TargetCells: Position[] = [];
    const step2ExpectedValues: string[] = [];
    
    // Place `a`
    const aStartCol = exprStr.indexOf(aStr);
    for (let i = 0; i < aStr.length; i++) {
      const c = aStartCol + i;
      topGrid[1][c] = this.createCell(1, c, '', aStr[i], 'algebra_term', true);
      step2TargetCells.push({ r: 1, c });
      step2ExpectedValues.push(aStr[i]);
    }
    
    // Place `outerOp`
    const opCol = exprStr.indexOf(outerOp, aStartCol + aStr.length);
    topGrid[1][opCol] = this.createCell(1, opCol, '', outerOp, 'operator', true);
    step2TargetCells.push({ r: 1, c: opCol });
    step2ExpectedValues.push(outerOp);

    const steps: Step[] = [
      {
        id: 'step_inner_result',
        type: 'parentheses_inner_result',
        targetCells: step1TargetCells,
        expectedValues: step1ExpectedValues,
        explanationKey: 'parentheses_inner_result_explanation',
        nextFocus: step2TargetCells[0] || null,
        dependencies: [],
      },
      {
        id: 'step_substitute',
        type: 'parentheses_substitute',
        targetCells: step2TargetCells,
        expectedValues: step2ExpectedValues,
        explanationKey: 'parentheses_substitute_explanation',
        nextFocus: { r: 3, c: cols - 1 }, // Will be updated after sub-engine
        dependencies: step1TargetCells,
      }
    ];

    // 2. Delegate to sub-engine
    let subResult: StepResult;
    if (outerOp === '+') {
      const engine = new AdditionEngine();
      subResult = engine.generate({ operands: [a, innerResult] });
    } else {
      const engine = new SubtractionEngine();
      subResult = engine.generate({ minuend: a, subtrahend: innerResult, method: 'complement' });
    }

    const rowOffset = 3;
    const subGrid = subResult.grid;
    
    // We need to align the subGrid to the right of our topGrid, or just pad it.
    // Actually, subGrid has its own cols. We should make the final grid width = max(cols, subGrid[0].length)
    const finalCols = Math.max(cols, subGrid[0].length);
    
    // Pad topGrid if needed
    for (let r = 0; r < 3; r++) {
      while (topGrid[r].length < finalCols) {
        topGrid[r].push(this.createEmptyCell(r, topGrid[r].length));
      }
    }

    // Shift and pad subGrid
    const shiftedSubGrid: GridMatrix = subGrid.map((row, rIdx) => {
      const newRow = [];
      // Right-align the subGrid within finalCols
      const colOffset = finalCols - row.length;
      
      for (let c = 0; c < finalCols; c++) {
        if (c < colOffset) {
          newRow.push(this.createEmptyCell(rIdx + rowOffset, c));
        } else {
          const oldCell = row[c - colOffset];
          newRow.push({
            ...oldCell,
            id: `${rIdx + rowOffset},${c}`,
          });
        }
      }
      return newRow;
    });

    const finalGrid = [...topGrid, ...shiftedSubGrid];

    // Shift steps
    const shiftedSubSteps: Step[] = subResult.steps.map(step => {
      const colOffset = finalCols - subGrid[0].length;
      return {
        ...step,
        targetCells: step.targetCells.map(p => ({ r: p.r + rowOffset, c: p.c + colOffset })),
        dependencies: step.dependencies?.map(p => ({ r: p.r + rowOffset, c: p.c + colOffset })),
        nextFocus: step.nextFocus ? { r: step.nextFocus.r + rowOffset, c: step.nextFocus.c + colOffset } : null,
      };
    });

    // Update nextFocus of step 2
    if (shiftedSubSteps.length > 0 && shiftedSubSteps[0].targetCells.length > 0) {
      steps[1].nextFocus = shiftedSubSteps[0].targetCells[0];
    } else {
      steps[1].nextFocus = null;
    }

    steps.push(...shiftedSubSteps);

    const meta: GridMeta = {
      rows: finalGrid.length,
      cols: finalCols,
      resultRow: subResult.meta.resultRow + rowOffset,
      workingAreaStartRow: 0,
    };

    return {
      type: 'parentheses_evaluation',
      steps,
      grid: finalGrid,
      meta,
      metadata: {
        difficulty: 2,
      },
    };
  }

  validate(stepState: StepState): ValidationResult {
    const { userGrid, currentStep } = stepState;
    const errors: CellError[] = [];
    const hints: Hint[] = [];
    const correctCells: Position[] = [];

    // For step 1 and 2, we need prefix-/incomplete-tolerant validation
    if (currentStep.type === 'parentheses_inner_result' || currentStep.type === 'parentheses_substitute') {
      let isFullyCorrect = true;
      let hasErrors = false;

      for (let i = 0; i < currentStep.targetCells.length; i++) {
        const pos = currentStep.targetCells[i];
        const userCell = userGrid[pos.r][pos.c];
        const expectedValue = currentStep.expectedValues[i];

        if (userCell.value === expectedValue) {
          correctCells.push(pos);
        } else if (userCell.value !== '') {
          isFullyCorrect = false;
          hasErrors = true;
          errors.push({
            position: pos,
            expected: expectedValue,
            actual: userCell.value,
          });
        } else {
          isFullyCorrect = false;
        }
      }

      if (hasErrors) {
        hints.push({
          messageKey: currentStep.type === 'parentheses_inner_result' ? 'hint_wrong_parentheses_result' : 'hint_wrong_substitute',
          highlightCells: errors.map(e => e.position),
          errorType: 'WRONG_PARENTHESES_RESULT'
        });
      }

      return {
        correct: isFullyCorrect,
        errorType: hints.length > 0 ? 'WRONG_PARENTHESES_RESULT' : null,
        errors,
        hints,
        correctCells
      };
    }

    // For delegated steps (add_column, subtract_column, etc.), use strict validation
    let correct = true;
    for (let i = 0; i < currentStep.targetCells.length; i++) {
      const pos = currentStep.targetCells[i];
      const userCell = userGrid[pos.r][pos.c];
      const expectedValue = currentStep.expectedValues[i];

      if (userCell.value !== expectedValue) {
        correct = false;
        if (userCell.value !== '') {
          errors.push({
            position: pos,
            expected: expectedValue,
            actual: userCell.value,
          });
        }
      } else {
        correctCells.push(pos);
      }
    }

    // If not fully correct and there are actual errors (wrong inputs)
    if (!correct && errors.length > 0) {
      if (currentStep.type === 'carry' || currentStep.type === 'borrow') {
        hints.push({
          messageKey: currentStep.type === 'carry' ? 'hint_carry_error' : 'hint_borrow_error',
          highlightCells: currentStep.dependencies || [],
          errorType: currentStep.type === 'carry' ? 'CARRY_ERROR' : 'BORROW_ERROR'
        });
      } else {
        hints.push({
          messageKey: 'hint_calculation_error',
          highlightCells: currentStep.dependencies || [],
          errorType: 'CALCULATION_ERROR'
        });
      }
    }

    return {
      correct: correct && errors.length === 0 && correctCells.length === currentStep.targetCells.length,
      errorType: hints.length > 0 ? (hints[0].errorType || 'CALCULATION_ERROR') : null,
      errors,
      hints,
      correctCells
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
