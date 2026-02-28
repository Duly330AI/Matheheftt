import { MathEngine, StepResult } from '../engine/types';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class EngineValidator {
  public static validate(engine: MathEngine, config: any): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const result: StepResult = engine.generate(config);
      const { grid, steps } = result;

      // 1. Matrix consistency
      if (!grid || grid.length === 0) {
        errors.push("Grid is empty");
        return { isValid: false, errors, warnings };
      }

      const cols = grid[0].length;
      for (let r = 0; r < grid.length; r++) {
        if (grid[r].length !== cols) {
          errors.push(`Grid row ${r} has inconsistent length. Expected ${cols}, got ${grid[r].length}`);
        }
      }

      // 2. Steps validation
      if (!steps || steps.length === 0) {
        errors.push("No steps generated");
      }

      const cellMap = new Set<string>();
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          cellMap.add(`${r},${c}`);
        }
      }

      steps.forEach((step, index) => {
        if (!step.targetCells || step.targetCells.length === 0) {
          errors.push(`Step ${index} (${step.id}) has no target cells (dead step)`);
        }

        step.targetCells.forEach(pos => {
          if (!cellMap.has(`${pos.r},${pos.c}`)) {
            errors.push(`Step ${index} target cell ${pos.r},${pos.c} does not exist in grid`);
          }
        });

        if (step.dependencies) {
          step.dependencies.forEach(pos => {
            if (!cellMap.has(`${pos.r},${pos.c}`)) {
              errors.push(`Step ${index} dependency cell ${pos.r},${pos.c} does not exist in grid`);
            }
          });
        }

        if (step.expectedValues.length !== step.targetCells.length) {
          errors.push(`Step ${index} expectedValues count does not match targetCells count`);
        }
      });

    } catch (e: any) {
      errors.push(`Engine generation threw an error: ${e.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
