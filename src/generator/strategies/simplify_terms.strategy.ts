import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { SeededRandom } from '../seed/SeededRandom';
import { GenerationStrategy } from '../TaskGenerator';

export class SimplifyTermsStrategy implements GenerationStrategy {
  generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    const variables = ['x', 'y', 'a', 'b', 'n'];
    const variable = variables[rng.nextInt(0, variables.length - 1)];
    
    // Determine level based on difficulty profile (or default to medium)
    // For now, let's map easy -> level 1, medium -> level 2, hard -> level 3
    let level = 2;
    if (profile.digits === 2) level = 1; // easy
    else if (profile.digits === 3) level = 2; // medium
    else if (profile.digits >= 4) level = 3; // hard

    const terms: string[] = [];
    
    if (level === 1) {
      // Level 1: Pure like terms (e.g. 2x + 3x)
      const numTerms = rng.nextInt(2, 3);
      for (let i = 0; i < numTerms; i++) {
        const coeff = rng.nextInt(1, 9);
        const isNegative = i > 0 && rng.next() > 0.5;
        
        let term = '';
        if (isNegative) term += '-';
        else if (i > 0) term += '+';
        
        if (coeff > 1) term += coeff;
        term += variable;
        
        terms.push(term);
      }
    } else if (level === 2) {
      // Level 2: With constants (e.g. 2x + 3 + 4x - 5)
      const numTerms = rng.nextInt(3, 4);
      for (let i = 0; i < numTerms; i++) {
        const isVariable = i % 2 === 0; // Alternate variable and constant
        const coeff = rng.nextInt(1, 9);
        const isNegative = i > 0 && rng.next() > 0.5;
        
        let term = '';
        if (isNegative) term += '-';
        else if (i > 0) term += '+';
        
        if (isVariable) {
          if (coeff > 1) term += coeff;
          term += variable;
        } else {
          term += coeff;
        }
        
        terms.push(term);
      }
    } else {
      // Level 3: Mixed + implicit order (e.g. x + 3x - 2 + 5 - x)
      const numTerms = rng.nextInt(4, 6);
      for (let i = 0; i < numTerms; i++) {
        const isVariable = rng.next() > 0.4;
        const coeff = rng.nextInt(1, 9);
        const isNegative = i > 0 && rng.next() > 0.5;
        const isImplicitOne = isVariable && coeff === 1 && rng.next() > 0.5; // Sometimes just 'x' instead of '1x'
        
        let term = '';
        if (isNegative) term += '-';
        else if (i > 0) term += '+';
        
        if (isVariable) {
          if (!isImplicitOne) term += coeff;
          term += variable;
        } else {
          term += coeff;
        }
        
        terms.push(term);
      }
    }
    
    return {
      type: 'simplify_terms',
      terms: terms,
      level: level
    };
  }
}
