import { MathNode } from './types';
import { Canonicalizer, CanonicalizeOptions } from './Canonicalizer';
import { ExpressionLayoutEngine } from './ExpressionLayoutEngine';

export class AnswerComparator {
  /**
   * Compares two mathematical expressions for equivalence.
   * It canonicalizes both and then compares their structure.
   */
  public static areEquivalent(a: MathNode, b: MathNode): boolean {
    const canonicalA = Canonicalizer.canonicalize(a);
    const canonicalB = Canonicalizer.canonicalize(b);

    return this.compareNodes(canonicalA, canonicalB);
  }

  /**
   * Compares two mathematical expressions for exact structural equality.
   * No canonicalization is performed.
   */
  public static compareStructure(a: MathNode, b: MathNode): boolean {
    return this.compareNodes(a, b);
  }

  /**
   * Compares two mathematical expressions using specific canonicalization options.
   * Useful for checking partial simplifications.
   */
  public static comparePartial(a: MathNode, b: MathNode, options: CanonicalizeOptions): boolean {
    const canonicalA = Canonicalizer.canonicalize(a, options);
    const canonicalB = Canonicalizer.canonicalize(b, options);

    return this.compareNodes(canonicalA, canonicalB);
  }

  /**
   * Compares a user's string input against an expected MathNode.
   * This is useful for free-text inputs.
   */
  public static compareStringToNode(userInput: string, expected: MathNode): boolean {
    // This would require a Parser (Phase 5 or so).
    // For now, we can only compare if the user input is already tokenized into a node.
    return false;
  }

  private static compareNodes(a: MathNode, b: MathNode): boolean {
    if (a.type !== b.type) return false;

    // We can use the LayoutEngine's flatten to get a comparable string representation
    // of the canonical form.
    const cellsA = ExpressionLayoutEngine.flatten(a);
    const cellsB = ExpressionLayoutEngine.flatten(b);

    if (cellsA.length !== cellsB.length) return false;

    for (let i = 0; i < cellsA.length; i++) {
      if (cellsA[i].expectedValue !== cellsB[i].expectedValue) return false;
    }

    return true;
  }
}
