import React, { useState, useCallback, useRef } from 'react';
import { CellData } from '../types';

export function useGridState(
  initialRows: number,
  cols: number,
  solutionMap: Record<string, string>,
  carryMap: Record<string, string>,
  isExamMode: boolean,
  autoMoveDir: 'left' | 'right' | 'down' | 'none'
) {
  const [grid, setGrid] = useState<Record<string, CellData>>({});
  const [gridRows, setGridRows] = useState(initialRows);
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isCarryMode, setIsCarryMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const registerCellRef = useCallback((r: number, c: number, el: HTMLInputElement | null) => {
    if (!cellRefs.current[r]) {
      cellRefs.current[r] = [];
    }
    cellRefs.current[r][c] = el;
  }, []);

  const isCarryCorrect = (input: string | undefined, expected: string | undefined) => {
    if (input === undefined || input === '' || expected === undefined) return false;
    if (input === expected) return true;
    const cleanInput = input.replace(/[+-]/g, '');
    const cleanExpected = expected.replace(/[+-]/g, '');
    return cleanInput === cleanExpected;
  };

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
          isValid = isExamMode ? null : newValue === solutionMap[key];
      } else if (solutionMap[key] === undefined && updates.value !== undefined) {
          isValid = null;
      }
      
      let isCarryValid = current.isCarryValid;
      if (updates.carry !== undefined) {
          if (carryMap[key] !== undefined) {
              isCarryValid = isExamMode ? null : isCarryCorrect(newCarry, carryMap[key]);
          } else if (newCarry) {
              isCarryValid = isExamMode ? null : false;
          } else {
              isCarryValid = null;
          }
      }
      
      return {
        ...prev,
        [key]: { ...current, ...updates, isValid, isCarryValid }
      };
    });
  }, [isCarryMode, solutionMap, carryMap, isExamMode]);

  const handleCellChange = useCallback((r: number, c: number, value: string) => {
    if (!isCarryMode) {
      updateCell(r, c, { value });
      
      const key = getCellKey(r, c);
      const expectedCarry = carryMap[key];
      const currentCarry = grid[key]?.carry;
      
      if (expectedCarry && !currentCarry) {
          setIsCarryMode(true);
      } else {
          if (value.length === 1) {
              if (autoMoveDir === 'right' && c < cols - 1) {
                  cellRefs.current[r][c + 1]?.focus();
              } else if (autoMoveDir === 'left' && c > 0) {
                  cellRefs.current[r][c - 1]?.focus();
              } else if (autoMoveDir === 'down' && r < gridRows - 1) {
                  cellRefs.current[r + 1][c]?.focus();
              }
          }
      }
    }
  }, [isCarryMode, updateCell, carryMap, grid, autoMoveDir, cols, gridRows]);

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
      if (c < cols - 1) {
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
      if (selectionStart && selectionEnd && (selectionStart.r !== selectionEnd.r || selectionStart.c !== selectionEnd.c)) {
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
      } else {
        const key = getCellKey(r, c);
        const current = grid[key];
        const hasContent = isCarryMode ? !!current?.carry : !!current?.value;
        
        if (hasContent) {
            updateCell(r, c, isCarryMode ? { carry: undefined } : { value: '' });
        } else {
            if (autoMoveDir === 'right' && c > 0) {
                cellRefs.current[r][c - 1]?.focus();
            } else if (autoMoveDir === 'left' && c < cols - 1) {
                cellRefs.current[r][c + 1]?.focus();
            } else if (autoMoveDir === 'down' && r > 0) {
                cellRefs.current[r - 1][c]?.focus();
            }
        }
      }
    } else if (isCarryMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const key = getCellKey(r, c);
      const current = grid[key] || { value: '', underlined: false };
      const currentCarry = current.carry || '';
      updateCell(r, c, { carry: currentCarry + e.key });
    }
  }, [gridRows, cols, isCarryMode, selectionStart, selectionEnd, carryMap, solutionMap, updateCell, grid, autoMoveDir]);

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

  return {
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
    isDragging,
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
  };
}
