import { describe, it, expect, beforeEach } from 'vitest';
import { EngineRegistry, EnginePlugin } from '../registry';
import { MathEngine, StepResult, ValidationResult, StepState } from '../types';

class MockEngine implements MathEngine {
  generate(config: any): StepResult {
    return {} as StepResult;
  }
  validate(state: StepState): ValidationResult {
    return {} as ValidationResult;
  }
}

const mockPlugin1: EnginePlugin = {
  id: 'mock1',
  displayName: 'Mock 1',
  create: () => new MockEngine(),
  getSkills: () => [],
  getDifficultySchema: () => ({}),
};

const mockPlugin2: EnginePlugin = {
  id: 'mock2',
  displayName: 'Mock 2',
  create: () => new MockEngine(),
  getSkills: () => [],
  getDifficultySchema: () => ({}),
};

describe('EngineRegistry', () => {
  let registry: EngineRegistry;

  beforeEach(() => {
    // We need to access the singleton instance.
    // Since it's a singleton, we might need to clear it for testing,
    // but TypeScript doesn't allow accessing private properties easily.
    // We will just use the instance and test its behavior.
    registry = EngineRegistry.getInstance();
    // Hack to clear plugins for testing
    (registry as any).plugins.clear();
  });

  it('should register and get an engine', () => {
    registry.register(mockPlugin1);
    const plugin = registry.get('mock1');
    expect(plugin).toBeDefined();
    expect(plugin.id).toBe('mock1');
  });

  it('should list all registered engines', () => {
    registry.register(mockPlugin1);
    registry.register(mockPlugin2);
    const plugins = registry.list();
    expect(plugins.length).toBe(2);
    expect(plugins.map(p => p.id)).toContain('mock1');
    expect(plugins.map(p => p.id)).toContain('mock2');
  });

  it('should throw error when getting non-existent engine', () => {
    expect(() => registry.get('nonexistent')).toThrowError("Engine with id 'nonexistent' not found.");
  });

  it('should prevent duplicate registration', () => {
    registry.register(mockPlugin1);
    expect(() => registry.register(mockPlugin1)).toThrowError("Engine with id 'mock1' is already registered.");
  });
});
