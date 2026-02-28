import { useRef, useState, useCallback, useEffect } from 'react';
import { MathEngine } from '../engine/types';
import { MathSessionController } from './MathSessionController';
import { MathSessionState } from './sessionTypes';

export function useMathSession<TConfig>(engine: MathEngine<TConfig>) {
  const engineRef = useRef(engine);
  const controllerRef = useRef(new MathSessionController<TConfig>(engine));
  const [state, setState] = useState<MathSessionState>(controllerRef.current.getState());
  
  // Recreate controller when engine changes. Avoid setState during render.
  useEffect(() => {
    if (engineRef.current !== engine) {
      engineRef.current = engine;
      controllerRef.current = new MathSessionController<TConfig>(engine);
      setState(controllerRef.current.getState());
    }
  }, [engine]);

  const dispatch = useCallback((fn: () => void) => {
    fn();
    setState(controllerRef.current.getState());
  }, []);

  const start = useCallback((config: TConfig) => {
    dispatch(() => controllerRef.current.start(config));
  }, [dispatch]);

  const input = useCallback((cellId: string, value: string) => {
    dispatch(() => controllerRef.current.input(cellId, value));
  }, [dispatch]);

  const next = useCallback(() => {
    dispatch(() => controllerRef.current.next());
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(() => controllerRef.current.reset());
  }, [dispatch]);

  const clearUserInputs = useCallback(() => {
    dispatch(() => controllerRef.current.clearUserInputs());
  }, [dispatch]);

  const undo = useCallback(() => {
    dispatch(() => controllerRef.current.undo());
  }, [dispatch]);

  const check = useCallback(() => {
    dispatch(() => controllerRef.current.validateStep());
  }, [dispatch]);

  return {
    state,
    start,
    input,
    next,
    reset,
    clearUserInputs,
    undo,
    check,
  };
}
