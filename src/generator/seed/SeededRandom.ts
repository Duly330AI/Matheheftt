export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Simple LCG (Linear Congruential Generator)
  public next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public nextBoolean(): boolean {
    return this.next() >= 0.5;
  }

  public getSeed(): number {
    return this.seed;
  }
}
