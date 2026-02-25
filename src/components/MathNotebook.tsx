import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toolbar } from './Toolbar';
import { GridBoard } from './GridBoard';
import { SessionSummary } from './SessionSummary';
import { StartScreen } from './StartScreen';
import { CellData, TaskType, SessionState, Profile } from '../types';
import { generateMathTask } from '../utils/mathGenerators';

const ROWS = 25;
const COLS = 30;
const TASKS_PER_SESSION = 10;

interface MathNotebookProps {
  activeProfile: Profile;
  updateScore: (points: number, category: string) => void;
  onLogout: () => void;
}

export function MathNotebook({ activeProfile, updateScore, onLogout }: MathNotebookProps) {
  // Session State
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    currentTaskIndex: 0,
    totalTasks: TASKS_PER_SESSION,
    score: 0,
    startTime: 0,
    taskStartTime: 0
  });
  const [showSummary, setShowSummary] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  // Grid State
  const [grid, setGrid] = useState<Record<string, CellData>>({});
  const [gridRows, setGridRows] = useState(ROWS);
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Math Logic State
  const [solutionMap, setSolutionMap] = useState<Record<string, string>>({});
  const [carryMap, setCarryMap] = useState<Record<string, string>>({});
  const [isCarryMode, setIsCarryMode] = useState(false);
  const [autoMoveDir, setAutoMoveDir] = useState<'left' | 'right' | 'down' | 'none'>('right');
  
  // Task Config
  const [taskType, setTaskType] = useState<TaskType>('mixed');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  // Auto-Generation State
  const [nextStartRow, setNextStartRow] = useState(2);
  const [currentTaskSolutionKeys, setCurrentTaskSolutionKeys] = useState<string[]>([]);
  const [currentTaskCarryKeys, setCurrentTaskCarryKeys] = useState<string[]>([]);

  // Refs
  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const registerCellRef = useCallback((r: number, c: number, el: HTMLInputElement | null) => {
    if (!cellRefs.current[r]) {
      cellRefs.current[r] = [];
    }
    cellRefs.current[r][c] = el;
  }, []);

  const handleStartSession = (type: TaskType, table: number | null) => {
    setTaskType(type);
    setSelectedTable(table);
    setIsSessionStarted(true);
    handleGenerateTask(false, type, table);
  };

  const handleGenerateTask = useCallback((append = false, type: TaskType = taskType, table: number | null = selectedTable) => {
    let startR = 2;
    
    if (append) {
      startR = nextStartRow;
      // Increment task index
      setSessionState(prev => ({
        ...prev,
        currentTaskIndex: prev.currentTaskIndex + 1,
        taskStartTime: Date.now()
      }));
    } else {
      // New Session
      setGrid({});
      setSolutionMap({});
      setCarryMap({});
      setNextStartRow(2);
      setGridRows(ROWS);
      setShowSummary(false);
      
      setSessionState({
        isActive: true,
        currentTaskIndex: 1,
        totalTasks: TASKS_PER_SESSION,
        score: 0,
        startTime: Date.now(),
        taskStartTime: Date.now()
      });
    }

    // Ensure grid has enough rows
    if (startR + 15 > gridRows) {
      setGridRows(prev => Math.max(prev, startR + 20));
    }

    const taskResult = generateMathTask(type, startR, table);

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
  }, [taskType, selectedTable, nextStartRow, gridRows]);

  const isCarryCorrect = (input: string | undefined, expected: string | undefined) => {
    if (input === undefined || input === '' || expected === undefined) return false;
    if (input === expected) return true;
    if (input.replace('+', '') === expected.replace('+', '')) return true;
    return false;
  };

  const getCategoryKey = () => {
    if (taskType === '1x1' && selectedTable) {
      return `1x1-${selectedTable}`;
    }
    return taskType;
  };

  // Check completion
  useEffect(() => {
    if (currentTaskSolutionKeys.length > 0) {
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

      if (solutionCorrect && carriesCorrect) {
        setCurrentTaskSolutionKeys([]);
        setCurrentTaskCarryKeys([]);
        
        // Calculate Score
        const timeTaken = (Date.now() - sessionState.taskStartTime) / 1000;
        let multiplier = 1;
        if (taskType === '*') multiplier = 1.5;
        if (taskType === ':') multiplier = 2;
        if (taskType === 'mixed') multiplier = 1.5;
        
        const basePoints = 100;
        const timeBonus = Math.max(0, Math.floor((60 - timeTaken) * 2));
        const points = Math.floor((basePoints + timeBonus) * multiplier);
        
        setSessionState(prev => ({
          ...prev,
          score: prev.score + points
        }));

        // Check if session complete
        if (sessionState.currentTaskIndex >= TASKS_PER_SESSION) {
          // Session Complete
          setTimeout(() => {
            const category = getCategoryKey();
            updateScore(sessionState.score + points, category);
            setShowSummary(true);
            setSessionState(prev => ({ ...prev, isActive: false }));
          }, 500);
        } else {
          // Next Task
          setTimeout(() => {
            handleGenerateTask(true);
          }, 500);
        }
      }
    }
  }, [grid, currentTaskSolutionKeys, currentTaskCarryKeys, solutionMap, carryMap, handleGenerateTask, taskType, updateScore, sessionState.currentTaskIndex, sessionState.taskStartTime, sessionState.score, selectedTable]);

  const updateCell = useCallback((r: number, c: number, updates: Partial<CellData>) => {
    const key = getCellKey(r, c);
    
    setGrid(prev => {
      const current = prev[key] || { value: '', underlined: false };
      
      if (isCarryMode && updates.value !== undefined) {
          return prev;
      }
      
      const newValue = updates.value !== undefined ? updates.value : current.value;
      const newCarry = updates.carry !== undefined ? updates.carry : current.carry;
      
      let isValid = current.isValid;
      if (solutionMap[key] !== undefined && updates.value !== undefined) {
          isValid = newValue === solutionMap[key];
      } else if (solutionMap[key] === undefined && updates.value !== undefined) {
          isValid = null;
      }
      
      let isCarryValid = current.isCarryValid;
      if (updates.carry !== undefined) {
          if (carryMap[key] !== undefined) {
              isCarryValid = isCarryCorrect(newCarry, carryMap[key]);
          } else if (newCarry) {
              isCarryValid = false;
          } else {
              isCarryValid = null;
          }
      }
      
      return {
        ...prev,
        [key]: { ...current, ...updates, isValid, isCarryValid }
      };
    });
  }, [isCarryMode, solutionMap, carryMap]);

  const handleCellChange = useCallback((r: number, c: number, value: string) => {
    if (!isCarryMode) {
      updateCell(r, c, { value });
      
      // Smart Carry Logic
      const key = getCellKey(r, c);
      const expectedCarry = carryMap[key];
      const currentCarry = grid[key]?.carry;
      
      if (expectedCarry && !currentCarry) {
          setIsCarryMode(true);
      } else {
          // Auto-move
          if (value.length === 1) {
              if (autoMoveDir === 'right' && c < COLS - 1) {
                  cellRefs.current[r][c + 1]?.focus();
              } else if (autoMoveDir === 'left' && c > 0) {
                  cellRefs.current[r][c - 1]?.focus();
              } else if (autoMoveDir === 'down' && r < ROWS - 1) {
                  cellRefs.current[r + 1][c]?.focus();
              }
          }
      }
    }
  }, [isCarryMode, updateCell, carryMap, grid, autoMoveDir]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === ' ') {
      e.preventDefault();
      setIsCarryMode(prev => !prev);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (r > 0) {
        const nextR = r - 1;
        cellRefs.current[nextR][c]?.focus();
        setSelectionStart({ r: nextR, c });
        setSelectionEnd({ r: nextR, c });
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (r < gridRows - 1) {
        const nextR = r + 1;
        cellRefs.current[nextR][c]?.focus();
        setSelectionStart({ r: nextR, c });
        setSelectionEnd({ r: nextR, c });
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (c > 0) {
        const nextC = c - 1;
        cellRefs.current[r][nextC]?.focus();
        setSelectionStart({ r, c: nextC });
        setSelectionEnd({ r, c: nextC });
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (c < COLS - 1) {
        const nextC = c + 1;
        cellRefs.current[r][nextC]?.focus();
        setSelectionStart({ r, c: nextC });
        setSelectionEnd({ r, c: nextC });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (r < gridRows - 1) {
        const nextR = r + 1;
        cellRefs.current[nextR][c]?.focus();
        setSelectionStart({ r: nextR, c });
        setSelectionEnd({ r: nextR, c });
      }
    } else if (e.key === 'Backspace') {
      // Handle backspace (bulk delete if selection)
      // For simplicity, just handle single cell or selection here
      // Logic from original MathGrid...
      // Simplified for now:
      if (selectionStart && selectionEnd) {
         const minR = Math.min(selectionStart.r, selectionEnd.r);
         const maxR = Math.max(selectionStart.r, selectionEnd.r);
         const minC = Math.min(selectionStart.c, selectionEnd.c);
         const maxC = Math.max(selectionStart.c, selectionEnd.c);
         
         setGrid(prev => {
             const next = { ...prev };
             for (let row = minR; row <= maxR; row++) {
                 for (let col = minC; col <= maxC; col++) {
                     const key = getCellKey(row, col);
                     if (next[key]) {
                         if (isCarryMode) {
                             const expectedCarry = carryMap[key];
                             let isCarryValid = null;
                             if (expectedCarry !== undefined) isCarryValid = false;
                             next[key] = { ...next[key], carry: undefined, isCarryValid };
                         } else {
                             const expectedVal = solutionMap[key];
                             let isValid = null;
                             if (expectedVal !== undefined) isValid = false;
                             next[key] = { ...next[key], value: '', isValid };
                         }
                     }
                 }
             }
             return next;
         });
      }
    } else if (isCarryMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const key = getCellKey(r, c);
      const current = grid[key] || { value: '', underlined: false };
      const currentCarry = current.carry || '';
      updateCell(r, c, { carry: currentCarry + e.key });
    }
  }, [gridRows, isCarryMode, selectionStart, selectionEnd, carryMap, solutionMap, updateCell, grid]);

  const handleCellMouseDown = useCallback((r: number, c: number) => {
    setIsDragging(true);
    setSelectionStart({ r, c });
    setSelectionEnd({ r, c });
    setFocusedCell({ r, c });
  }, []);

  const handleCellMouseEnter = useCallback((r: number, c: number) => {
    if (isDragging) {
      setSelectionEnd({ r, c });
    }
  }, [isDragging]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const toggleUnderline = useCallback(() => {
    if (selectionStart && selectionEnd) {
      const minR = Math.min(selectionStart.r, selectionEnd.r);
      const maxR = Math.max(selectionStart.r, selectionEnd.r);
      const minC = Math.min(selectionStart.c, selectionEnd.c);
      const maxC = Math.max(selectionStart.c, selectionEnd.c);

      let anyNotUnderlined = false;
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const key = getCellKey(r, c);
          if (!grid[key]?.underlined) {
            anyNotUnderlined = true;
            break;
          }
        }
        if (anyNotUnderlined) break;
      }

      setGrid(prev => {
        const next = { ...prev };
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = getCellKey(r, c);
            next[key] = { ...(next[key] || { value: '', underlined: false }), underlined: anyNotUnderlined };
          }
        }
        return next;
      });
    }
  }, [selectionStart, selectionEnd, grid]);

  const handleInsertSymbol = useCallback((symbol: string) => {
    if (focusedCell) {
      updateCell(focusedCell.r, focusedCell.c, { value: symbol });
      cellRefs.current[focusedCell.r][focusedCell.c]?.focus();
    }
  }, [focusedCell, updateCell]);

  if (!isSessionStarted) {
    return <StartScreen onStart={handleStartSession} onBack={onLogout} />;
  }

  return (
    <div className="flex flex-col h-screen bg-stone-100 font-sans text-stone-900">
      <Toolbar
        activeProfile={activeProfile}
        sessionState={sessionState}
        onNewTask={() => handleGenerateTask(false)}
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
        />
      )}
    </div>
  );
}
