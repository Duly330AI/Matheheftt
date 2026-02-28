import { 
  MathNode, 
  BinaryOpNode, 
  NumberNode, 
  VariableNode, 
  BinaryOperator 
} from './types';
import { ExpressionTransformer } from './ExpressionTransformer';

export interface Term {
  coefficient: number;
  variable: string; // empty string for constants
}

export interface CanonicalizeOptions {
  combineLikeTerms?: boolean;
  sortTerms?: boolean;
  removeZero?: boolean;
}

const defaultOptions: CanonicalizeOptions = {
  combineLikeTerms: true,
  sortTerms: true,
  removeZero: true
};

export class Canonicalizer {
  /**
   * Transforms a MathNode into its canonical (normalized) form.
   * This allows for reliable comparison of different but mathematically equivalent expressions.
   */
  public static canonicalize(node: MathNode, options: CanonicalizeOptions = defaultOptions): MathNode {
    const opts = { ...defaultOptions, ...options };
    // 1. Recursive canonicalization of children
    let canonicalNode = this.processRecursive(node, opts);

    // 2. Flatten and collect terms for additive/multiplicative structures
    if (canonicalNode.type === 'binary_op') {
      const b = canonicalNode as BinaryOpNode;
      if (b.op === '+' || b.op === '-') {
        return this.canonicalizeAddition(b, opts);
      }
      if (b.op === '*') {
        return this.canonicalizeMultiplication(b, opts);
      }
    }

    return canonicalNode;
  }

  private static processRecursive(node: MathNode, options: CanonicalizeOptions): MathNode {
    const clone = ExpressionTransformer.clone(node);
    
    switch (clone.type) {
      case 'binary_op': {
        const b = clone as BinaryOpNode;
        b.left = this.canonicalize(b.left, options);
        b.right = this.canonicalize(b.right, options);
        return b;
      }
      case 'unary_op': {
        // Convert unary minus to binary op or handle it
        return clone;
      }
      case 'equation': {
        const eq = clone as any;
        eq.left = this.canonicalize(eq.left, options);
        eq.right = this.canonicalize(eq.right, options);
        return eq;
      }
      default:
        return clone;
    }
  }

  /**
   * Normalizes addition: sorting terms, combining like terms, removing zeros.
   * Rule: Constants first, then variables alphabetically.
   */
  private static canonicalizeAddition(node: BinaryOpNode, options: CanonicalizeOptions): MathNode {
    const terms = this.collectAdditiveTerms(node);
    
    let resultTerms: Term[] = [];

    if (options.combineLikeTerms) {
      const combined: Map<string, number> = new Map();
      for (const term of terms) {
        const current = combined.get(term.variable) || 0;
        combined.set(term.variable, current + term.coefficient);
      }
      for (const [variable, coefficient] of combined.entries()) {
        resultTerms.push({ coefficient, variable });
      }
    } else {
      resultTerms = [...terms];
    }

    if (options.removeZero) {
      resultTerms = resultTerms.filter(t => t.coefficient !== 0);
    }

    if (options.sortTerms) {
      // Sort: Constants (empty string) first, then alphabetically
      resultTerms.sort((a, b) => {
        if (a.variable === '') return -1;
        if (b.variable === '') return 1;
        return a.variable.localeCompare(b.variable);
      });
    }

    // Convert back to nodes
    const resultNodes: MathNode[] = [];
    
    for (const term of resultTerms) {
      if (term.variable === '') {
        resultNodes.push({ type: 'number', id: Math.random().toString(), value: term.coefficient.toString() } as NumberNode);
      } else {
        const varName = term.coefficient === 1 ? term.variable : (term.coefficient === -1 ? `-${term.variable}` : `${term.coefficient}${term.variable}`);
        resultNodes.push({ type: 'variable', id: Math.random().toString(), name: varName } as VariableNode);
      }
    }

    if (resultNodes.length === 0) {
      return { type: 'number', id: Math.random().toString(), value: '0' } as NumberNode;
    }

    return this.buildBalancedTree(resultNodes, '+');
  }

  private static collectAdditiveTerms(node: MathNode, multiplier: number = 1): Term[] {
    if (node.type === 'binary_op') {
      const b = node as BinaryOpNode;
      if (b.op === '+') {
        return [
          ...this.collectAdditiveTerms(b.left, multiplier),
          ...this.collectAdditiveTerms(b.right, multiplier)
        ];
      }
      if (b.op === '-') {
        return [
          ...this.collectAdditiveTerms(b.left, multiplier),
          ...this.collectAdditiveTerms(b.right, -multiplier)
        ];
      }
    }

    // Base case: extract coefficient and variable
    if (node.type === 'number') {
      return [{ coefficient: parseInt((node as NumberNode).value) * multiplier, variable: '' }];
    }
    if (node.type === 'variable') {
      const name = (node as VariableNode).name;
      const match = name.match(/^([-+]?\d*)(.*)$/);
      if (match) {
        let coeffStr = match[1];
        const varPart = match[2];
        let coeff = 1;
        if (coeffStr === '-') coeff = -1;
        else if (coeffStr === '+') coeff = 1;
        else if (coeffStr !== '') coeff = parseInt(coeffStr);
        
        return [{ coefficient: coeff * multiplier, variable: varPart }];
      }
    }

    return [{ coefficient: multiplier, variable: node.id }]; // Fallback
  }

  /**
   * Normalizes multiplication: sorting factors, combining constants, removing ones.
   */
  private static canonicalizeMultiplication(node: BinaryOpNode, options: CanonicalizeOptions): MathNode {
    // For MVP, we keep it simple: Number * Variable
    const simplified = ExpressionTransformer.simplify(node);
    return simplified;
  }

  private static buildBalancedTree(nodes: MathNode[], op: BinaryOperator): MathNode {
    if (nodes.length === 1) return nodes[0];
    
    // Simple left-heavy tree for now
    let root = nodes[0];
    for (let i = 1; i < nodes.length; i++) {
      root = {
        type: 'binary_op',
        id: Math.random().toString(),
        op,
        left: root,
        right: nodes[i]
      } as BinaryOpNode;
    }
    return root;
  }
}
