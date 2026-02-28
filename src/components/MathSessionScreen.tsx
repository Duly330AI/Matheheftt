import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { engineRegistry } from '../engine';
import { GridRenderer } from '../ui/grid/GridRenderer';
import { useMathSession } from '../session/useMathSession';
import { DefaultFlowEngine } from '../flow/DefaultFlowEngine';
import { FocusTarget, AnimationInstruction } from '../flow/types';
import { DiagnosticOverlay } from '../devtools/DiagnosticOverlay';
import { TelemetryLogger } from '../telemetry/TelemetryLogger';
import { PerformanceMonitor } from '../diagnostics/PerformanceMonitor';
import { TaskGenerator } from '../generator/TaskGenerator';
import { DifficultyProfile } from '../generator/profiles/difficultyProfiles';
import { StudentModel } from '../student/StudentModel';
import { CognitiveLoadEngine } from '../cognitive/CognitiveLoadEngine';
import { Toolbar } from './Toolbar';
import { TaskType, Difficulty, GameMode, SessionState, Profile } from '../types';
import { CognitiveLoadState } from '../cognitive/types';
import { LearningPathPlanner } from '../planner/LearningPathPlanner';
import { TaskDescriptor, SessionSummary } from '../planner/types';

interface MathSessionScreenProps {
  activeProfile: Profile;
  taskType: TaskType;
  selectedTable: number | null;
  difficulty: Difficulty;
  gameMode: GameMode;
  timeLimit?: number;
  studentModel: StudentModel;
  onFinish: (state: SessionState) => void;
  onExit: () => void;
}

// Simple translation helper
const t = (key: string | null): string | null => {
  if (!key) return null;
  const translations: Record<string, string> = {
    'hint_carry_error': 'Du hast den Übertrag vergessen.',
    'hint_add_column_error': 'Das Ergebnis in dieser Spalte stimmt nicht.',
    'hint_borrow_error': 'Du hast das Entleihen vergessen oder falsch gemacht.',
    'hint_subtract_column_error': 'Die Subtraktion in dieser Spalte ist falsch.',
    'hint_multiply_digit_error': 'Das Teilprodukt ist falsch.',
    'division_estimate_too_large': 'Deine Schätzung ist zu groß.',
    'division_estimate_too_small': 'Deine Schätzung ist zu klein.',
    'multiply_error': 'Die Multiplikation ist falsch.',
    'subtract_error': 'Die Subtraktion ist falsch.',
    'forgot_bring_down': 'Du hast vergessen, die nächste Ziffer herunterzuholen.',
    'hint_error': 'Das stimmt noch nicht ganz.',
    'hint_algebra_expand_error': 'Beim Auflösen der Klammer ist ein Fehler passiert. Multipliziere den Faktor vor der Klammer mit jedem Term in der Klammer.',
    'algebra_expand_explanation_1': 'Multipliziere den Faktor mit dem ersten Term in der Klammer.',
    'algebra_expand_explanation_2': 'Multipliziere den Faktor mit dem zweiten Term in der Klammer.',
  };
  return translations[key] || key;
};

