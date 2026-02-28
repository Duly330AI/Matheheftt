import { describe, it, expect } from 'vitest';
import { StudentModel } from '../StudentModel';
import { TelemetryEvent } from '../../telemetry/types';

describe('StudentModel', () => {
  it('should initialize with default scores', () => {
    const model = new StudentModel();
    expect(model.getSkillScore('addition_carry')).toBe(0.5);
  });

  it('should increase score after correct attempts', () => {
    const model = new StudentModel();
    
    // Simulate a session with 3 correct steps
    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'add' } },
      { id: '2', timestamp: 2000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
      { id: '3', timestamp: 3000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
      { id: '4', timestamp: 4000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
    ];

    model.updateFromTelemetry(events);
    
    // 3 correct attempts -> score should be 0.5 + 3 * 0.05 = 0.65
    expect(model.getSkillScore('addition_no_carry')).toBeCloseTo(0.65);
  });

  it('should decrease score after errors', () => {
    const model = new StudentModel();
    
    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'add' } },
      { id: '2', timestamp: 2000, type: 'error', payload: { errorType: 'hint_carry_error' } },
      { id: '3', timestamp: 3000, type: 'error', payload: { errorType: 'hint_carry_error' } },
      { id: '4', timestamp: 4000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
    ];

    model.updateFromTelemetry(events);
    
    // 2 errors -> score should be 0.5 - 2 * 0.1 = 0.3
    expect(model.getSkillScore('addition_carry')).toBeCloseTo(0.3);
  });

  it('should detect weak skills', () => {
    const model = new StudentModel();
    
    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'add' } },
      { id: '2', timestamp: 2000, type: 'error', payload: { errorType: 'hint_carry_error' } },
      { id: '3', timestamp: 3000, type: 'error', payload: { errorType: 'hint_carry_error' } },
      { id: '4', timestamp: 4000, type: 'error', payload: { errorType: 'hint_carry_error' } },
    ];

    model.updateFromTelemetry(events);
    
    const weakSkills = model.getWeakSkills();
    expect(weakSkills).toContain('addition_carry');
  });

  it('should adapt difficulty correctly', () => {
    const model = new StudentModel();
    
    // Make addition_carry weak
    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'add' } },
      { id: '2', timestamp: 2000, type: 'error', payload: { errorType: 'hint_carry_error' } },
      { id: '3', timestamp: 3000, type: 'error', payload: { errorType: 'hint_carry_error' } },
      { id: '4', timestamp: 4000, type: 'error', payload: { errorType: 'hint_carry_error' } },
    ];
    model.updateFromTelemetry(events);

    const profile = model.getRecommendedDifficulty('add');
    expect(profile.requireCarry).toBe(true);
  });

  it('should track algebra skill progression', () => {
    const model = new StudentModel();

    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'algebra' } },
      { id: '2', timestamp: 2000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
      { id: '3', timestamp: 3000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
    ];

    model.updateFromTelemetry(events);

    expect(model.getSkillScore('algebra_expand_brackets')).toBeGreaterThan(0.5);
  });

  it('should track simplify_terms skill progression', () => {
    const model = new StudentModel();

    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'simplify_terms' } },
      { id: '2', timestamp: 2000, type: 'step_transition', payload: { durationSinceLastEvent: 1000 } },
    ];

    model.updateFromTelemetry(events);

    expect(model.getSkillScore('algebra_simplify_terms')).toBeGreaterThan(0.5);
  });

  it('should serialize and deserialize correctly', () => {
    const model = new StudentModel();
    
    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'add' } },
      { id: '2', timestamp: 2000, type: 'error', payload: { errorType: 'hint_carry_error' } },
    ];
    model.updateFromTelemetry(events);

    const json = model.serialize();
    const restoredModel = StudentModel.deserialize(json);

    expect(restoredModel.getSkillScore('addition_carry')).toBeCloseTo(model.getSkillScore('addition_carry'));
  });
});
