import { DifficultyProfile, ProblemConfig, GenerationStrategy } from '../profiles/difficultyProfiles';
import { SeededRandom } from '../seed/SeededRandom';

export class ParenthesesEvaluationStrategy implements GenerationStrategy {
  generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    const digits = profile.digits || 2;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;

    let a = 0, b = 0, c = 0;
    let outerOp: '+' | '-' = '+';
    let innerOp: '+' | '-' = '+';
    let inner = -1;
    let final = -1;

    while (inner < 0 || final < 0) {
      a = rng.nextInt(min, max);
      b = rng.nextInt(min, max);
      c = rng.nextInt(min, max);
      outerOp = rng.nextBoolean() ? '+' : '-';
      innerOp = rng.nextBoolean() ? '+' : '-';

      inner = innerOp === '+' ? b + c : b - c;
      final = outerOp === '+' ? a + inner : a - inner;
    }

    return {
      type: 'parentheses_evaluation',
      a,
      b,
      c,
      outerOp,
      innerOp
    };
  }
}