export const MathSessionScreen: React.FC<MathSessionScreenProps> = ({
  activeProfile,
  taskType,
  selectedTable,
  difficulty,
  gameMode,
  timeLimit,
  studentModel,
  onFinish,
  onExit
}) => {
  // Session State
  const [currentOperation, setCurrentOperation] = useState<string>(() => {
    if (taskType === 'mixed') return 'addition';
    if (taskType === '1x1') return 'multiplication';
    if (taskType === '+') return 'addition';
    if (taskType === '-') return 'subtraction';
    if (taskType === '*') return 'multiplication';
    if (taskType === ':') return 'division';
    if (taskType === 'algebra') return 'algebra';
    if (taskType === 'insert_parentheses') return 'insert_parentheses';
    return 'addition';
  });

  // Update currentOperation when taskType changes (e.g. from StartScreen)
  useEffect(() => {
    if (taskType === 'mixed') setCurrentOperation('addition');
    else if (taskType === '1x1') setCurrentOperation('multiplication');
    else if (taskType === '+') setCurrentOperation('addition');
    else if (taskType === '-') setCurrentOperation('subtraction');
    else if (taskType === '*') setCurrentOperation('multiplication');
    else if (taskType === ':') setCurrentOperation('division');
    else if (taskType === 'algebra') setCurrentOperation('algebra');
    else if (taskType === 'insert_parentheses') setCurrentOperation('insert_parentheses');
  }, [taskType]);
  const [score, setScore] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [startTime] = useState(Date.now());
  const [seed, setSeed] = useState<number>(Date.now());
  
  const [cognitiveTimeline, setCognitiveTimeline] = useState<{ timestamp: number; state: CognitiveLoadState }[]>([]);
  const [plannerDecisions, setPlannerDecisions] = useState<any[]>([]);
  const allSessionEventsRef = React.useRef<any[]>([]);
  const lastErrorEventKeyRef = React.useRef<string | null>(null);

  // Planner State
  const planner = useMemo(() => new LearningPathPlanner(Date.now()), []);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);

  // Engine Setup
  const engine = useMemo(() => {
    try {
      return engineRegistry.get(currentOperation).create();
    } catch (e) {
      return engineRegistry.get('addition').create();
    }
  }, [currentOperation]);

  const flowEngine = useMemo(() => new DefaultFlowEngine(), []);
  const telemetry = useMemo(() => new TelemetryLogger(), []);
  const loadEngine = useMemo(() => new CognitiveLoadEngine(), []);
  
  const { state, start, input, next, reset, undo, clearUserInputs, check } = useMathSession(engine);

  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [animation, setAnimation] = useState<AnimationInstruction | null>(null);
  const [taskProcessed, setTaskProcessed] = useState(false);

  // Determine if current step is parentheses insertion
  const currentStep = state.steps[state.currentStepIndex];
  const isParenthesesTask = currentStep?.type === 'insert_parentheses';

  // Timer Logic for Time Attack and Exam Mode
  useEffect(() => {
    if (timeLimit && (gameMode === 'time_attack' || gameMode === 'exam')) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = timeLimit * 1000 - elapsed;
        
        if (remaining <= 0) {
          clearInterval(interval);
          onFinish({
            score,
            totalTasks: tasksCompleted,
            correctTasks: tasksCompleted,
            startTime,
            gameMode,
            currentTaskIndex: tasksCompleted,
            telemetryEvents: allSessionEventsRef.current,
            cognitiveTimeline,
            plannerDecisions
          });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLimit, gameMode, startTime, onFinish, score, tasksCompleted]);

  // Task Generation
  const generateTask = useCallback(() => {
    setTaskProcessed(false);
    let nextOp = currentOperation;

    // If mixed mode, use planner to pick next task
    if (taskType === 'mixed') {
        const availableTasks: TaskDescriptor[] = [
          { id: 'add_easy', operation: 'add', difficulty: { operation: 'add', digits: 2, requireCarry: false }, skillsTrained: ['addition_no_carry'], estimatedTime: 10 },
          { id: 'add_medium', operation: 'add', difficulty: { operation: 'add', digits: 3, requireCarry: true }, skillsTrained: ['addition_carry'], estimatedTime: 20 },
          { id: 'sub_easy', operation: 'sub', difficulty: { operation: 'sub', digits: 2, requireBorrow: false, allowNegative: false }, skillsTrained: ['subtraction_no_borrow'], estimatedTime: 15 },
          { id: 'sub_medium', operation: 'sub', difficulty: { operation: 'sub', digits: 3, requireBorrow: true, allowNegative: false }, skillsTrained: ['subtraction_borrow'], estimatedTime: 25 },
          { id: 'mul_easy', operation: 'mul', difficulty: { operation: 'mul', digits: 2 }, skillsTrained: ['multiplication_basic'], estimatedTime: 20 },
          { id: 'div_easy', operation: 'div', difficulty: { operation: 'div', digits: 2, requireRemainder: false }, skillsTrained: ['division_process'], estimatedTime: 25 },
          { id: 'insert_parentheses', operation: 'insert_parentheses', difficulty: { operation: 'insert_parentheses', digits: 1 }, skillsTrained: ['algebra_parentheses_insertion'], estimatedTime: 15 },
        ];

        const planned = planner.nextTask({
          studentModel,
          availableTasks,
          sessionHistory
        });

        nextOp = planned.task.operation === 'add' ? 'addition' :
                 planned.task.operation === 'sub' ? 'subtraction' :
                 planned.task.operation === 'mul' ? 'multiplication' :
                 planned.task.operation === 'div' ? 'division' :
                 planned.task.operation === 'algebra' ? 'algebra' :
                 planned.task.operation === 'insert_parentheses' ? 'insert_parentheses' : 'addition';
        
        // Use the difficulty from the planned task
        const plannedDifficulty = planned.task.id.includes('easy') ? 'easy' : 'medium';
        
        if (nextOp !== currentOperation) {
            setCurrentOperation(nextOp);
            return; // Wait for re-render with new engine
        }
        
        // We need a way to pass the planned difficulty to the generator, but for now we'll just log it
        setPlannerDecisions(prev => [...prev, {
          task: planned.task,
          score: planned.score,
          reason: planned.reason
        }]);
    } else if (taskType === 'algebra') {
        nextOp = 'algebra';
        if (nextOp !== currentOperation) {
            setCurrentOperation(nextOp);
            return;
        }
    } else if (taskType === 'insert_parentheses') {
        nextOp = 'insert_parentheses';
        if (nextOp !== currentOperation) {
            setCurrentOperation(nextOp);
            return;
        }
    }

    telemetry.clear();
    telemetry.log('session_start', { operation: currentOperation, seed });

    const generator = new TaskGenerator(seed);

    PerformanceMonitor.measure('generator', () => {
      let profile: DifficultyProfile;
      
      // Map difficulty string to profile properties
      const digits = difficulty === 'easy' ? 2 : (difficulty === 'medium' ? 3 : 4);
      
      if (nextOp === 'addition') {
        profile = { 
          operation: 'add', 
          digits, 
          requireCarry: difficulty !== 'easy' 
        };
      } else if (nextOp === 'subtraction') {
        profile = { 
          operation: 'sub', 
          digits, 
          requireBorrow: difficulty !== 'easy',
          allowNegative: false
        };
      } else if (nextOp === 'multiplication') {
        if (taskType === '1x1') {
             // 1x1 Logic
             profile = { 
               operation: 'mul', 
               digits: 1,
               fixedOperand: selectedTable || undefined
             }; 
        } else {
            profile = { 
              operation: 'mul', 
              digits: difficulty === 'easy' ? 2 : 3 
            };
        }
      } else if (nextOp === 'division') {
        profile = { 
          operation: 'div', 
          digits: difficulty === 'easy' ? 2 : 3,
          requireRemainder: difficulty === 'hard'
        };
      } else if (nextOp === 'algebra') {
        // Algebra
        profile = {
          operation: 'algebra',
          digits: 1,
          pedagogicFocus: 'expand'
        };
      } else {
        // insert_parentheses
        profile = {
          operation: 'insert_parentheses',
          digits: 1
        };
      }

      const config = generator.generate(profile, studentModel);

      if (taskType !== 'mixed') {
        // Log planner decision for non-mixed modes
        setPlannerDecisions(prev => [...prev, {
          task: { id: `${nextOp}_${difficulty}` },
          score: 0.95,
          reason: `Passend zum Profil: ${difficulty}`
        }]);
      }

      if (nextOp === 'addition' && config.operands) start({ operands: config.operands });
      else if (nextOp === 'subtraction' && config.minuend !== undefined) start({ minuend: config.minuend, subtrahend: config.subtrahend, method: 'complement' });
      else if (nextOp === 'multiplication' && config.multiplicand !== undefined) start({ multiplicand: config.multiplicand, multiplier: config.multiplier });
      else if (nextOp === 'division' && config.dividend !== undefined) start({ dividend: config.dividend, divisor: config.divisor });
      else if (nextOp === 'algebra') start(config);
      else if (nextOp === 'insert_parentheses') start(config);
    });
  }, [currentOperation, seed, taskType, difficulty, studentModel, start, telemetry, selectedTable]);

  // Initial Task
  useEffect(() => {
    generateTask();
  }, [generateTask]);

  // Flow Engine Integration
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'generated') return;

    const anim = flowEngine.getAnimation(state);
    setAnimation(anim);

    const nextFocus = flowEngine.getNextFocus(state);
    setFocusTarget(nextFocus);

    if (flowEngine.shouldAdvanceStep(state)) {
      const timer = setTimeout(() => {
        // Calculate cognitive load for this step
        const load = loadEngine.calculateLoad(1000, 2000, 0, 0);
        setCognitiveTimeline(prev => [...prev, { timestamp: Date.now(), state: load.state }]);

        telemetry.log('step_transition', { 
          fromStepIndex: state.currentStepIndex, 
          toStepIndex: state.currentStepIndex + 1 
        });
        next();
      }, 800);
      return () => clearTimeout(timer);
    }

    if (state.status === 'error') {
      const errorKey = `${state.currentStepIndex}|${state.hintMessageKey || ''}|${state.highlights.join(',')}`;
      if (lastErrorEventKeyRef.current === errorKey) {
        return;
      }
      lastErrorEventKeyRef.current = errorKey;

      // Calculate cognitive load for error
      const load = loadEngine.calculateLoad(2000, 2000, 1, 0);
      setCognitiveTimeline(prev => [...prev, { timestamp: Date.now(), state: load.state }]);

      telemetry.log('error', {
        stepIndex: state.currentStepIndex,
        errorType: state.errorType || state.hintMessageKey,
        hintMessageKey: state.hintMessageKey,
        highlights: state.highlights
      });

      if (state.errorType) {
        telemetry.log('diagnostic_event', {
          stepIndex: state.currentStepIndex,
          errorType: state.errorType,
          operation: currentOperation,
          difficulty: difficulty
        });
      }
    }

    if (state.status !== 'error') {
      lastErrorEventKeyRef.current = null;
    }

    if (state.status === 'finished' && !taskProcessed) {
      setTaskProcessed(true);
      telemetry.log('session_end', { totalSteps: state.steps.length });
      
      // Update Score
      setScore(s => s + 100); // Simple scoring
      const newTasksCompleted = tasksCompleted + 1;
      setTasksCompleted(newTasksCompleted);

      // Determine task success and primary error
      const taskEvents = telemetry.getEvents();
      const errorEvents = taskEvents.filter(e => e.type === 'error');
      const success = errorEvents.length === 0;
      const primaryErrorType = errorEvents.length > 0 ? errorEvents[0].payload.errorType : null;

      setSessionHistory(prev => [...prev, {
        taskId: `${currentOperation}_${difficulty}`,
        success,
        errorType: primaryErrorType,
        timestamp: Date.now()
      }]);

      // Update Student Model
      PerformanceMonitor.measure('student_model_update', () => {
        studentModel.updateFromTelemetry(taskEvents);
        allSessionEventsRef.current = [...allSessionEventsRef.current, ...taskEvents];
        localStorage.setItem(`mathTrainer.studentModel.${activeProfile.id}`, studentModel.serialize());
      });
      
      // Check for Classic Mode limit
      if (gameMode === 'classic' && newTasksCompleted >= 10) {
          // Finish session after a short delay to show the "Super!" message
          setTimeout(() => {
              onFinish({
                  score: score + 100, // Include current task score
                  totalTasks: newTasksCompleted,
                  correctTasks: newTasksCompleted,
                  startTime,
                  gameMode,
                  currentTaskIndex: newTasksCompleted,
                  telemetryEvents: [...allSessionEventsRef.current, ...telemetry.getEvents()],
                  cognitiveTimeline,
                  plannerDecisions
              });
          }, 1500);
      }
    }
  }, [state, flowEngine, next, telemetry, studentModel, gameMode, tasksCompleted, score, onFinish, startTime, taskProcessed, loadEngine, cognitiveTimeline, plannerDecisions, activeProfile.id]);

  const handleNewTask = () => {
    setSeed(Date.now());
  };

  const handleFinishSession = () => {
      onFinish({
          score,
          totalTasks: tasksCompleted, // or planned total
          correctTasks: tasksCompleted, // assuming only finished are correct for now
          startTime,
          gameMode,
          currentTaskIndex: tasksCompleted,
          telemetryEvents: allSessionEventsRef.current,
          cognitiveTimeline,
          plannerDecisions
      });
  };

  const handleCellChange = (cellId: string, value: string) => {
    telemetry.log('input', { cellId, value, stepIndex: state.currentStepIndex });
    PerformanceMonitor.measure('step_validation', () => {
      input(cellId, value);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, cellId: string) => {
    if (e.key === 'Enter') {
      if (state.status === 'correct') {
        telemetry.log('step_transition', { 
          fromStepIndex: state.currentStepIndex, 
          toStepIndex: state.currentStepIndex + 1 
        });
        next();
      } else if (state.status === 'solving') {
          // Trigger manual validation on Enter
          check();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toolbar 
        activeProfile={activeProfile}
        sessionState={{
            score,
            currentTaskIndex: tasksCompleted + 1,
            totalTasks: 10, // Placeholder
            startTime,
            gameMode,
            examReviewMode: false
        }}
        taskType={taskType}
        difficulty={difficulty}
        onNewTask={handleNewTask}
        onClear={clearUserInputs}
        onLogout={onExit}
      />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <DiagnosticOverlay state={state} seed={seed} studentModel={studentModel} />
        
        <div className="mb-8">
          <GridRenderer 
            grid={state.grid} 
            activeStep={state.status !== 'finished' ? state.steps[state.currentStepIndex] : undefined}
            onCellChange={handleCellChange}
            onCellKeyDown={handleKeyDown}
            highlightCells={state.highlights}
            focusTargetId={focusTarget?.cellId}
            animation={animation}
          />
        </div>

        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[120px] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Feedback</h2>
            {state.status === 'error' ? (
              <p className="text-lg text-red-600">
                {state.hintMessage || t(state.hintMessageKey) || "Das stimmt noch nicht ganz."}
              </p>
            ) : state.status === 'correct' ? (
              <p className="text-lg text-green-600">
                Richtig! Geht gleich weiter...
              </p>
            ) : state.status === 'finished' ? (
              <p className="text-lg text-green-600 font-bold">
                Super! Du hast die Aufgabe komplett gelöst!
              </p>
            ) : (
              <p className="text-lg text-gray-700">
                {state.steps[state.currentStepIndex] ? `Tippe das Ergebnis für den markierten Bereich ein.` : ''}
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button 
              onClick={undo}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Rückgängig
            </button>
            
            {state.status === 'finished' ? (
              <div className="flex gap-2">
                  <button 
                    onClick={handleNewTask}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nächste Aufgabe
                  </button>
                  <button 
                    onClick={handleFinishSession}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Beenden
                  </button>
              </div>
            ) : state.status === 'correct' ? (
              <button 
                onClick={() => {
                  telemetry.log('step_transition', { 
                    fromStepIndex: state.currentStepIndex, 
                    toStepIndex: state.currentStepIndex + 1 
                  });
                  next();
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Nächster Schritt
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
