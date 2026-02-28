import { DifficultyProfile, ProblemConfig } from '../profiles/difficultyProfiles';
import { GenerationStrategy } from '../TaskGenerator';
import { SeededRandom } from '../seed/SeededRandom';

export class AdditionStrategy implements GenerationStrategy {
  public generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig {
    const min = Math.pow(10, profile.digits - 1);
    const max = Math.pow(10, profile.digits) - 1;

    let op1 = 0;
    let op2 = 0;
    let valid = false;

    // We try to generate numbers that satisfy the requirements
    // To prevent infinite loops, we set a max attempts limit
    let attempts = 0;
    const maxAttempts = 1000;

    while (!valid && attempts < maxAttempts) {
      attempts++;
      op1 = rng.nextInt(min, max);
      op2 = rng.nextInt(min, max);

      const hasCarry = this.checkCarry(op1, op2);

      if (profile.requireCarry !== undefined) {
        if (profile.requireCarry && !hasCarry) continue;
        if (!profile.requireCarry && hasCarry) continue;
      }

      valid = true;
    }

    return {
      type: 'add',
      operands: [op1, op2],
    };
  }

  private checkCarry(a: number, b: number): boolean {
    let strA = a.toString();
    let strB = b.toString();
    
    // pad to same length
    while (strA.length < strB.length) strA = '0' + strA;
    while (strB.length < strA.length) strB = '0' + strB;

    let carry = 0;
    for (let i = strA.length - 1; i >= 0; i--) {
      const sum = parseInt(strA[i], 10) + parseInt(strB[i], 10) + carry;
      if (sum >= 10) {
        return true;
      }
      carry = Math.floor(sum / 10);
    }
    return false;
  }
}
