import { describe, it, expect, beforeEach } from 'vitest';
import { LearningPathPlanner } from '../LearningPathPlanner';
import { StudentModel } from '../../student/StudentModel';
import { TaskDescriptor, SessionSummary } from '../types';

describe('LearningPathPlanner', () => {
  let planner: LearningPathPlanner;
  let studentModel: StudentModel;
  let availableTasks: TaskDescriptor[];
  let sessionHistory: SessionSummary[];

  beforeEach(() => {
    planner = new LearningPathPlanner(12345);
    studentModel = new StudentModel();
    // Mock getWeakSkills to return specific weak skills for testing
    studentModel.getWeakSkills = () => ['addition_carry'];
    studentModel.getRecommendedDifficulty = (op) => ({ operation: op, digits: 3, requireCarry: true });

    availableTasks = [
      {
        id: 'add_3_carry',
        operation: 'add',
        difficulty: { operation: 'add', digits: 3, requireCarry: true },
        skillsTrained: ['addition_carry', 'addition_no_carry'],
        estimatedTime: 30,
      },
      {
        id: 'sub_3_borrow',
        operation: 'sub',
        difficulty: { operation: 'sub', digits: 3, requireBorrow: true },
        skillsTrained: ['subtraction_borrow', 'subtraction_no_borrow'],
        estimatedTime: 40,
      },
      {
        id: 'mul_3_basic',
        operation: 'mul',
        difficulty: { operation: 'mul', digits: 3 },
        skillsTrained: ['multiplication_basic'],
        estimatedTime: 20,
      },
    ];
    sessionHistory = [];
  });

  it('should prioritize tasks that train weak skills', () => {
    const planned = planner.nextTask({
      studentModel,
      availableTasks,
      sessionHistory,
    });

    expect(planned.task.id).toBe('add_3_carry');
    expect(planned.reason).toContain('Trains weak skills: addition_carry');
  });

  it('should avoid tasks with recent failures (frustration risk)', () => {
    // Simulate recent failure on addition
    sessionHistory = [
      { taskId: 'add_3_carry', success: false, timestamp: Date.now() - 10000 },
      { taskId: 'add_3_carry', success: false, timestamp: Date.now() - 5000 },
    ];

    const planned = planner.nextTask({
      studentModel,
      availableTasks,
      sessionHistory,
    });

    // Should pick something else, e.g., subtraction or multiplication
    // Even though addition is weak, frustration risk penalty should outweigh it
    expect(planned.task.id).not.toBe('add_3_carry');
    expect(planned.reason).not.toContain('Avoids frustration'); // Reason for selected task won't be frustration avoidance, but penalty applies to add
  });

  it('should favor novel tasks if no specific weakness', () => {
    studentModel.getWeakSkills = () => []; // No weak skills
    sessionHistory = [
      { taskId: 'add_3_carry', success: true, timestamp: Date.now() - 10000 },
      { taskId: 'sub_3_borrow', success: true, timestamp: Date.now() - 5000 },
    ];

    const planned = planner.nextTask({
      studentModel,
      availableTasks,
      sessionHistory,
    });

    // Multiplication hasn't been done recently
    expect(planned.task.id).toBe('mul_3_basic');
    expect(planned.reason).toContain('Novelty boost');
  });

  it('should be deterministic with the same seed', () => {
    const planner1 = new LearningPathPlanner(999);
    const planner2 = new LearningPathPlanner(999);

    const result1 = planner1.nextTask({ studentModel, availableTasks, sessionHistory });
    const result2 = planner2.nextTask({ studentModel, availableTasks, sessionHistory });

    expect(result1.task.id).toBe(result2.task.id);
    expect(result1.score).toBe(result2.score);
  });

  it('should produce different results with different seeds (due to jitter)', () => {
    // This test is tricky because logic dominates jitter.
    // We need a scenario where scores are very close (tie-breaking).
    studentModel.getWeakSkills = () => [];
    sessionHistory = [];
    
    // Two identical tasks
    const tasks = [
      { ...availableTasks[0], id: 'task_A' },
      { ...availableTasks[0], id: 'task_B' },
    ];

    const planner1 = new LearningPathPlanner(111);
    const planner2 = new LearningPathPlanner(222);

    const result1 = planner1.nextTask({ studentModel, availableTasks: tasks, sessionHistory });
    const result2 = planner2.nextTask({ studentModel, availableTasks: tasks, sessionHistory });

    // With different seeds, the jitter might favor different tasks if base scores are identical
    // Note: This is probabilistic but highly likely given the implementation
    // If it fails, it means jitter didn't flip the choice, which is possible but rare if implemented correctly
    // For robustness, we check if scores are slightly different at least
    expect(result1.score).not.toBe(result2.score);
  });
});
