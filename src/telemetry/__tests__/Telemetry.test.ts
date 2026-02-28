import { describe, it, expect } from 'vitest';
import { TelemetryLogger } from '../TelemetryLogger';
import { SessionReplay, ReplayController } from '../SessionReplay';

describe('TelemetryLogger', () => {
  it('records input events with duration', () => {
    const logger = new TelemetryLogger('session-1');
    logger.log('input', { cellId: '0,0', value: '5' });
    
    const events = logger.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('input');
    expect(events[0].payload.cellId).toBe('0,0');
    expect(events[0].payload.durationSinceLastEvent).toBeGreaterThanOrEqual(0);
  });

  it('keeps session id', () => {
    const logger = new TelemetryLogger('session-2');
    expect(logger.getSessionId()).toBe('session-2');
  });
});

describe('SessionReplay', () => {
  it('reproduces a full session deterministically', async () => {
    const events: any[] = [
      { type: 'input', payload: { cellId: '0,0', value: '1' } },
      { type: 'input', payload: { cellId: '0,1', value: '2' } },
      { type: 'step_transition', payload: {} }
    ];

    const inputs: string[] = [];
    let nextCount = 0;

    const controller: ReplayController = {
      input: (cellId, value) => inputs.push(`${cellId}:${value}`),
      next: () => nextCount++
    };

    await SessionReplay.replay(events, controller, 0);

    expect(inputs).toEqual(['0,0:1', '0,1:2']);
    expect(nextCount).toBe(1);
  });
});
