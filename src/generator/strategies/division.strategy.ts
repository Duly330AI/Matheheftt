import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { GenerationStrategy } from '../TaskGenerator';
import { SeededRandom } from '../seed/SeededRandom';

export class DivisionStrategy implements GenerationStrategy {
  public generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    const minDividend = Math.pow(10, profile.digits - 1);
    const maxDividend = Math.pow(10, profile.digits) - 1;

    // Divisor is usually smaller, e.g., 1 or 2 digits
    const divisorDigits = Math.max(1, profile.digits - 2);
    const minDivisor = Math.pow(10, divisorDigits - 1);
    const maxDivisor = Math.pow(10, divisorDigits) - 1;

    let dividend = 0;
    let divisor = 0;
    let valid = false;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!valid && attempts < maxAttempts) {
      attempts++;
      dividend = rng.nextInt(minDividend, maxDividend);
      divisor = rng.nextInt(minDivisor, maxDivisor);

      if (divisor === 0) continue;

      const remainder = dividend % divisor;

      if (profile.requireRemainder !== undefined) {
        if (profile.requireRemainder && remainder === 0) continue;
        if (!profile.requireRemainder && remainder > 0) continue;
      }

      valid = true;
    }

    return {
      type: 'div',
      dividend,
      divisor,
    };
  }
}
