import { MathNode, BinaryOpNode, NumberNode } from './types';
import { Canonicalizer } from './Canonicalizer';
import { AnswerComparator } from './AnswerComparator';

export interface StructuralComparisonResult {
  isEquivalent: boolean;
  isIdentical: boolean;
  isCommutativeEquivalent: boolean; // e.g. 2+3 vs 3+2
  studentTermsCount: number;
  expectedTermsCount: number;
  studentConstantsCount: number;
  expectedConstantsCount: number;
}

export class StructuralComparator {
  /**
   * Performs a deep structural comparison between two ASTs.
   * This goes beyond simple equivalence to detect if terms are uncombined,
   * or if the difference is purely commutative (ordering).
   */
  public static compare(student: MathNode, expected: MathNode): StructuralComparisonResult {
    const isEquivalent = AnswerComparator.areEquivalent(student, expected);
    const isIdentical = AnswerComparator.compareStructure(student, expected);
    
    // Check for commutative equivalence (same terms, different order)
    const studentSorted = Canonicalizer.canonicalize(student, { combineLikeTerms: false, sortTerms: true, removeZero: false });
    const expectedSorted = Canonicalizer.canonicalize(expected, { combineLikeTerms: false, sortTerms: true, removeZero: false });
    const isCommutativeEquivalent = AnswerComparator.compareStructure(studentSorted, expectedSorted);

    // Uncombined terms check (ignoring zeros)
    const studentUncombined = Canonicalizer.canonicalize(student, { combineLikeTerms: false, sortTerms: true, removeZero: true });
    const expectedUncombined = Canonicalizer.canonicalize(expected, { combineLikeTerms: false, sortTerms: true, removeZero: true });

    const studentTermsCount = this.countTerms(studentUncombined);
    const expectedTermsCount = this.countTerms(expectedUncombined);
    const studentConstantsCount = this.countConstants(studentUncombined);
    const expectedConstantsCount = this.countConstants(expectedUncombined);

    return {
      isEquivalent,
      isIdentical,
      isCommutativeEquivalent,
      studentTermsCount,
      expectedTermsCount,
      studentConstantsCount,
      expectedConstantsCount
    };
  }

  private static countTerms(node: MathNode): number {
    if (node.type === 'binary_op' && ((node as BinaryOpNode).op === '+' || (node as BinaryOpNode).op === '-')) {
      const b = node as BinaryOpNode;
      return this.countTerms(b.left) + this.countTerms(b.right);
    }
    if (node.type === 'number' && (node as NumberNode).value === '0') return 0;
    return 1;
  }

  private static countConstants(node: MathNode): number {
    if (node.type === 'binary_op' && ((node as BinaryOpNode).op === '+' || (node as BinaryOpNode).op === '-')) {
      const b = node as BinaryOpNode;
      return this.countConstants(b.left) + this.countConstants(b.right);
    }
    if (node.type === 'number' && (node as NumberNode).value !== '0') return 1;
    return 0;
  }
}
