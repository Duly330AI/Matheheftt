import { Cell } from '../types';
import { 
  MathNode, 
  NumberNode, 
  VariableNode, 
  BinaryOpNode, 
  UnaryOpNode, 
  RootNode,
  EquationNode,
  BinaryOperator
} from './types';

export interface LayoutOptions {
  isEditable?: boolean;
  parentPrecedence?: number;
}

export class ExpressionLayoutEngine {
  private static getPrecedence(node: MathNode): number {
    switch (node.type) {
      case 'number':
      case 'variable':
        return 10;
      case 'power':
        return 4;
      case 'binary_op': {
        const op = (node as BinaryOpNode).op;
        if (op === '^') return 4;
        if (op === '*' || op === '/') return 3;
        if (op === '+' || op === '-') return 2;
        if (op === '=') return 1;
        return 0;
      }
      case 'unary_op':
        return 5;
      case 'equation':
        return 1;
      case 'fraction':
        return 10; // Fractions act as their own grouping
      case 'root':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Flattens an AST node into a list of cell definitions.
   * This is the bridge between the abstract math model and the grid UI.
   */
  public static flatten(node: MathNode, options: LayoutOptions = {}): Partial<Cell>[] {
    const { isEditable = false, parentPrecedence = 0 } = options;
    const currentPrecedence = this.getPrecedence(node);
    
    // Determine if parentheses are needed
    const needsParentheses = node.forceParentheses || (currentPrecedence < parentPrecedence && currentPrecedence > 0);

    let cells: Partial<Cell>[] = [];

    switch (node.type) {
      case 'root': {
        const r = node as RootNode;
        cells = this.flatten(r.child, { ...options, parentPrecedence: 0 });
        break;
      }

      case 'number': {
        const n = node as NumberNode;
        cells = n.value.split('').map(char => ({
          value: isEditable ? '' : char,
          expectedValue: char,
          role: isEditable ? 'algebra_term' : 'digit',
          isEditable
        }));
        break;
      }
      
      case 'variable': {
        const v = node as VariableNode;
        // Render variables/terms character-wise so each symbol gets its own grid cell (e.g. "8n" => "8","n")
        cells = v.name.split('').map(char => ({
          value: isEditable ? '' : char,
          expectedValue: char,
          role: isEditable ? 'algebra_term' : 'digit',
          isEditable
        }));
        break;
      }
      
      case 'binary_op': {
        const b = node as BinaryOpNode;
        const leftCells = this.flatten(b.left, { ...options, parentPrecedence: currentPrecedence });
        const opCell: Partial<Cell>[] = b.implicit ? [] : [{
          value: b.op,
          expectedValue: b.op,
          role: 'operator',
          isEditable: false
        }];
        const rightCells = this.flatten(b.right, { ...options, parentPrecedence: currentPrecedence });
        cells = [...leftCells, ...opCell, ...rightCells];
        break;
      }

      case 'unary_op': {
        const u = node as UnaryOpNode;
        const opCell: Partial<Cell> = {
          value: u.op,
          expectedValue: u.op,
          role: 'operator',
          isEditable: false
        };
        const childCells = this.flatten(u.child, { ...options, parentPrecedence: currentPrecedence });
        cells = [opCell, ...childCells];
        break;
      }

      case 'equation': {
        const eq = node as EquationNode;
        const leftCells = this.flatten(eq.left, { ...options, parentPrecedence: currentPrecedence });
        const eqCell: Partial<Cell> = {
          value: '=',
          expectedValue: '=',
          role: 'operator',
          isEditable: false
        };
        const rightCells = this.flatten(eq.right, { ...options, parentPrecedence: currentPrecedence });
        cells = [...leftCells, eqCell, ...rightCells];
        break;
      }
      
      default:
        break;
    }

    if (needsParentheses) {
      return [
        { value: '(', expectedValue: '(', role: 'operator', isEditable: false },
        ...cells,
        { value: ')', expectedValue: ')', role: 'operator', isEditable: false }
      ];
    }

    return cells;
  }
}
