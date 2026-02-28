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
import { Canonicalizer } from '../ast/Canonicalizer';
import { MathNode, NumberNode, VariableNode, BinaryOpNode } from '../ast/types';
import { DiagnosticEngine } from '../analysis/DiagnosticEngine';

export interface SimplifyTermsConfig {
  type: 'simplify';
  terms: string[]; // e.g. ['2x', '+3', '-x', '+5']
  level?: number;
}

export class SimplifyTermsEngine implements MathEngine<SimplifyTermsConfig> {
  private createNum(val: string): NumberNode {
    return { type: 'number', id: Math.random().toString(), value: val };
  }

  private createVar(name: string): VariableNode {
    return { type: 'variable', id: Math.random().toString(), name };
  }

  private createTermNode(term: string): MathNode {
    // If it's just a number
    if (!isNaN(parseInt(term)) && !term.match(/[a-zA-Z]/)) {
      return this.createNum(term);
    }
    // Otherwise it's a variable term
    return this.createVar(term);
  }

  generate(config: SimplifyTermsConfig): StepResult {
    const { terms } = config;

    if (terms.length === 0) {
      throw new Error("No terms provided");
    }

    // Build AST for the problem
    let leftSide: MathNode = this.createTermNode(terms[0].replace(/^\+/, ''));
    
    for (let i = 1; i < terms.length; i++) {
      const term = terms[i];
      const isNegative = term.startsWith('-');
      const op = isNegative ? '-' : '+';
      const cleanTerm = term.replace(/^[-+]/, '');
      const termNode = this.createTermNode(cleanTerm);
      
      leftSide = {
        type: 'binary_op',
        id: Math.random().toString(),
        op,
        left: leftSide,
        right: termNode
      } as BinaryOpNode;
    }

    // Use Canonicalizer to calculate the simplified right side
    const rightSide = Canonicalizer.canonicalize(leftSide);

    // Flatten problem and results
    const leftCells = ExpressionLayoutEngine.flatten(leftSide);
    const rightCells = ExpressionLayoutEngine.flatten(rightSide, { isEditable: true });

    const allCells = [
      ...leftCells,
      { value: '=', expectedValue: '=', role: 'operator' as CellRole, isEditable: false },
      ...rightCells
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

    // Identify target cells for the step
    const rightStart = leftCells.length + 1;
    const targetCells: Position[] = rightCells.map((_, i) => ({ r: 0, c: rightStart + i }));

    const steps: Step[] = [
      {
        id: 'simplify_terms',
        type: 'algebra_expand', // Reusing this type for now, or we can add 'algebra_simplify'
        targetCells,
        expectedValues: rightCells.map(c => c.expectedValue!),
        explanationKey: 'algebra_simplify_explanation',
        nextFocus: null,
        dependencies: leftCells.map((_, i) => ({ r: 0, c: i })) // All left cells
      }
    ];

    const meta: GridMeta = {
      rows,
      cols,
      resultRow: 0,
      workingAreaStartRow: 0,
    };

    return {
      type: 'simplify_terms',
      steps,
      grid,
      meta,
      metadata: { difficulty: config.level || 2 },
    };
  }

  validate(stepState: StepState): ValidationResult {
    const { userGrid, currentStep } = stepState;
    const errors: CellError[] = [];
    const hints: Hint[] = [];

    // Reconstruct student's input AST
    // Since we don't have a full parser yet, we'll do a basic string comparison,
    // but we can try to use DiagnosticEngine if we parse the student's input.
    // For now, let's build a simple parser for the student's input string to use DiagnosticEngine.
    
    const studentValue = currentStep.targetCells.map(pos => userGrid[pos.r][pos.c].value).join('').trim();
    const expectedValue = currentStep.expectedValues.join('');

    if (studentValue !== expectedValue && studentValue.length > 0) {
      // Try to parse student input into an AST to use DiagnosticEngine
      try {
        const studentNode = this.parseSimpleExpression(studentValue);
        const expectedNode = this.parseSimpleExpression(expectedValue);
        
        // Extract original problem from the left side of the grid
        const leftSideCells = currentStep.dependencies || [];
        const originalValue = leftSideCells.map(pos => userGrid[pos.r][pos.c].value).join('').trim();
        const originalNode = originalValue ? this.parseSimpleExpression(originalValue) : undefined;
        
        const diagnostic = DiagnosticEngine.analyze(studentNode, expectedNode, originalNode);
        
        if (!diagnostic.isCorrect) {
          // Map diagnostic error to skill tags
          let skillTag = 'algebra_simplify_terms';
          if (diagnostic.errorType === 'VARIABLE_MISMATCH') {
            skillTag = 'algebra_symbol_understanding';
          } else if (diagnostic.errorType === 'SIGN_MISAPPLICATION') {
            skillTag = 'algebra_sign_rules';
          } else if (diagnostic.errorType === 'LIKE_TERM_NOT_COMBINED' || diagnostic.errorType === 'CONSTANT_NOT_COMBINED') {
            skillTag = 'algebra_like_terms';
          }

          hints.push({
            messageKey: diagnostic.messageKey || 'hint_algebra_error',
            message: diagnostic.hint || 'Das stimmt noch nicht ganz.',
            highlightCells: currentStep.targetCells,
            severity: diagnostic.severity,
            skillTag: skillTag
          });
          return { correct: false, errors, hints };
        } else {
           // If DiagnosticEngine says it's correct (e.g. different order), we accept it
           return { correct: true, errors, hints };
        }
      } catch (e) {
        // Fallback to simple string comparison if parsing fails
        hints.push({
          messageKey: 'hint_algebra_error',
          message: 'Überprüfe deine Eingabe. Hast du alle Terme richtig zusammengefasst?',
          highlightCells: currentStep.targetCells,
        });
        return { correct: false, errors, hints };
      }
    } else if (studentValue === '') {
       hints.push({
          messageKey: 'hint_algebra_empty',
          message: 'Fasse die Terme zusammen und trage das Ergebnis ein.',
          highlightCells: currentStep.targetCells,
        });
        return { correct: false, errors, hints };
    }

    return { correct: true, errors, hints };
  }
  
  // A very basic parser for student input like "2x+3" or "3+2x"
  private parseSimpleExpression(expr: string): MathNode {
    // Remove spaces
    const cleanExpr = expr.replace(/\s+/g, '');
    
    // Split by + and - keeping the operators
    const parts = cleanExpr.split(/(?=[+-])/);
    
    if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
      return this.createNum('0');
    }
    
    let root: MathNode = this.createTermNode(parts[0].replace(/^\+/, ''));
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      
      const isNegative = part.startsWith('-');
      const op = isNegative ? '-' : '+';
      const cleanTerm = part.replace(/^[-+]/, '');
      
      root = {
        type: 'binary_op',
        id: Math.random().toString(),
        op,
        left: root,
        right: this.createTermNode(cleanTerm)
      } as BinaryOpNode;
    }
    
    return root;
  }
}
