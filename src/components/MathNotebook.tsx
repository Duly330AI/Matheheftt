import React, { useState, useEffect, useCallback } from 'react';
import { Toolbar } from './Toolbar';
import { GridBoard } from './GridBoard';
import { SessionSummary } from './SessionSummary';
import { StartScreen } from './StartScreen';
import { CellData, TaskType, SessionState, Profile, Difficulty, GameMode } from '../types';
import { generateMathTask } from '../utils/mathGenerators';
import { useGridState } from '../hooks/useGridState';

const ROWS = 25;
const COLS = 30;
const TASKS_PER_SESSION = 10;

interface MathNotebookProps {
  activeProfile: Profile;
  updateScore: (points: number, category: string) => boolean;
  onLogout: () => void;
  onOpenLeaderboard: () => void;
}

export function MathNotebook({ activeProfile, updateScore, onLogout, onOpenLeaderboard }: MathNotebookProps) {
  // Session State
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    currentTaskIndex: 0,
    totalTasks: TASKS_PER_SESSION,
    score: 0,
    startTime: 0,
    taskStartTime: 0,
    gameMode: 'classic',
    difficulty: 'medium'
  });
  const [showSummary, setShowSummary] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isNewHighscore, setIsNewHighscore] = useState(false);

  // Math Logic State
  const [solutionMap, setSolutionMap] = useState<Record<string, string>>({});
  const [carryMap, setCarryMap] = useState<Record<string, string>>({});
  const [autoMoveDir, setAutoMoveDir] = useState<'left' | 'right' | 'down' | 'none'>('right');
  
  // Task Config
  const [taskType, setTaskType] = useState<TaskType>('mixed');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  // Auto-Generation State
  const [nextStartRow, setNextStartRow] = useState(2);
  const [currentTaskSolutionKeys, setCurrentTaskSolutionKeys] = useState<string[]>([]);
  const [currentTaskCarryKeys, setCurrentTaskCarryKeys] = useState<string[]>([]);

  const isExamMode = sessionState.gameMode === 'exam' && !sessionState.examReviewMode;

  // Grid State Hook
  const {
    grid,
    setGrid,
    gridRows,
    setGridRows,
    focusedCell,
    setFocusedCell,
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    isCarryMode,
    setIsCarryMode,
    setIsDragging,
    cellRefs,
    registerCellRef,
    updateCell,
    handleCellChange,
    handleCellKeyDown,
    handleCellMouseDown,
    handleCellMouseEnter,
    toggleUnderline,
    isCarryCorrect
  } = useGridState(ROWS, COLS, solutionMap, carryMap, isExamMode, autoMoveDir);

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const handleStartSession = (type: TaskType, table: number | null, difficulty: Difficulty, gameMode: GameMode, timeLimit?: number) => {
    setTaskType(type);
    setSelectedTable(table);
    setIsSessionStarted(true);
    
    // Initialize session with new params
    setGrid({});
    setSolutionMap({});
    setCarryMap({});
    setNextStartRow(2);
    setGridRows(ROWS);
    setShowSummary(false);
    setIsNewHighscore(false);
    
    setSessionState({
        isActive: true,
        currentTaskIndex: 1,
        totalTasks: gameMode === 'classic' ? TASKS_PER_SESSION : 0, // 0 means infinite/unknown
        score: 0,
        startTime: Date.now(),
        taskStartTime: Date.now(),
        gameMode,
        difficulty,
        timeLimit,
        remainingTime: timeLimit,
        examReviewMode: false
    });

    handleGenerateTask(false, type, table, difficulty);
  };

  const handleGenerateTask = useCallback((
      append = false, 
      type: TaskType = taskType, 
      table: number | null = selectedTable,
      difficulty: Difficulty = sessionState.difficulty
  ) => {
    let startR = 2;
    
    if (append) {
      startR = nextStartRow;
      // Increment task index
      setSessionState(prev => ({
        ...prev,
        currentTaskIndex: prev.currentTaskIndex + 1,
        taskStartTime: Date.now()
      }));
    }

    // Ensure grid has enough rows
    if (startR + 15 > gridRows) {
      setGridRows(prev => Math.max(prev, startR + 20));
    }

    const taskResult = generateMathTask(type, startR, table, difficulty);

    if (append) {
      setGrid(prev => ({ ...prev, ...taskResult.grid }));
      setSolutionMap(prev => ({ ...prev, ...taskResult.solutionMap }));
      setCarryMap(prev => ({ ...prev, ...taskResult.carryMap }));
    } else {
      setGrid(taskResult.grid);
      setSolutionMap(taskResult.solutionMap);
      setCarryMap(taskResult.carryMap);
    }

    setNextStartRow(startR + taskResult.taskHeight + 1);
    setCurrentTaskSolutionKeys(Object.keys(taskResult.solutionMap));
    setCurrentTaskCarryKeys(Object.keys(taskResult.carryMap));
    setAutoMoveDir(taskResult.autoMoveDir);

    // Auto-focus
    setTimeout(() => {
      const { focusR, focusC } = taskResult;
      if (cellRefs.current[focusR] && cellRefs.current[focusR][focusC]) {
        cellRefs.current[focusR][focusC]?.focus();
        setFocusedCell({ r: focusR, c: focusC });
        setSelectionStart({ r: focusR, c: focusC });
        setSelectionEnd({ r: focusR, c: focusC });
        setIsCarryMode(false);
      }
    }, 50);
  }, [taskType, selectedTable, nextStartRow, gridRows, sessionState.difficulty]);

  const getCategoryKey = () => {
    let base: string = taskType;
    if (taskType === '1x1' && selectedTable) {
      base = `1x1-${selectedTable}`;
    }
    return `${base}-${sessionState.difficulty}-${sessionState.gameMode}`;
  };

  // Timer Logic for Time Attack
  useEffect(() => {
    if (sessionState.isActive && sessionState.gameMode === 'time_attack' && sessionState.remainingTime !== undefined) {
      if (sessionState.remainingTime <= 0) {
        // Time's up!
        const category = getCategoryKey();
        const isHigh = updateScore(sessionState.score, category);
        setIsNewHighscore(isHigh);
        setShowSummary(true);
        setSessionState(prev => ({ ...prev, isActive: false }));
        return;
      }

      const timer = setInterval(() => {
        setSessionState(prev => ({
          ...prev,
          remainingTime: (prev.remainingTime || 0) - 1
        }));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionState.isActive, sessionState.gameMode, sessionState.remainingTime, sessionState.score, taskType, selectedTable, sessionState.difficulty]);

  // Check completion
  useEffect(() => {
    if (currentTaskSolutionKeys.length > 0 && sessionState.isActive && !isExamMode) {
      const solutionCorrect = currentTaskSolutionKeys.every(key => {
        const cell = grid[key];
        const expected = solutionMap[key];
        return cell && cell.value === expected;
      });

      let carriesCorrect = true;
      if (currentTaskCarryKeys.length > 0) {
        carriesCorrect = currentTaskCarryKeys.every(key => {
          const cell = grid[key];
          const expected = carryMap[key];
          return isCarryCorrect(cell?.carry, expected);
        });
      }

      if (solutionCorrect) {
        // If solution is correct but carries are missing/wrong, auto-fill them and proceed
        if (!carriesCorrect) {
            const updates: Record<string, CellData> = {};
            currentTaskCarryKeys.forEach(key => {
                const expected = carryMap[key];
                const current = grid[key];
                if (!isCarryCorrect(current?.carry, expected)) {
                    updates[key] = { ...current, value: current?.value || '', carry: expected, isCarryValid: true };
                }
            });
            
            if (Object.keys(updates).length > 0) {
                setGrid(prev => ({ ...prev, ...updates }));
                // Return here to let the effect run again with updated grid (which will now be correct)
                return; 
            }
        }

        setCurrentTaskSolutionKeys([]);
        setCurrentTaskCarryKeys([]);
        
        // Calculate Score
        const timeTaken = (Date.now() - sessionState.taskStartTime) / 1000;
        let multiplier = 1;
        if (taskType === '*') multiplier = 1.5;
        if (taskType === ':') multiplier = 2;
        if (taskType === 'mixed') multiplier = 1.5;
        
        let difficultyMultiplier = 1;
        if (sessionState.difficulty === 'medium') difficultyMultiplier = 2;
        if (sessionState.difficulty === 'hard') difficultyMultiplier = 3;

        const basePoints = 100;
        const timeBonus = Math.max(0, Math.floor((60 - timeTaken) * 2));
        const points = Math.floor((basePoints + timeBonus) * multiplier * difficultyMultiplier);
        
        setSessionState(prev => ({
          ...prev,
          score: prev.score + points
        }));

        // Check if session complete (Classic Mode)
        if (sessionState.gameMode === 'classic' && sessionState.currentTaskIndex >= TASKS_PER_SESSION) {
          // Session Complete
          setTimeout(() => {
            const category = getCategoryKey();
            const isHigh = updateScore(sessionState.score + points, category);
            setIsNewHighscore(isHigh);
            setShowSummary(true);
            setSessionState(prev => ({ ...prev, isActive: false }));
          }, 500);
        } else {
          // Next Task (Classic or Time Attack)
          setTimeout(() => {
            handleGenerateTask(true);
          }, 500);
        }
      }
    }
  }, [grid, currentTaskSolutionKeys, currentTaskCarryKeys, solutionMap, carryMap, handleGenerateTask, taskType, updateScore, sessionState.currentTaskIndex, sessionState.taskStartTime, sessionState.score, selectedTable, sessionState.isActive, sessionState.gameMode, sessionState.difficulty, isExamMode]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [setIsDragging]);

  const handleExamSubmit = useCallback(() => {
    // Calculate score based on all tasks
    let correctCells = 0;
    let totalCells = 0;
    
    // Evaluate grid and update colors for review mode
    const evaluatedGrid = { ...grid };
    
    Object.keys(solutionMap).forEach(key => {
        totalCells++;
        const cell = evaluatedGrid[key] || { value: '', underlined: false };
        const expected = solutionMap[key];
        const isValid = cell.value === expected;
        if (isValid) correctCells++;
        
        evaluatedGrid[key] = { ...cell, isValid };
    });
    
    Object.keys(carryMap).forEach(key => {
        const cell = evaluatedGrid[key] || { value: '', underlined: false };
        const expected = carryMap[key];
        const isCarryValid = isCarryCorrect(cell.carry, expected);
        
        evaluatedGrid[key] = { ...cell, isCarryValid };
    });
    
    setGrid(evaluatedGrid);
    
    const percentage = totalCells > 0 ? correctCells / totalCells : 0;
    
    let difficultyMultiplier = 1;
    if (sessionState.difficulty === 'medium') difficultyMultiplier = 2;
    if (sessionState.difficulty === 'hard') difficultyMultiplier = 3;
    
    const points = Math.floor(percentage * 1000 * difficultyMultiplier);
    
    setSessionState(prev => ({
        ...prev,
        score: points,
        isActive: false,
        examReviewMode: true // Enable review mode
    }));
    
    const category = getCategoryKey();
    const isHigh = updateScore(points, category);
    setIsNewHighscore(isHigh);
    setShowSummary(true);
  }, [grid, solutionMap, carryMap, sessionState.difficulty, updateScore]);

  const handleNextExamTask = useCallback(() => {
      handleGenerateTask(true);
  }, [handleGenerateTask]);

  const handleInsertSymbol = useCallback((symbol: string) => {
    if (focusedCell) {
      updateCell(focusedCell.r, focusedCell.c, { value: symbol });
      cellRefs.current[focusedCell.r][focusedCell.c]?.focus();
    }
  }, [focusedCell, updateCell]);

  if (!isSessionStarted) {
    return <StartScreen onStart={handleStartSession} onBack={onLogout} onOpenLeaderboard={onOpenLeaderboard} />;
  }

  return (
    <div className="flex flex-col h-screen bg-stone-100 font-sans text-stone-900">
      <Toolbar
        activeProfile={activeProfile}
        sessionState={sessionState}
        onNewTask={() => handleGenerateTask(false)}
        onExamSubmit={handleExamSubmit}
        onNextExamTask={handleNextExamTask}
        onClear={() => { if (confirm('Wirklich löschen?')) setGrid({}); }}
        onToggleUnderline={toggleUnderline}
        onToggleCarryMode={() => setIsCarryMode(prev => !prev)}
        isCarryMode={isCarryMode}
        taskType={taskType}
        setTaskType={setTaskType}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        autoMoveDir={autoMoveDir}
        setAutoMoveDir={setAutoMoveDir}
        onInsertSymbol={handleInsertSymbol}
        onLogout={onLogout}
      />
      
      <GridBoard
        grid={grid}
        gridRows={gridRows}
        cols={COLS}
        focusedCell={focusedCell}
        selectionStart={selectionStart}
        selectionEnd={selectionEnd}
        isCarryMode={isCarryMode}
        onCellMouseDown={handleCellMouseDown}
        onCellMouseEnter={handleCellMouseEnter}
        onCellChange={handleCellChange}
        onCellKeyDown={handleCellKeyDown}
        registerCellRef={registerCellRef}
      />

      {showSummary && (
        <SessionSummary
          sessionState={sessionState}
          taskType={taskType}
          onRestart={() => handleGenerateTask(false)}
          onMenu={() => setIsSessionStarted(false)}
          onReview={() => setShowSummary(false)}
          isNewHighscore={isNewHighscore}
        />
      )}
    </div>
  );
}
