export type TelemetryEventType = 'input' | 'step_transition' | 'error' | 'diagnostic_event' | 'session_start' | 'session_end';

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  type: TelemetryEventType;
  payload: any;
}

export interface InputPayload {
  cellId: string;
  value: string;
  stepIndex: number;
  expectedValue?: string;
  isCorrect?: boolean;
  durationSinceLastEvent: number;
}

export interface StepTransitionPayload {
  fromStepIndex: number;
  toStepIndex: number;
  duration: number;
}

export interface ErrorPayload {
  stepIndex: number;
  cellId: string;
  inputValue: string;
  expectedValue: string;
  errorType: string;
}
