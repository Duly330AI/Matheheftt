export type MathNodeType = 
  | 'number' 
  | 'variable' 
  | 'binary_op' 
  | 'unary_op' 
  | 'root' 
  | 'fraction'
  | 'power'
  | 'equation';

export interface MathNode {
  type: MathNodeType;
  id: string;
  forceParentheses?: boolean;
}

export interface NumberNode extends MathNode {
  type: 'number';
  value: string;
}

export interface VariableNode extends MathNode {
  type: 'variable';
  name: string;
}

export type BinaryOperator = '+' | '-' | '*' | '/' | '^' | '=';

export interface BinaryOpNode extends MathNode {
  type: 'binary_op';
  op: BinaryOperator;
  left: MathNode;
  right: MathNode;
  implicit?: boolean;
}

export interface UnaryOpNode extends MathNode {
  type: 'unary_op';
  op: '-' | '+';
  child: MathNode;
}

export interface RootNode extends MathNode {
  type: 'root';
  child: MathNode;
}

export interface FractionNode extends MathNode {
  type: 'fraction';
  numerator: MathNode;
  denominator: MathNode;
}

export interface PowerNode extends MathNode {
  type: 'power';
  base: MathNode;
  exponent: MathNode;
}

export interface EquationNode extends MathNode {
  type: 'equation';
  left: MathNode;
  right: MathNode;
}
