import { TelemetryEvent } from './types';

export interface ReplayController {
  input(cellId: string, value: string): void;
  next(): void;
}

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
