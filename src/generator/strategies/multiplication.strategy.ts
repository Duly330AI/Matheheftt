import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { GenerationStrategy } from '../TaskGenerator';
import { SeededRandom } from '../seed/SeededRandom';

export class MultiplicationStrategy implements GenerationStrategy {
  public generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    if (profile.fixedOperand !== undefined) {
      const fixed = profile.fixedOperand;
      const other = rng.nextInt(1, 10);
      
      if (rng.nextBoolean()) {
        return {
          type: 'mul',
          multiplicand: fixed,
          multiplier: other,
        };
      } else {
        return {
          type: 'mul',
          multiplicand: other,
          multiplier: fixed,
        };
      }
    }

    const minMultiplicand = Math.pow(10, profile.digits - 1);
    const maxMultiplicand = Math.pow(10, profile.digits) - 1;

    // For multiplication, multiplier digits are usually less or equal
    const multiplierDigits = Math.max(1, profile.digits - 1);
    const minMultiplier = Math.pow(10, multiplierDigits - 1);
    const maxMultiplier = Math.pow(10, multiplierDigits) - 1;

    let multiplicand = rng.nextInt(minMultiplicand, maxMultiplicand);
    let multiplier = rng.nextInt(minMultiplier, maxMultiplier);

    return {
      type: 'mul',
      multiplicand,
      multiplier,
    };
  }
}
