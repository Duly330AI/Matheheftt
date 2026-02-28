import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { GenerationStrategy } from '../TaskGenerator';
import { SeededRandom } from '../seed/SeededRandom';

export class SubtractionStrategy implements GenerationStrategy {
  public generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    const min = Math.pow(10, profile.digits - 1);
    const max = Math.pow(10, profile.digits) - 1;

    let minuend = 0;
    let subtrahend = 0;
    let valid = false;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!valid && attempts < maxAttempts) {
      attempts++;
      minuend = rng.nextInt(min, max);
      subtrahend = rng.nextInt(min, max);

      if (!profile.allowNegative && minuend < subtrahend) {
        // Swap to ensure positive result
        const temp = minuend;
        minuend = subtrahend;
        subtrahend = temp;
      }

      const hasBorrow = this.checkBorrow(minuend, subtrahend);

      if (profile.requireBorrow !== undefined) {
        if (profile.requireBorrow && !hasBorrow) continue;
        if (!profile.requireBorrow && hasBorrow) continue;
      }

      valid = true;
    }

    return {
      type: 'sub',
      minuend,
      subtrahend,
      method: 'borrow', // Defaulting to borrow for now, could be configurable
    };
  }

  private checkBorrow(minuend: number, subtrahend: number): boolean {
    let mStr = minuend.toString();
    let sStr = subtrahend.toString();
    
    while (mStr.length < sStr.length) mStr = '0' + mStr;
    while (sStr.length < mStr.length) sStr = '0' + sStr;

    let borrow = 0;
    for (let i = mStr.length - 1; i >= 0; i--) {
      const mDigit = parseInt(mStr[i], 10);
      const sDigit = parseInt(sStr[i], 10) + borrow;
      
      if (mDigit < sDigit) {
        return true;
      }
      borrow = 0;
    }
    return false;
  }
}
