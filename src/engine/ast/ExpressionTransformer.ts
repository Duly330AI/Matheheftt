import { 
  MathNode, 
  BinaryOpNode, 
  NumberNode, 
  VariableNode, 
  BinaryOperator 
} from './types';

export class ExpressionTransformer {
  /**
   * Deep clone a node
   */
  public static clone(node: MathNode): MathNode {
    return JSON.parse(JSON.stringify(node));
  }

  /**
   * Basic expansion of distributive property: a * (b + c) -> a*b + a*c
   */
  public static expand(node: MathNode): MathNode {
    if (node.type !== 'binary_op') return this.clone(node);
    
    const b = node as BinaryOpNode;
    
    // Check for a * (b + c)
    if (b.op === '*' && b.right.type === 'binary_op') {
      const right = b.right as BinaryOpNode;
      if (right.op === '+' || right.op === '-') {
        // Distribute
        const left = b.left;
        const term1 = right.left;
        const term2 = right.right;
        
        const newLeft = this.simplify({
          type: 'binary_op',
          id: Math.random().toString(),
          op: '*',
          left: this.clone(left),
          right: this.clone(term1)
        } as BinaryOpNode);
        
        const newRight = this.simplify({
          type: 'binary_op',
          id: Math.random().toString(),
          op: '*',
          left: this.clone(left),
          right: this.clone(term2)
        } as BinaryOpNode);
        
        return {
          type: 'binary_op',
          id: Math.random().toString(),
          op: right.op,
          left: newLeft,
          right: newRight
        } as BinaryOpNode;
      }
    }
    
    return this.clone(node);
  }

  /**
   * Basic simplification: 
   * - 3 * 4 -> 12
   * - 3 * x -> 3x
   * - x * 3 -> 3x (normalization)
   */
  public static simplify(node: MathNode): MathNode {
    if (node.type !== 'binary_op') return this.clone(node);
    
    const b = node as BinaryOpNode;
    const left = this.simplify(b.left);
    const right = this.simplify(b.right);
    
    if (b.op === '*') {
      // Number * Number
      if (left.type === 'number' && right.type === 'number') {
        const val = parseInt((left as NumberNode).value) * parseInt((right as NumberNode).value);
        return { type: 'number', id: Math.random().toString(), value: val.toString() } as NumberNode;
      }
      
      // Number * Variable
      if (left.type === 'number' && right.type === 'variable') {
        const num = (left as NumberNode).value;
        const varName = (right as VariableNode).name;
        return { type: 'variable', id: Math.random().toString(), name: `${num}${varName}` } as VariableNode;
      }
      
      // Variable * Number (Normalize to Number * Variable)
      if (left.type === 'variable' && right.type === 'number') {
        const num = (right as NumberNode).value;
        const varName = (left as VariableNode).name;
        return { type: 'variable', id: Math.random().toString(), name: `${num}${varName}` } as VariableNode;
      }
    }
    
    return {
      ...this.clone(b),
      left,
      right
    } as BinaryOpNode;
  }
}
