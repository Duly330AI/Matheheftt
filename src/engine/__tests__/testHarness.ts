import { expect, describe, it } from 'vitest';
import { MathEngine, StepResult } from '../types';

export interface TestCase<T> {
  name: string;
  config: T;
}

export function runGenericEngineTests<T>(
  engineName: string,
  engine: MathEngine<T>,
  cases: TestCase<T>[]
) {
  describe(`${engineName} - Generic Architecture Tests`, () => {
    cases.forEach(({ name, config }) => {
      describe(`Case: ${name}`, () => {
        let result1: StepResult;
        let result2: StepResult;

        it('should generate successfully', () => {
          result1 = engine.generate(config);
          expect(result1).toBeDefined();
          expect(result1.grid).toBeDefined();
          expect(result1.steps).toBeDefined();
        });

        it('steps are deterministic', () => {
          result2 = engine.generate(config);
          expect(result1).toEqual(result2);
        });

        it('grid dimensions match meta', () => {
          const { grid, meta } = result1;
          expect(grid.length).toBe(meta.rows);
          if (meta.rows > 0) {
            expect(grid[0].length).toBe(meta.cols);
          }
        });

        it('all cells have unique IDs', () => {
          const ids = new Set<string>();
          result1.grid.forEach((row) => {
            row.forEach((cell) => {
              expect(ids.has(cell.id)).toBe(false);
              ids.add(cell.id);
            });
          });
        });

        it('no step writes outside grid', () => {
          const { grid, steps } = result1;
          const rows = grid.length;
          const cols = rows > 0 ? grid[0].length : 0;

          steps.forEach((step) => {
            step.targetCells.forEach((pos) => {
              expect(pos.r).toBeGreaterThanOrEqual(0);
              expect(pos.r).toBeLessThan(rows);
              expect(pos.c).toBeGreaterThanOrEqual(0);
              expect(pos.c).toBeLessThan(cols);
            });
          });
        });

        it('dependencies always exist in matrix', () => {
          const { grid, steps } = result1;
          const rows = grid.length;
          const cols = rows > 0 ? grid[0].length : 0;

          steps.forEach((step) => {
            if (step.dependencies) {
              step.dependencies.forEach((pos) => {
                expect(pos.r).toBeGreaterThanOrEqual(0);
                expect(pos.r).toBeLessThan(rows);
                expect(pos.c).toBeGreaterThanOrEqual(0);
                expect(pos.c).toBeLessThan(cols);
              });
            }
          });
        });

        it('steps always have valid nextFocus', () => {
          const { grid, steps } = result1;
          const rows = grid.length;
          const cols = rows > 0 ? grid[0].length : 0;

          steps.forEach((step) => {
            if (step.nextFocus) {
              expect(step.nextFocus.r).toBeGreaterThanOrEqual(0);
              expect(step.nextFocus.r).toBeLessThan(rows);
              expect(step.nextFocus.c).toBeGreaterThanOrEqual(0);
              expect(step.nextFocus.c).toBeLessThan(cols);
            }
          });
        });
      });
    });
  });
}
