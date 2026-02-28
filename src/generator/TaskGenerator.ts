import { DifficultyProfile, ProblemConfig } from './profiles/difficultyProfiles';
import { SeededRandom } from './seed/SeededRandom';
import { AdditionStrategy } from './strategies/addition.strategy';
import { SubtractionStrategy } from './strategies/subtraction.strategy';
import { MultiplicationStrategy } from './strategies/multiplication.strategy';
import { DivisionStrategy } from './strategies/division.strategy';
import { AlgebraStrategy } from './strategies/algebra.strategy';
import { StudentModel } from '../student/StudentModel';

export interface GenerationStrategy {
  generate(profile: DifficultyProfile, rng: SeededRandom): ProblemConfig;
}

export class TaskGenerator {
  private rng: SeededRandom;
  private strategies: Record<string, GenerationStrategy>;
  private history: string[] = [];

  constructor(seed: number = Date.now()) {
    this.rng = new SeededRandom(seed);
    this.strategies = {
      add: new AdditionStrategy(),
      sub: new SubtractionStrategy(),
      mul: new MultiplicationStrategy(),
      div: new DivisionStrategy(),
      algebra: new AlgebraStrategy(),
    };
  }

  public getSeed(): number {
    return this.rng.getSeed();
  }

  public generate(profile: DifficultyProfile, studentModel?: StudentModel): ProblemConfig {
    // Apply student model adaptations
    const adaptedProfile = this.adaptProfile(profile, studentModel);

    const strategy = this.strategies[adaptedProfile.operation];
    if (!strategy) {
      throw new Error(`Strategy for operation ${adaptedProfile.operation} not found`);
    }

    let config: ProblemConfig;
    let attempts = 0;
    const maxAttempts = 10;

    // Anti-repetition guard
    do {
      config = strategy.generate(adaptedProfile, this.rng);
      attempts++;
    } while (this.isRepetition(config) && attempts < maxAttempts);

    this.recordHistory(config);

    return config;
  }

  private adaptProfile(profile: DifficultyProfile, studentModel?: StudentModel): DifficultyProfile {
    if (!studentModel) return profile;

    const weakSkills = studentModel.getWeakSkills();
    const adapted = { ...profile };

    // If student struggles with carry, force carry
    if (weakSkills.includes('addition_carry')) {
      adapted.requireCarry = true;
    }

    // If student struggles with borrow, force borrow
    if (weakSkills.includes('subtraction_borrow')) {
      adapted.requireBorrow = true;
    }

    return adapted;
  }

  private isRepetition(config: ProblemConfig): boolean {
    const key = JSON.stringify(config);
    return this.history.includes(key);
  }

  private recordHistory(config: ProblemConfig): void {
    const key = JSON.stringify(config);
    this.history.push(key);
    if (this.history.length > 5) {
      this.history.shift();
    }
  }
}
