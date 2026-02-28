import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { SeededRandom } from '../seed/SeededRandom';
import { GenerationStrategy } from '../TaskGenerator';

export class AlgebraStrategy implements GenerationStrategy {
  generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    // Determine type of algebra problem
    // For now, only 'expand' is supported
    
    // Generate factor (2-9)
    const factor = rng.nextInt(2, 9);
    
    // Generate variable (x, y, a, b)
    const variables = ['x', 'y', 'a', 'b', 'n'];
    const variable = variables[rng.nextInt(0, variables.length - 1)];
    
    // Generate constant term (1-9)
    const constant = rng.nextInt(1, 9);
    
    // Decide structure: a(x + b) or a(b + x)
    const structure = rng.next() > 0.5 ? 'var_first' : 'const_first';
    
    let terms: string[];
    if (structure === 'var_first') {
        terms = [variable, constant.toString()];
    } else {
        terms = [constant.toString(), variable];
    }
    
    return {
      type: 'algebra',
      factor: factor.toString(),
      terms: terms,
      operators: ['+'] // For now only addition
    };
  }
}
