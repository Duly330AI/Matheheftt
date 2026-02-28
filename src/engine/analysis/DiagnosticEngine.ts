import { MathNode, BinaryOpNode, NumberNode, VariableNode } from '../ast/types';
import { Canonicalizer } from '../ast/Canonicalizer';
import { AnswerComparator } from '../ast/AnswerComparator';
import { StructuralComparator } from '../ast/StructuralComparator';
import { ErrorType } from '../types';

export type Severity = 'minor' | 'procedural' | 'conceptual' | 'none';

export interface DiagnosticResult {
  isCorrect: boolean;
  errorType: ErrorType;
  severity: Severity;
  hint?: string;
  messageKey?: string;
}

export class DiagnosticEngine {
  /**
   * Analyzes the difference between a student's answer and the expected answer.
   * Returns the primary (most severe/relevant) diagnostic result.
   */
  public static analyze(studentNode: MathNode, expectedNode: MathNode, originalNode?: MathNode): DiagnosticResult {
    const results = this.analyzeAll(studentNode, expectedNode, originalNode);
    // Return the first result (which is the most severe/relevant based on the order in analyzeAll)
    return results.length > 0 ? results[0] : {
      isCorrect: true,
      errorType: 'NONE',
      severity: 'none'
    };
  }

  /**
   * Analyzes the difference between a student's answer and the expected answer,
   * returning all applicable diagnostic results (e.g. partial simplification + sign error).
   */
  public static analyzeAll(studentNode: MathNode, expectedNode: MathNode, originalNode?: MathNode): DiagnosticResult[] {
    const results: DiagnosticResult[] = [];
    const structuralComparison = StructuralComparator.compare(studentNode, expectedNode);

    // 1. Check for exact structural equivalence first
    if (structuralComparison.isIdentical) {
      results.push({
        isCorrect: true,
        errorType: 'NONE',
        severity: 'none'
      });
      return results;
    }

    // 2. Check if student just copied the original problem
    if (originalNode && AnswerComparator.compareStructure(studentNode, originalNode)) {
      results.push({
        isCorrect: false,
        errorType: 'INCOMPLETE',
        severity: 'minor',
        messageKey: 'error_copied_problem',
        hint: 'Du hast die Aufgabe nur abgeschrieben. Bitte fasse die Terme zusammen.'
      });
      return results;
    }

    // 3. Check for equivalence
    if (structuralComparison.isEquivalent) {
       // It's mathematically equivalent but not identical to the expected form.

       if (structuralComparison.studentTermsCount > structuralComparison.expectedTermsCount) {
         // Check if they left constants uncombined
         if (structuralComparison.studentConstantsCount > structuralComparison.expectedConstantsCount) {
           results.push({
             isCorrect: false,
             errorType: 'CONSTANT_NOT_COMBINED',
             severity: 'procedural',
             messageKey: 'error_constant_not_combined',
             hint: 'Du hast die Zahlen noch nicht vollständig zusammengefasst.'
           });
         }

         if (originalNode) {
           const originalUncombined = Canonicalizer.canonicalize(originalNode, { combineLikeTerms: false, sortTerms: true, removeZero: true });
           const originalTermsCount = this.countTerms(originalUncombined);
           if (structuralComparison.studentTermsCount < originalTermsCount) {
             results.push({
               isCorrect: false,
               errorType: 'PARTIAL_SIMPLIFICATION',
               severity: 'procedural',
               messageKey: 'error_partial_simplification',
               hint: 'Du bist auf dem richtigen Weg! Fasse die restlichen Terme auch noch zusammen.'
             });
           }
         }

         // If we haven't already added a specific constant error, add the general like term error
         if (results.length === 0 || !results.some(r => r.errorType === 'CONSTANT_NOT_COMBINED')) {
           results.push({
             isCorrect: false,
             errorType: 'LIKE_TERM_NOT_COMBINED',
             severity: 'procedural',
             messageKey: 'error_uncombined_terms',
             hint: 'Gleiche Variablen können addiert oder subtrahiert werden. Fasse sie weiter zusammen.'
           });
         }
         return results;
       }

       // If terms count is the same, but structure is different, it might just be a different order.
       // We consider this correct!
       if (structuralComparison.isCommutativeEquivalent) {
         results.push({
           isCorrect: true,
           errorType: 'NONE',
           severity: 'none'
         });
         return results;
       }

       // Equivalent but not commutative equivalent (e.g. x+x vs 2x if somehow count was same, though impossible here)
       results.push({
         isCorrect: true,
         errorType: 'NONE',
         severity: 'none'
       });
       return results;
    }

    const studentCanonical = Canonicalizer.canonicalize(studentNode);
    const expectedCanonical = Canonicalizer.canonicalize(expectedNode);

    // 4. Check for Variable Mismatch (e.g. expected 5x, got 5)
    // If the student dropped the variable entirely
    if (this.hasVariableMismatch(studentCanonical, expectedCanonical)) {
      results.push({
        isCorrect: false,
        errorType: 'VARIABLE_MISMATCH',
        severity: 'conceptual',
        messageKey: 'error_variable_mismatch',
        hint: 'Achtung: Variablen dürfen beim Zusammenfassen nicht einfach verschwinden.'
      });
    }

    // 5. Check for Sign Error
    // We can check if the absolute values of the coefficients match
    if (this.isSignError(studentCanonical, expectedCanonical)) {
      results.push({
        isCorrect: false,
        errorType: 'SIGN_MISAPPLICATION',
        severity: 'procedural',
        messageKey: 'error_sign_mismatch',
        hint: 'Überprüfe die Vorzeichen (+/-) deiner Terme. Die Zahlenwerte scheinen zu stimmen.'
      });
    }

    // Default conceptual error if no specific error was found
    if (results.length === 0) {
      results.push({
        isCorrect: false,
        errorType: 'CONCEPTUAL',
        severity: 'conceptual',
        messageKey: 'error_general_mismatch',
        hint: 'Das Ergebnis stimmt noch nicht ganz. Schau dir die Rechenschritte nochmal an.'
      });
    }

    return results;
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

  private static hasVariableMismatch(student: MathNode, expected: MathNode): boolean {
    const studentVars = this.extractVariables(student);
    const expectedVars = this.extractVariables(expected);

    // If expected has variables but student has none (or different ones)
    for (const v of expectedVars) {
      if (!studentVars.has(v)) return true;
    }
    return false;
  }

  private static extractVariables(node: MathNode, vars: Set<string> = new Set()): Set<string> {
    if (node.type === 'variable') {
      const name = (node as VariableNode).name;
      const match = name.match(/[a-zA-Z]+/);
      if (match) vars.add(match[0]);
    } else if (node.type === 'binary_op') {
      const b = node as BinaryOpNode;
      this.extractVariables(b.left, vars);
      this.extractVariables(b.right, vars);
    }
    return vars;
  }

  private static isSignError(student: MathNode, expected: MathNode): boolean {
    // This is a simplified check for sign errors
    // In a real system, we would compare the absolute values of the canonical terms
    return false; 
  }
}
