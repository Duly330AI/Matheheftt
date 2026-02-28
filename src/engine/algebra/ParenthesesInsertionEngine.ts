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
    // We use a grid where the first row shows the original expression (read-only)
    // and the second row is for the user input (single chars).
    
    // Parse expression into tokens for display: "2 * 3 + 4" -> ["2", "*", "3", "+", "4"]
    // We can just split by space if the generator ensures spaces.
    // The generator produces: `${a} * ${b} + ${c}`
    const tokens = expression.split(' ');
    
    // Calculate grid size
    // Row 0: Tokens + " = " + Target
    // Row 1: Empty cells for user input. Length should be enough for expression + parens.
    // Let's give generous space. Expression length + 4 (for parens and spaces).
    // Actually, let's just make it wide enough. 12 columns?
    const cols = 12;
    const rows = 2;

    const grid: GridMatrix = Array(rows).fill(null).map(() => Array(cols).fill(null));

    // --- Row 0: Task Display ---
    let c = 0;
    tokens.forEach(token => {
        grid[0][c] = {
            id: `0,${c}`,
            value: token,
            expectedValue: token,
            role: 'helper', // Use helper role for read-only task display
            isEditable: false
        };
        c++;
    });

    // Add = and Target
    grid[0][c] = {
        id: `0,${c}`,
        value: '=',
        expectedValue: '=',
        role: 'operator',
        isEditable: false
    };
    c++;
    grid[0][c] = {
        id: `0,${c}`,
        value: targetResult.toString(),
        expectedValue: targetResult.toString(),
        role: 'result',
        isEditable: false
    };

    // Fill rest of row 0 with empty
    for (let i = c + 1; i < cols; i++) {
        grid[0][i] = { id: `0,${i}`, value: '', expectedValue: '', role: 'empty', isEditable: false };
    }

    // --- Row 1: User Input ---
    // All editable algebra_term cells
    const targetCells: Position[] = [];
    for (let i = 0; i < c; i++) { // Only up to the equals sign
        grid[1][i] = {
            id: `1,${i}`,
            value: '',
            expectedValue: '', // Dynamic validation
            role: 'algebra_term',
            isEditable: true
        };
        targetCells.push({ r: 1, c: i });
    }

    // Add = and Target to Row 1 as well (aligned)
    grid[1][c] = {
        id: `1,${c}`,
        value: '=',
        expectedValue: '=',
        role: 'operator',
        isEditable: false
    };
    grid[1][c+1] = {
        id: `1,${c+1}`,
        value: targetResult.toString(),
        expectedValue: targetResult.toString(),
        role: 'result',
        isEditable: false
    };

    // Fill rest of row 1 with empty
    for (let i = c + 2; i < cols; i++) {
        grid[1][i] = { id: `1,${i}`, value: '', expectedValue: '', role: 'empty', isEditable: false };
    }

    const steps: Step[] = [
      {
        id: 'insert_parentheses',
        type: 'insert_parentheses',
        targetCells: targetCells,
        expectedValues: [solution || ''], 
        explanationKey: 'insert_parentheses_explanation',
        nextFocus: { r: 1, c: 0 }
      }
    ];

    const meta: GridMeta = {
      rows,
      cols,
      resultRow: 0,
      workingAreaStartRow: 1,
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

    // Reconstruct student expression from Row 1
    let studentExpression = '';
    const row1 = userGrid[1];
    for (const cell of row1) {
        if (cell.value) {
            studentExpression += cell.value;
        }
    }

    // Helper to mark all input cells as incorrect
    const markAllIncorrect = (errorType: ErrorType) => {
        const errors: CellError[] = [];
        row1.forEach((cell, idx) => {
            if (cell.isEditable && cell.value) {
                errors.push({
                    position: { r: 1, c: idx },
                    expected: '', // Not strictly checked per cell
                    actual: cell.value
                });
            }
        });
        return errors;
    };
    
    // Target result is in Row 0. We need to find the result cell.
    // It's the last non-empty cell in Row 0 usually, or we can look for role='result'
    let targetResult = 0;
    const row0 = userGrid[0];
    const resultCell = row0.find(c => c.role === 'result');
    if (resultCell) {
        targetResult = parseInt(resultCell.value, 10);
    }

    // 0. Token-based validation
    // Extract tokens from student expression: numbers and operators (excluding parentheses)
    const extractTokens = (s: string) => {
        // Match numbers or operators, ignore parentheses and whitespace
        return s.match(/\d+|[+\-*/]/g) || [];
    };

    const solution = currentStep.expectedValues[0];
    const studentTokens = extractTokens(studentExpression);
    const expectedTokens = extractTokens(solution);

    // Check if tokens match exactly in order
    if (JSON.stringify(studentTokens) !== JSON.stringify(expectedTokens)) {
        // Analyze WHY they don't match
        const studentNumbers = studentTokens.filter(t => /^\d+$/.test(t));
        const expectedNumbers = expectedTokens.filter(t => /^\d+$/.test(t));
        
        const studentOps = studentTokens.filter(t => /^[+\-*/]$/.test(t));
        const expectedOps = expectedTokens.filter(t => /^[+\-*/]$/.test(t));

        // 1. Check if numbers are correct (count and values)
        if (JSON.stringify(studentNumbers.sort()) !== JSON.stringify(expectedNumbers.sort())) {
             return {
                correct: false,
                errorType: 'INVALID_STRUCTURE',
                errors: markAllIncorrect('INVALID_STRUCTURE'),
                hints: [{
                  messageKey: 'hint_numbers_changed',
                  message: 'Du hast die Zahlen verändert. Bitte verwende genau die Zahlen aus der Aufgabe.',
                  highlightCells: targetCells,
                  errorType: 'INVALID_STRUCTURE'
                }]
            };
        }

        // 2. Check if operators are correct (count and values)
        if (JSON.stringify(studentOps.sort()) !== JSON.stringify(expectedOps.sort())) {
             return {
                correct: false,
                errorType: 'OPERATOR_MODIFICATION_ERROR',
                errors: markAllIncorrect('OPERATOR_MODIFICATION_ERROR'),
                hints: [{
                  messageKey: 'hint_operators_changed',
                  message: 'Du hast die Rechenzeichen verändert. Bitte verwende genau die Zeichen aus der Aufgabe.',
                  highlightCells: targetCells,
                  errorType: 'OPERATOR_MODIFICATION_ERROR'
                }]
            };
        }

        // 3. If numbers and ops are correct sets, but order is wrong
        return {
            correct: false,
            errorType: 'OPERATOR_REORDER_ERROR',
            errors: markAllIncorrect('OPERATOR_REORDER_ERROR'),
            hints: [{
              messageKey: 'hint_reorder_error',
              message: 'Du hast die Reihenfolge verändert. Bitte schreibe die Aufgabe genau so ab und füge nur Klammern hinzu.',
              highlightCells: targetCells,
              errorType: 'OPERATOR_REORDER_ERROR'
            }]
        };
    }

    // 1. Check if parentheses are present
    if (!studentExpression.includes('(') || !studentExpression.includes(')')) {
      return {
        correct: false,
        errorType: 'MISSING_PARENTHESES',
        errors: markAllIncorrect('MISSING_PARENTHESES'),
        hints: [{
          messageKey: 'hint_missing_parentheses',
          message: 'Du musst Klammern setzen, um das Ergebnis zu verändern.',
          highlightCells: targetCells,
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
        errors: markAllIncorrect('INVALID_STRUCTURE'),
        hints: [{
          messageKey: 'hint_invalid_structure',
          message: 'Der mathematische Ausdruck ist ungültig. Überprüfe deine Klammern.',
          highlightCells: targetCells,
          errorType: 'INVALID_STRUCTURE'
        }]
      };
    }

    // 3. Check if the result matches
    if (evaluatedResult !== targetResult) {
      return {
        correct: false,
        errorType: 'ORDER_OF_OPERATIONS_ERROR',
        errors: markAllIncorrect('ORDER_OF_OPERATIONS_ERROR'),
        hints: [{
          messageKey: 'hint_wrong_result_parentheses',
          message: `Dein Ausdruck ergibt ${evaluatedResult}, aber das Ziel ist ${targetResult}. Verschiebe die Klammern.`,
          highlightCells: targetCells,
          errorType: 'ORDER_OF_OPERATIONS_ERROR'
        }]
      };
    }

    // Optional: Check for redundant parentheses
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
            errors: markAllIncorrect('REDUNDANT_PARENTHESES'),
            hints: [{
              messageKey: 'hint_redundant_parentheses',
              message: 'Diese Klammern verändern das Ergebnis nicht (Punkt-vor-Strich-Rechnung). Setze sie woanders.',
              highlightCells: targetCells,
              errorType: 'REDUNDANT_PARENTHESES'
            }]
          };
    }

    return { correct: true, errorType: null, errors: [], hints: [] };
  }
}
