import { describe, it, expect } from 'vitest';
import { DefaultFlowEngine } from '../DefaultFlowEngine';
import { MathSessionState } from '../../session/sessionTypes';
import { Step } from '../../engine/types';

describe('DefaultFlowEngine', () => {
  const engine = new DefaultFlowEngine();

  const createMockState = (
    status: MathSessionState['status'],
    gridValues: Record<string, string>,
    targetCells: { r: number; c: number }[],
    highlights: string[] = []
  ): MathSessionState => {
    const grid = [
      [{ id: '0,0', value: gridValues['0,0'] || '', isEditable: true }, { id: '0,1', value: gridValues['0,1'] || '', isEditable: true }],
      [{ id: '1,0', value: gridValues['1,0'] || '', isEditable: true }, { id: '1,1', value: gridValues['1,1'] || '', isEditable: true }]
    ] as any;

    const step: Step = {
      id: 'step_1',
      type: 'add_column',
      targetCells,
      expectedValues: targetCells.map(() => '1'),
      explanationKey: 'add',
      nextFocus: null,
      dependencies: []
    };

    return {
      status,
      grid,
      expectedGrid: [],
      steps: [step],
      currentStepIndex: 0,
      highlights,
      hintMessageKey: null,
      stepResult: null,
    };
  };

  it('focuses first empty cell on step start', () => {
    const state = createMockState('solving', {}, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    const focus = engine.getNextFocus(state);
    expect(focus?.cellId).toBe('0,0');
    expect(focus?.reason).toBe('auto-advance'); // Or step-start depending on logic
  });

  it('moves focus after digit input', () => {
    const state = createMockState('solving', { '0,0': '5' }, [{ r: 0, c: 0 }, { r: 0, c: 1 }]);
    const focus = engine.getNextFocus(state);
    expect(focus?.cellId).toBe('0,1');
  });

  it('does not advance when wrong', () => {
    const state = createMockState('error', { '0,0': '5' }, [{ r: 0, c: 0 }]);
    expect(engine.shouldAdvanceStep(state)).toBe(false);
  });

  it('advances when correct', () => {
    const state = createMockState('correct', { '0,0': '5' }, [{ r: 0, c: 0 }]);
    expect(engine.shouldAdvanceStep(state)).toBe(true);
  });

  it('focuses error cell on mistake', () => {
    const state = createMockState('error', { '0,0': '9' }, [{ r: 0, c: 0 }], ['0,0']);
    const focus = engine.getNextFocus(state);
    expect(focus?.cellId).toBe('0,0');
    expect(focus?.reason).toBe('error');
  });

  it('returns appropriate animation instructions', () => {
    const errorState = createMockState('error', {}, [], ['0,0']);
    expect(engine.getAnimation(errorState)).toEqual({ type: 'error-shake', cells: ['0,0'] });

    const correctState = createMockState('correct', {}, [{ r: 0, c: 0 }]);
    expect(engine.getAnimation(correctState)).toEqual({ type: 'success-flash', cells: ['0,0'] });

    const finishedState = createMockState('finished', {}, []);
    expect(engine.getAnimation(finishedState)).toEqual({ type: 'step-complete' });
  });
});
