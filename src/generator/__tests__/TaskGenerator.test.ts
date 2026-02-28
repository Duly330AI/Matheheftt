import { describe, it, expect } from 'vitest';
import { TaskGenerator } from '../TaskGenerator';
import { DifficultyProfile } from '../profiles/difficultyProfiles';
import { StudentModel } from '../../student/StudentModel';
import { TelemetryEvent } from '../../telemetry/types';

describe('TaskGenerator', () => {
  it('respects seed determinism', () => {
    const generator1 = new TaskGenerator(12345);
    const generator2 = new TaskGenerator(12345);

    const profile: DifficultyProfile = { operation: 'add', digits: 3 };

    const task1a = generator1.generate(profile);
    const task1b = generator1.generate(profile);

    const task2a = generator2.generate(profile);
    const task2b = generator2.generate(profile);

    expect(task1a).toEqual(task2a);
    expect(task1b).toEqual(task2b);
  });

  it('generates task with carry when required', () => {
    const generator = new TaskGenerator(42);
    const profile: DifficultyProfile = { operation: 'add', digits: 2, requireCarry: true };

    const task = generator.generate(profile);
    expect(task.type).toBe('add');
    
    // Check if it has carry
    const op1 = task.operands![0];
    const op2 = task.operands![1];
    
    const str1 = op1.toString().padStart(2, '0');
    const str2 = op2.toString().padStart(2, '0');
    
    let hasCarry = false;
    let carry = 0;
    for (let i = 1; i >= 0; i--) {
      const sum = parseInt(str1[i]) + parseInt(str2[i]) + carry;
      if (sum >= 10) {
        hasCarry = true;
        break;
      }
      carry = Math.floor(sum / 10);
    }
    
    expect(hasCarry).toBe(true);
  });

  it('never generates negative when forbidden', () => {
    const generator = new TaskGenerator(99);
    const profile: DifficultyProfile = { operation: 'sub', digits: 3, allowNegative: false };

    for (let i = 0; i < 10; i++) {
      const task = generator.generate(profile);
      expect(task.type).toBe('sub');
      expect(task.minuend!).toBeGreaterThanOrEqual(task.subtrahend!);
    }
  });

  it('adapts to student model (weak concepts)', () => {
    const generator = new TaskGenerator(101);
    const profile: DifficultyProfile = { operation: 'sub', digits: 2 };
    const studentModel = new StudentModel();
    
    // Simulate errors to make subtraction_borrow weak
    const events: TelemetryEvent[] = [
      { id: '1', timestamp: 1000, type: 'session_start', payload: { operation: 'sub' } },
      { id: '2', timestamp: 2000, type: 'error', payload: { errorType: 'hint_borrow_error' } },
      { id: '3', timestamp: 3000, type: 'error', payload: { errorType: 'hint_borrow_error' } },
      { id: '4', timestamp: 4000, type: 'error', payload: { errorType: 'hint_borrow_error' } },
    ];
    studentModel.updateFromTelemetry(events);

    const task = generator.generate(profile, studentModel);
    expect(task.type).toBe('sub');
    
    // Check if it has borrow
    const mStr = task.minuend!.toString().padStart(2, '0');
    const sStr = task.subtrahend!.toString().padStart(2, '0');
    
    let hasBorrow = false;
    let borrow = 0;
    for (let i = 1; i >= 0; i--) {
      const mDigit = parseInt(mStr[i]);
      const sDigit = parseInt(sStr[i]) + borrow;
      if (mDigit < sDigit) {
        hasBorrow = true;
        break;
      }
      borrow = 0;
    }
    
    expect(hasBorrow).toBe(true);
  });
});
