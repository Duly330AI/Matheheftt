import { TelemetryEvent, TelemetryEventType } from './types';

export class TelemetryLogger {
  private events: TelemetryEvent[] = [];
  private lastEventTime: number;
  private sessionId: string;

  constructor(sessionId: string = Math.random().toString(36).substring(2)) {
    this.sessionId = sessionId;
    this.lastEventTime = Date.now();
  }

  public log(type: TelemetryEventType, payload: any): void {
    const now = Date.now();
    const durationSinceLastEvent = now - this.lastEventTime;
    
    const event: TelemetryEvent = {
      id: Math.random().toString(36).substring(2),
      timestamp: now,
      type,
      payload: {
        ...payload,
        durationSinceLastEvent
      }
    };
    
    this.events.push(event);
    this.lastEventTime = now;
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public clear(): void {
    this.events = [];
    this.lastEventTime = Date.now();
  }
}
