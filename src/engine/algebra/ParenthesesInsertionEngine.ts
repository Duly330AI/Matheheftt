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
  ErrorType
} from '../types';
import { ProblemConfig } from '../../generator/profiles/difficultyProfiles';

export class ParenthesesInsertionEngine implements MathEngine<ProblemConfig> {
  generate(config: ProblemConfig): StepResult {
    const { expression, targetResult, solution } = config;
    
    if (!expression || targetResult === undefined) {
      throw new Error('Invalid config for ParenthesesInsertionEngine');
    }

    // We present the expression and an equals sign and the target result.
    // The user needs to input the expression WITH parentheses.
    // For simplicity, we can have a single cell where the user types the whole expression.
    
    const rows = 1;
    const cols = 3; // [Expression Input] [=] [Target Result]
    
    const grid: GridMatrix = [
      [
        {
          id: '0,0',
          value: expression, // Initial value is the expression without parentheses
          expectedValue: solution || '', 
          role: 'algebra_term',
          isEditable: true
        },
        {
          id: '0,1',
          value: '=',
          expectedValue: '=',
          role: 'operator',
          isEditable: false
        },
        {
          id: '0,2',
          value: targetResult.toString(),
          expectedValue: targetResult.toString(),
          role: 'result',
          isEditable: false
        }
      ]
    ];

    const steps: Step[] = [
      {
        id: 'insert_parentheses',
        type: 'insert_parentheses',
        targetCells: [{ r: 0, c: 0 }],
        expectedValues: [solution || ''], 
        explanationKey: 'insert_parentheses_explanation',
        nextFocus: null
      }
    ];

    const meta: GridMeta = {
      rows,
      cols,
      resultRow: 0,
      workingAreaStartRow: 0,
    };

    return {
      type: 'insert_parentheses',
      steps,
      grid,
      meta,
      metadata: { difficulty: 2 },
    };
  }

  validate(stepState: StepState): ValidationResult {
    const { userGrid, currentStep } = stepState;
    const errors: CellError[] = [];
    const hints: Hint[] = [];

    const inputCell = userGrid[0][0];
    const targetResultStr = userGrid[0][2].value;
    const targetResult = parseInt(targetResultStr, 10);
    
    const studentExpression = inputCell.value.replace(/\s+/g, '');

    // 0. Check if numbers and operators are preserved
    const extractNumbers = (s: string) => s.match(/\d+/g) || [];
    const extractOperators = (s: string) => s.replace(/[\d\s()]/g, '');
    
    const studentNumbers = extractNumbers(studentExpression);
    const studentOperators = extractOperators(studentExpression);
    
    // expectedGrid is available in stepState
    const expectedSolution = stepState.expectedGrid[0][0].expectedValue;
    const expectedNumbers = extractNumbers(expectedSolution);
    const expectedOperators = extractOperators(expectedSolution);

    if (JSON.stringify(studentNumbers) !== JSON.stringify(expectedNumbers)) {
        return {
            correct: false,
            errorType: 'INVALID_STRUCTURE',
            errors: [{ position: { r: 0, c: 0 }, expected: 'Same numbers', actual: studentExpression }],
            hints: [{
              messageKey: 'hint_numbers_changed',
              message: 'Du hast die Zahlen verändert. Bitte nur Klammern hinzufügen.',
              highlightCells: [{ r: 0, c: 0 }],
              errorType: 'INVALID_STRUCTURE'
            }]
        };
    }

    if (studentOperators !== expectedOperators) {
        return {
            correct: false,
            errorType: 'OPERATOR_MODIFICATION_ERROR',
            errors: [{ position: { r: 0, c: 0 }, expected: 'Same operators', actual: studentExpression }],
            hints: [{
              messageKey: 'hint_operators_changed',
              message: 'Du hast die Rechenzeichen verändert. Bitte nur Klammern hinzufügen.',
              highlightCells: [{ r: 0, c: 0 }],
              errorType: 'OPERATOR_MODIFICATION_ERROR'
            }]
        };
    }

    // 1. Check if parentheses are present
    if (!studentExpression.includes('(') || !studentExpression.includes(')')) {
      return {
        correct: false,
        errorType: 'MISSING_PARENTHESES',
        errors: [{ position: { r: 0, c: 0 }, expected: 'Expression with parentheses', actual: studentExpression }],
        hints: [{
          messageKey: 'hint_missing_parentheses',
          message: 'Du musst Klammern setzen, um das Ergebnis zu verändern.',
          highlightCells: [{ r: 0, c: 0 }],
          errorType: 'MISSING_PARENTHESES'
        }]
      };
    }

    // 2. Evaluate the expression
    let evaluatedResult: number;
    try {
      // Basic safe evaluation for simple arithmetic expressions
      // Only allow numbers, +, -, *, /, (, )
      if (!/^[0-9+\-*/()]+$/.test(studentExpression)) {
        throw new Error('Invalid characters');
      }
      // eslint-disable-next-line no-new-func
      evaluatedResult = new Function(`return ${studentExpression}`)();
    } catch (e) {
      return {
        correct: false,
        errorType: 'INVALID_STRUCTURE',
        errors: [{ position: { r: 0, c: 0 }, expected: 'Valid mathematical expression', actual: studentExpression }],
        hints: [{
          messageKey: 'hint_invalid_structure',
          message: 'Der mathematische Ausdruck ist ungültig. Überprüfe deine Klammern.',
          highlightCells: [{ r: 0, c: 0 }],
          errorType: 'INVALID_STRUCTURE'
        }]
      };
    }

    // 3. Check if the result matches
    if (evaluatedResult !== targetResult) {
      return {
        correct: false,
        errorType: 'ORDER_OF_OPERATIONS_ERROR',
        errors: [{ position: { r: 0, c: 0 }, expected: `Expression evaluating to ${targetResult}`, actual: `Expression evaluating to ${evaluatedResult}` }],
        hints: [{
          messageKey: 'hint_wrong_result_parentheses',
          message: `Dein Ausdruck ergibt ${evaluatedResult}, aber das Ziel ist ${targetResult}. Verschiebe die Klammern.`,
          highlightCells: [{ r: 0, c: 0 }],
          errorType: 'ORDER_OF_OPERATIONS_ERROR'
        }]
      };
    }

    // Optional: Check for redundant parentheses (e.g. (2*3)+4 when target is 10)
    // We can evaluate the expression without parentheses to see if it already matches the target
    const expressionWithoutParens = studentExpression.replace(/[()]/g, '');
    let resultWithoutParens: number;
    try {
      // eslint-disable-next-line no-new-func
      resultWithoutParens = new Function(`return ${expressionWithoutParens}`)();
    } catch (e) {
      resultWithoutParens = NaN;
    }

    if (resultWithoutParens === targetResult) {
        return {
            correct: false,
            errorType: 'REDUNDANT_PARENTHESES',
            errors: [{ position: { r: 0, c: 0 }, expected: 'Necessary parentheses', actual: studentExpression }],
            hints: [{
              messageKey: 'hint_redundant_parentheses',
              message: 'Diese Klammern verändern das Ergebnis nicht (Punkt-vor-Strich-Rechnung). Setze sie woanders.',
              highlightCells: [{ r: 0, c: 0 }],
              errorType: 'REDUNDANT_PARENTHESES'
            }]
          };
    }

    return { correct: true, errorType: null, errors, hints };
  }
}
