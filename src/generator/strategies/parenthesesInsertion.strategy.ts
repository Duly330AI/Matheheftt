import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { SeededRandom } from '../seed/SeededRandom';
import { GenerationStrategy } from '../TaskGenerator';

export class ParenthesesInsertionStrategy implements GenerationStrategy {
  generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    let a, b, c;
    let expression = '';
    let solution = '';
    let targetResult = 0;
    let isValid = false;

    // We want to generate an expression where a * b + c != a * (b + c)
    // or a + b * c != (a + b) * c
    // and the target result is the one WITH parentheses.

    while (!isValid) {
      a = rng.nextInt(2, 9);
      b = rng.nextInt(2, 9);
      c = rng.nextInt(2, 9);

      const type = rng.next() > 0.5 ? 'mul_add' : 'add_mul';

      if (type === 'mul_add') {
        // a * b + c
        const standardResult = a * b + c;
        const parenResult = a * (b + c);
        
        if (standardResult !== parenResult) {
          expression = `${a} * ${b} + ${c}`;
          targetResult = parenResult;
          solution = `${a} * (${b} + ${c})`;
          isValid = true;
        }
      } else {
        // a + b * c
        const standardResult = a + b * c;
        const parenResult = (a + b) * c;
        
        if (standardResult !== parenResult) {
          expression = `${a} + ${b} * ${c}`;
          targetResult = parenResult;
          solution = `(${a} + ${b}) * ${c}`;
          isValid = true;
        }
      }
    }

    return {
      type: 'insert_parentheses',
      expression,
      targetResult,
      solution
    };
  }
}
