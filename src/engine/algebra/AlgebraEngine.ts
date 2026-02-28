import {
  Cell,
  CellError,
  CellRole,
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
import { ExpressionLayoutEngine } from '../ast/ExpressionLayoutEngine';
import { ExpressionTransformer } from '../ast/ExpressionTransformer';
import { MathNode, NumberNode, VariableNode, BinaryOpNode, EquationNode } from '../ast/types';

import { DiagnosticEngine } from '../analysis/DiagnosticEngine';

export interface AlgebraConfig {
  type: string;
  factor: string;
  terms: string[]; // e.g. ['x', '4'] for (x + 4)
  operators: string[]; // e.g. ['+'] for (x + 4)
}

export class AlgebraEngine implements MathEngine<AlgebraConfig> {
  private createNum(val: string): NumberNode {
    return { type: 'number', id: Math.random().toString(), value: val };
  }

  private createVar(name: string): VariableNode {
    return { type: 'variable', id: Math.random().toString(), name };
  }

  private createBinary(op: any, left: MathNode, right: MathNode, implicit = false): BinaryOpNode {
    return { type: 'binary_op', id: Math.random().toString(), op, left, right, implicit };
  }

  private createEq(left: MathNode, right: MathNode): EquationNode {
    return { type: 'equation', id: Math.random().toString(), left, right };
  }

  generate(config: AlgebraConfig): StepResult {
    const { factor, terms, operators } = config;
    
    // Build AST for the problem: factor * (term1 + term2)
    const term1 = isNaN(parseInt(terms[0])) ? this.createVar(terms[0]) : this.createNum(terms[0]);
    const term2 = isNaN(parseInt(terms[1])) ? this.createVar(terms[1]) : this.createNum(terms[1]);
    const innerSum = this.createBinary(operators[0] as any, term1, term2);
    innerSum.forceParentheses = true;

    const leftSide = this.createBinary('*', this.createNum(factor), innerSum, true);
    
    // Use Transformer to calculate the expanded right side
    const rightSide = ExpressionTransformer.expand(leftSide) as BinaryOpNode;

    // Flatten problem and results
    const leftCells = ExpressionLayoutEngine.flatten(leftSide);
    
    const r1Cells = ExpressionLayoutEngine.flatten(rightSide.left, { isEditable: true });
    const opCells = ExpressionLayoutEngine.flatten({ type: 'binary_op', id: 'op', op: rightSide.op, left: this.createNum('0'), right: this.createNum('0') } as any).filter(c => c.role === 'operator');
    const r2Cells = ExpressionLayoutEngine.flatten(rightSide.right, { isEditable: true });

    const allCells = [
        ...leftCells,
        { value: '=', expectedValue: '=', role: 'operator' as CellRole, isEditable: false },
        ...r1Cells,
        ...opCells,
        ...r2Cells
    ];
    
    const rows = 1;
    const cols = allCells.length;
    
    const grid: GridMatrix = [
        allCells.map((cDef, colIndex) => ({
            id: `0,${colIndex}`,
            value: cDef.value || '',
            expectedValue: cDef.expectedValue || '',
            role: (cDef.role as CellRole) || 'empty',
            isEditable: cDef.isEditable || false
        }))
    ];

    // Identify target cells for steps
    const r1Start = leftCells.length + 1;
    const r1TargetCells: Position[] = r1Cells.map((_, i) => ({ r: 0, c: r1Start + i }));
    
    const r2Start = r1Start + r1Cells.length + opCells.length;
    const r2TargetCells: Position[] = r2Cells.map((_, i) => ({ r: 0, c: r2Start + i }));

    const steps: Step[] = [
        {
            id: 'expand_term_1',
            type: 'algebra_expand',
            targetCells: r1TargetCells,
            expectedValues: r1Cells.map(c => c.expectedValue!),
            explanationKey: 'algebra_expand_explanation_1',
            nextFocus: r2TargetCells[0],
            dependencies: [{ r: 0, c: 0 }, { r: 0, c: 2 }] // Factor and first term
        },
        {
            id: 'expand_term_2',
            type: 'algebra_expand',
            targetCells: r2TargetCells,
            expectedValues: r2Cells.map(c => c.expectedValue!),
            explanationKey: 'algebra_expand_explanation_2',
            nextFocus: null,
            dependencies: [{ r: 0, c: 0 }, { r: 0, c: 4 }] // Factor and second term
        }
    ];

    const meta: GridMeta = {
      rows,
      cols,
      resultRow: 0,
      workingAreaStartRow: 0,
    };

    return {
      type: 'algebra',
      steps,
      grid,
      meta,
      metadata: { difficulty: 1 },
    };
  }

  validate(stepState: StepState): ValidationResult {
    const { userGrid, currentStep } = stepState;
    const errors: CellError[] = [];
    const hints: Hint[] = [];

    // Reconstruct student's input for the current step
    const studentValue = currentStep.targetCells.map(pos => userGrid[pos.r][pos.c].value).join('').trim();
    const expectedValue = currentStep.expectedValues.join('');

    // Simple check for now, but we could use DiagnosticEngine if we had a parser
    // For now, let's simulate the diagnostic logic
    if (studentValue !== expectedValue) {
      // Basic diagnostic logic
      let hintMessage = 'Das stimmt noch nicht ganz.';
      let errorType: any = 'CONCEPTUAL';
      
      if (studentValue === '') {
        hintMessage = 'Tippe das Ergebnis für den markierten Bereich ein.';
        errorType = 'INCOMPLETE';
      } else {
        // Try to guess error type
        // If it's a number and it's wrong, maybe it's a multiplication error
        const studentNum = parseInt(studentValue);
        const expectedNum = parseInt(expectedValue);
        
        if (!isNaN(studentNum) && !isNaN(expectedNum)) {
           hintMessage = 'Überprüfe deine Multiplikation.';
           errorType = 'CALCULATION_ERROR';
        } else if (studentValue.length > 0 && !studentValue.includes(expectedValue.replace(/[0-9]/g, ''))) {
           hintMessage = 'Hast du die Variable vergessen oder falsch abgeschrieben?';
           errorType = 'VARIABLE_MISMATCH';
        }
      }

      hints.push({
        messageKey: 'hint_algebra_error',
        message: hintMessage,
        highlightCells: currentStep.dependencies || [],
        errorType
      });

      return { correct: false, errorType, errors, hints };
    }

    return { correct: true, errorType: null, errors, hints };
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
