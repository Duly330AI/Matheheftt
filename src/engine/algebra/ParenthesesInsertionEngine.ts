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
    
    if (!expression || targetResult === undefined || !solution) {
      throw new Error('Invalid config for ParenthesesInsertionEngine');
    }

    const tokens = expression.split(' ');
    const nTokens = tokens.length;
    // Provide enough cells for the original tokens PLUS two parentheses
    const editableCellsCount = nTokens + 2; 
    
    // Calculate grid size
    const cols = editableCellsCount + 3; // +3 for '=', targetResult, and padding
    const rows = 2;

    const grid: GridMatrix = Array(rows).fill(null).map(() => Array(cols).fill(null));

    // --- Row 0: Task Display ---
    for (let i = 0; i < nTokens; i++) {
        grid[0][i] = {
            id: `0,${i}`,
            value: tokens[i],
            expectedValue: tokens[i],
            role: 'helper',
            isEditable: false
        };
    }
    // Fill empty space between tokens and equals sign
    for (let i = nTokens; i < editableCellsCount; i++) {
        grid[0][i] = { id: `0,${i}`, value: '', expectedValue: '', role: 'empty', isEditable: false };
    }

    const equalsCol = editableCellsCount;
    grid[0][equalsCol] = {
        id: `0,${equalsCol}`,
        value: '=',
        expectedValue: '=',
        role: 'operator',
        isEditable: false
    };
    grid[0][equalsCol + 1] = {
        id: `0,${equalsCol + 1}`,
        value: targetResult.toString(),
        expectedValue: targetResult.toString(),
        role: 'result',
        isEditable: false
    };

    // --- Row 1: User Input ---
    const targetCells: Position[] = [];
    for (let i = 0; i < editableCellsCount; i++) {
        grid[1][i] = {
            id: `1,${i}`,
            value: '',
            expectedValue: '', 
            role: 'algebra_term',
            isEditable: true
        };
        targetCells.push({ r: 1, c: i });
    }

    grid[1][equalsCol] = {
        id: `1,${equalsCol}`,
        value: '=',
        expectedValue: '=',
        role: 'operator',
        isEditable: false
    };
    grid[1][equalsCol + 1] = {
        id: `1,${equalsCol + 1}`,
        value: targetResult.toString(),
        expectedValue: targetResult.toString(),
        role: 'result',
        isEditable: false
    };

    // Fill rest of grid with empty
    for (let r = 0; r < rows; r++) {
        for (let c = equalsCol + 2; c < cols; c++) {
            grid[r][c] = { id: `${r},${c}`, value: '', expectedValue: '', role: 'empty', isEditable: false };
        }
    }

    const steps: Step[] = [
      {
        id: 'insert_parentheses',
        type: 'insert_parentheses',
        targetCells: targetCells,
        expectedValues: [solution], 
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
    const row1 = userGrid[1];
    
    const solution = currentStep.expectedValues[0] || '';
    const pathExplicit = solution.replace(/\s+/g, '');
    const pathImplicit = pathExplicit.replace(/\*\(/g, '(').replace(/\)\*/g, ')');
    
    const validPaths = [pathExplicit];
    if (pathImplicit !== pathExplicit) {
        validPaths.push(pathImplicit);
    }
    
    // Extract user input and map to cell positions
    const inputs: { char: string, col: number }[] = [];
    for (let c = 0; c < row1.length; c++) {
        const cell = row1[c];
        if (cell.role === 'algebra_term' && cell.isEditable && cell.value) {
            inputs.push({ char: cell.value, col: c });
        }
    }
    
    const studentStr = inputs.map(i => i.char).join('');
    
    if (studentStr.length === 0) {
        return { correct: false, errorType: null, errors: [], hints: [], correctCells: [] };
    }
    
    let isExactMatch = false;
    let isPrefix = false;
    
    for (const path of validPaths) {
        if (path === studentStr) {
            isExactMatch = true;
            isPrefix = true;
            break;
        }
        if (path.startsWith(studentStr)) {
            isPrefix = true;
        }
    }
    
    if (isExactMatch) {
        return { 
            correct: true, 
            errorType: null, 
            errors: [], 
            hints: [],
            correctCells: inputs.map(i => ({ r: 1, c: i.col }))
        };
    }
    
    if (isPrefix) {
        // Incomplete but correct so far
        return {
            correct: false,
            errorType: null,
            errors: [],
            hints: [],
            correctCells: inputs.map(i => ({ r: 1, c: i.col }))
        };
    }
    
    // If we reach here, it's an error.
    // Find the longest valid prefix to identify exactly which cell is wrong.
    let longestValidPrefixLength = 0;
    for (let len = studentStr.length - 1; len >= 0; len--) {
        const prefix = studentStr.substring(0, len);
        if (validPaths.some(p => p.startsWith(prefix))) {
            longestValidPrefixLength = len;
            break;
        }
    }
    
    const correctCells = inputs.slice(0, longestValidPrefixLength).map(i => ({ r: 1, c: i.col }));
    const errorCells = inputs.slice(longestValidPrefixLength).map(i => ({ r: 1, c: i.col }));
    
    const errors: CellError[] = errorCells.map(pos => ({
        position: pos,
        expected: '', 
        actual: userGrid[pos.r][pos.c].value
    }));
    
    return {
        correct: false,
        errorType: 'INVALID_INPUT',
        errors: errors,
        correctCells: correctCells,
        hints: [{
            messageKey: 'hint_check_input',
            message: 'Diese Eingabe passt nicht zur Lösung.',
            highlightCells: [],
            errorType: 'INVALID_INPUT'
        }]
    };
  }
}
