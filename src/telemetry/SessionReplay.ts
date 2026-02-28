import { TelemetryEvent } from './types';

export interface ReplayController {
  input(cellId: string, value: string): void;
  next(): void;
}

/**
 * WIP: Teacher Feature / DevTool
 * 
 * SessionReplay allows deterministic playback of a student's session.
 * This is strategically valuable for:
 * - Teacher Mode (reviewing student mistakes step-by-step)
 * - Diagnostic evaluation
 * - UX Testing
 * 
 * Currently not exposed in the main UI, but kept as a core capability.
 */
export class SessionReplay {
  public static async replay(events: TelemetryEvent[], controller: ReplayController, delayMs: number = 100): Promise<void> {
    for (const event of events) {
      if (event.type === 'input') {
        const payload = event.payload;
        controller.input(payload.cellId, payload.value);
      } else if (event.type === 'step_transition') {
        controller.next();
      }
      
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
}
