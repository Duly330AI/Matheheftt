import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Eraser, Underline, Trash2, Download, RefreshCw, CheckCircle, Superscript, ArrowLeft, ArrowRight, ArrowDown, Ban, Settings, ChevronDown } from 'lucide-react';

interface CellData {
  value: string;
  underlined: boolean;
  carry?: string;
  isValid?: boolean | null;
}

// Grid dimensions
const ROWS = 25;
const COLS = 30;

type TaskType = 'mixed' | '+' | '-' | '*' | ':' | '1x1';

export function MathGrid() {
  // Initialize grid state
  const [grid, setGrid] = useState<Record<string, CellData>>({});
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [solutionMap, setSolutionMap] = useState<Record<string, string>>({});
  const [carryMap, setCarryMap] = useState<Record<string, string>>({});
  const [isCarryMode, setIsCarryMode] = useState(false);
  const [autoMoveDir, setAutoMoveDir] = useState<'left' | 'right' | 'down' | 'none'>('right');
  
  // Task Configuration State
  const [taskType, setTaskType] = useState<TaskType>('mixed');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  
  // Refs for cell inputs to manage focus
  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Initialize refs array synchronously to ensure they exist during render
  if (cellRefs.current.length !== ROWS) {
    cellRefs.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  }

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const generateTask = () => {
    // Clear grid and solution
    setGrid({});
    setSolutionMap({});
    setCarryMap({});
    
    let op = '';
    
    if (taskType === 'mixed') {
        const operations = ['+', '-', '*', ':'];
        op = operations[Math.floor(Math.random() * operations.length)];
    } else if (taskType === '1x1') {
        op = '*';
    } else {
        op = taskType;
    }
    
    const startR = 2;
    const startC = 2;
    
    let newGrid: Record<string, CellData> = {};
    let newSolution: Record<string, string> = {};
    let newCarry: Record<string, string> = {};
    
    if (op === '+' || op === '-') {
      // Vertical Addition/Subtraction
      setAutoMoveDir('left'); // Set direction to left for vertical ops
      
      const a = Math.floor(Math.random() * 899) + 100; // 3 digits
      const b = Math.floor(Math.random() * 899) + 100; // 3 digits
      
      // Ensure result is positive for subtraction
      const [num1, num2] = op === '-' && b > a ? [b, a] : [a, b];
      const result = op === '+' ? num1 + num2 : num1 - num2;
      
      const str1 = num1.toString();
      const str2 = num2.toString();
      const strRes = result.toString();
      
      // Alignment
      const alignCol = startC + 4;
      
      // Place num1
      for (let i = 0; i < str1.length; i++) {
        newGrid[getCellKey(startR, alignCol - str1.length + 1 + i)] = { value: str1[i], underlined: false };
      }
      
      // Place op
      newGrid[getCellKey(startR + 1, startC)] = { value: op, underlined: false };
      
      // Place num2
      for (let i = 0; i < str2.length; i++) {
        newGrid[getCellKey(startR + 1, alignCol - str2.length + 1 + i)] = { value: str2[i], underlined: true };
      }
      
      // Underline empty space
      for(let c = startC; c <= alignCol; c++) {
          const key = getCellKey(startR + 1, c);
          if (!newGrid[key]) {
              newGrid[key] = { value: '', underlined: true };
          } else {
              newGrid[key].underlined = true;
          }
      }

      // Expected Result & Carries
      // We need to simulate column by column from right to left to find carries
      let currentCarry = 0;
      const maxLen = Math.max(str1.length, str2.length);
      
      for (let i = 0; i < maxLen + 1; i++) { // +1 for potential final carry
          // Digits at position (from right)
          // str1 index: str1.length - 1 - i
          const d1 = i < str1.length ? parseInt(str1[str1.length - 1 - i]) : 0;
          const d2 = i < str2.length ? parseInt(str2[str2.length - 1 - i]) : 0;
          
          let colRes = 0;
          let nextCarry = 0;
          
          if (op === '+') {
              const sum = d1 + d2 + currentCarry;
              colRes = sum % 10;
              nextCarry = Math.floor(sum / 10);
          } else {
              // Subtraction: d1 - d2 - currentCarry
              // If d1 < d2 + currentCarry, we borrow (carry)
              let val = d1 - d2 - currentCarry;
              if (val < 0) {
                  val += 10;
                  nextCarry = 1;
              } else {
                  nextCarry = 0;
              }
              colRes = val;
          }
          
          // Position in grid
          // alignCol is the rightmost column
          const col = alignCol - i;
          const row = startR + 2;
          
          // Store result if it's part of the number (don't print leading zero unless it's the only digit)
          if (i < strRes.length) {
             newSolution[getCellKey(row, col)] = colRes.toString();
             
             // If there is a carry for the NEXT column (nextCarry > 0), 
             // where do we display it?
             // User wants it "at this place" (where we type the result?).
             // Or does "at this place" mean the column where the carry is generated?
             // Usually carry is noted in the column it affects (the next one to the left).
             // But the user said "if I enter a number and a carry is necessary *at this place*".
             // This implies checking if the current column *generated* a carry?
             // Or if the current column *needs* a carry input?
             // Let's assume we store the carry that needs to be entered in this column.
             // In addition, the carry entered in col `i` is the one generated from col `i-1` (right).
             // Wait, no.
             // 5 + 7. Col 0. Sum 12. Write 2. Carry 1 goes to Col -1.
             // So when I am at Col 0, I write 2. I don't write carry here.
             // I write carry at Col -1.
             // So at Col -1, I write the result (from next step) AND the carry (from this step).
             
             // So, `newCarry` at `col` should be the carry coming FROM the right (`currentCarry`).
             if (currentCarry > 0) {
                 newCarry[getCellKey(row, col)] = currentCarry.toString();
             }
          }
          
          currentCarry = nextCarry;
      }
      
    } else {
      // Horizontal Multiplication/Division
      setAutoMoveDir('right'); // Set direction to right
      
      let num1, num2, result;
      
      if (op === '*') {
        if (taskType === '1x1' && selectedTable) {
            // 1x1 Mode
            const factor = Math.floor(Math.random() * 10) + 1; // 1-10
            // Randomize order: 7*5 or 5*7
            if (Math.random() > 0.5) {
                num1 = selectedTable;
                num2 = factor;
            } else {
                num1 = factor;
                num2 = selectedTable;
            }
            result = num1 * num2;
        } else {
            // Standard Multiplication
            const a = Math.floor(Math.random() * 10) + 2;
            const b = Math.floor(Math.random() * 10) + 2;
            num1 = a;
            num2 = b;
            result = a * b;
        }
        
        const taskStr = `${num1}${op}${num2}=`;
        taskStr.split('').forEach((char, i) => {
          newGrid[getCellKey(startR, startC + i)] = { value: char, underlined: false };
        });
        
        const resStr = result.toString();
        const resStartC = startC + taskStr.length;
        
        for (let i = 0; i < resStr.length; i++) {
          newSolution[getCellKey(startR, resStartC + i)] = resStr[i];
        }
      } else { // Division
        // Generate division task with clean integer result
        // Example: 125 : 5 = 25
        result = Math.floor(Math.random() * 20) + 2; // Quotient
        num2 = Math.floor(Math.random() * 11) + 2; 
        num1 = result * num2; // Dividend
        
        const dividendStr = num1.toString();
        const divisorStr = num2.toString();
        const quotientStr = result.toString();
        
        // Write Task Row: "125:5="
        // No spaces
        let currentC = startC;
        for(let i=0; i<dividendStr.length; i++) newGrid[getCellKey(startR, currentC++)] = { value: dividendStr[i], underlined: false };
        newGrid[getCellKey(startR, currentC++)] = { value: ':', underlined: false };
        for(let i=0; i<divisorStr.length; i++) newGrid[getCellKey(startR, currentC++)] = { value: divisorStr[i], underlined: false };
        newGrid[getCellKey(startR, currentC++)] = { value: '=', underlined: false };
        
        for(let i=0; i<quotientStr.length; i++) newSolution[getCellKey(startR, currentC + i)] = quotientStr[i];

        // Generate Intermediate Steps (Long Division)
        // We need to simulate the process
        let remainderVal = 0;
        let hasStarted = false;
        let currentRow = startR + 1;
        
        for (let i = 0; i < dividendStr.length; i++) {
            const digit = parseInt(dividendStr[i]);
            remainderVal = remainderVal * 10 + digit;
            
            if (!hasStarted) {
                if (remainderVal >= num2) hasStarted = true;
                else continue; 
            }
            
            const qDigit = Math.floor(remainderVal / num2);
            const product = qDigit * num2;
            const newRemainder = remainderVal - product;
            
            if (i > 0 && currentRow > startR + 1) {
                 const valStr = remainderVal.toString();
                 for(let k=0; k<valStr.length; k++) {
                     newSolution[getCellKey(currentRow-1, startC + i - (valStr.length-1) + k)] = valStr[k];
                 }
            }
            
            const productStr = product.toString();
            for(let k=0; k<productStr.length; k++) {
                 newSolution[getCellKey(currentRow, startC + i - (productStr.length-1) + k)] = productStr[k];
            }
            currentRow++;
            
            remainderVal = newRemainder;
            
            if (i === dividendStr.length - 1) {
                const finalStr = remainderVal.toString();
                for(let k=0; k<finalStr.length; k++) {
                     newSolution[getCellKey(currentRow, startC + i - (finalStr.length-1) + k)] = finalStr[k];
                }
            } else {
                currentRow++; 
            }
        }
      }
    }
    
    setGrid(newGrid);
    setSolutionMap(newSolution);
    setCarryMap(newCarry);
  };

  const updateCell = (r: number, c: number, updates: Partial<CellData>) => {
    const key = getCellKey(r, c);
    
    setGrid(prev => {
      const current = prev[key] || { value: '', underlined: false };
      
      if (isCarryMode) {
         if (updates.value !== undefined) {
             // If backspace (empty string), clear carry
             // If typing, append to carry or replace? 
             // The user wants to type "-1".
             // If we just use the input value, it's length 1.
             // We need to capture the key press for carry mode instead of using onChange for the input?
             // Or we can use a prompt? No, that's bad UX.
             // Let's use a custom input handling for carry mode.
             // Actually, the input maxLength is 1. We need to bypass that for carry mode?
             // But the input is for the main value.
             // The carry is displayed separately.
             // If isCarryMode is true, we should probably trap the keydown and update carry manually, 
             // and prevent default input behavior for the main value.
             return prev;
         }
      }
      
      // Normal update
      const newValue = updates.value !== undefined ? updates.value : current.value;
      
      // Validation
      let isValid = current.isValid;
      if (solutionMap[key] !== undefined && updates.value !== undefined) {
          isValid = newValue === solutionMap[key];
      } else if (solutionMap[key] === undefined) {
          isValid = null; // Reset if not part of solution
      }
      
      return {
        ...prev,
        [key]: { ...current, ...updates, isValid }
      };
    });
  };

  const handleMouseDown = (r: number, c: number) => {
    setIsDragging(true);
    setSelectionStart({ r, c });
    setSelectionEnd({ r, c });
    setFocusedCell({ r, c });
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isDragging) {
      setSelectionEnd({ r, c });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse up listener to stop dragging if mouse leaves grid
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const isSelected = (r: number, c: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const minR = Math.min(selectionStart.r, selectionEnd.r);
    const maxR = Math.max(selectionStart.r, selectionEnd.r);
    const minC = Math.min(selectionStart.c, selectionEnd.c);
    const maxC = Math.max(selectionStart.c, selectionEnd.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    // Toggle Carry Mode with Space
    if (e.key === ' ') {
      e.preventDefault();
      setIsCarryMode(!isCarryMode);
      return;
    }

    // Navigation
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
      if (r < ROWS - 1) {
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
      if (r < ROWS - 1) {
        const nextR = r + 1;
        cellRefs.current[nextR][c]?.focus();
        setSelectionStart({ r: nextR, c });
        setSelectionEnd({ r: nextR, c });
      }
    } else if (e.key === 'Backspace') {
      if (selectionStart && selectionEnd) {
        const minR = Math.min(selectionStart.r, selectionEnd.r);
        const maxR = Math.max(selectionStart.r, selectionEnd.r);
        const minC = Math.min(selectionStart.c, selectionEnd.c);
        const maxC = Math.max(selectionStart.c, selectionEnd.c);

        setGrid(prev => {
          const next = { ...prev };
          for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
              const key = getCellKey(r, c);
              if (next[key]) {
                 if (isCarryMode) {
                     next[key] = { ...next[key], carry: undefined };
                 } else {
                     next[key] = { ...next[key], value: '' };
                 }
              }
            }
          }
          return next;
        });
      }
    } else if (isCarryMode && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Handle carry input directly
        e.preventDefault();
        const key = getCellKey(r, c);
        setGrid(prev => {
            const current = prev[key] || { value: '', underlined: false };
            const currentCarry = current.carry || '';
            // Append char
            return {
                ...prev,
                [key]: { ...current, carry: currentCarry + e.key }
            };
        });
    }
  };

  const toggleUnderline = () => {
    if (selectionStart && selectionEnd) {
      const minR = Math.min(selectionStart.r, selectionEnd.r);
      const maxR = Math.max(selectionStart.r, selectionEnd.r);
      const minC = Math.min(selectionStart.c, selectionEnd.c);
      const maxC = Math.max(selectionStart.c, selectionEnd.c);

      // Check if any cell in selection is NOT underlined to decide toggle direction
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

      const newUnderlinedState = anyNotUnderlined;

      setGrid(prev => {
        const next = { ...prev };
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const key = getCellKey(r, c);
            next[key] = { ...(next[key] || { value: '', underlined: false }), underlined: newUnderlinedState };
          }
        }
        return next;
      });
    } else if (focusedCell) {
      // Fallback for single focused cell if selection state is somehow missing
      const { r, c } = focusedCell;
      const key = getCellKey(r, c);
      const current = grid[key] || { value: '', underlined: false };
      updateCell(r, c, { underlined: !current.underlined });
    }
  };

  const clearGrid = () => {
    if (confirm('Möchten Sie wirklich alles löschen?')) {
      setGrid({});
    }
  };

  return (
    <div className="flex flex-col h-screen bg-stone-100 font-sans text-stone-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-stone-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-stone-700 mr-4">Matheheft</h1>
          
          <button
            onClick={toggleUnderline}
            className={cn(
              "p-2 rounded hover:bg-stone-100 transition-colors",
              focusedCell && grid[getCellKey(focusedCell.r, focusedCell.c)]?.underlined ? "bg-blue-50 text-blue-600" : "text-stone-600"
            )}
            title="Unterstreichen (oder Strg+U)"
          >
            <Underline size={20} />
          </button>
          
          <div className="w-px h-6 bg-stone-200 mx-2" />

          {['+', '-', '·', ':', '='].map((symbol) => (
            <button
              key={symbol}
              onClick={() => {
                if (focusedCell) {
                  updateCell(focusedCell.r, focusedCell.c, { value: symbol });
                  // Move focus to next cell automatically? Maybe not.
                  cellRefs.current[focusedCell.r][focusedCell.c]?.focus();
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-100 text-stone-700 font-mono text-lg"
              title={`Insert ${symbol}`}
            >
              {symbol}
            </button>
          ))}

          <div className="w-px h-6 bg-stone-200 mx-2" />

          <div className="relative">
              <div className="flex items-center bg-stone-100 rounded p-0.5">
                  <button
                    onClick={generateTask}
                    className="p-1.5 rounded hover:bg-white hover:shadow text-stone-600 transition-colors"
                    title="Neue Aufgabe generieren"
                  >
                    <RefreshCw size={20} />
                  </button>
                  <button
                    onClick={() => setShowTaskMenu(!showTaskMenu)}
                    className="p-1.5 rounded hover:bg-white hover:shadow text-stone-600 transition-colors"
                    title="Aufgaben-Einstellungen"
                  >
                    <ChevronDown size={16} />
                  </button>
              </div>

              {showTaskMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-stone-200 p-4 z-50">
                      <h3 className="text-sm font-semibold text-stone-700 mb-3">Aufgaben-Typ</h3>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                          <button 
                              onClick={() => { setTaskType('mixed'); setShowTaskMenu(false); }}
                              className={cn("px-2 py-1 text-sm rounded border", taskType === 'mixed' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 hover:bg-stone-50")}
                          >
                              Mix
                          </button>
                          <button 
                              onClick={() => { setTaskType('+'); setShowTaskMenu(false); }}
                              className={cn("px-2 py-1 text-sm rounded border", taskType === '+' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 hover:bg-stone-50")}
                          >
                              +
                          </button>
                          <button 
                              onClick={() => { setTaskType('-'); setShowTaskMenu(false); }}
                              className={cn("px-2 py-1 text-sm rounded border", taskType === '-' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 hover:bg-stone-50")}
                          >
                              -
                          </button>
                          <button 
                              onClick={() => { setTaskType('*'); setShowTaskMenu(false); }}
                              className={cn("px-2 py-1 text-sm rounded border", taskType === '*' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 hover:bg-stone-50")}
                          >
                              ·
                          </button>
                          <button 
                              onClick={() => { setTaskType(':'); setShowTaskMenu(false); }}
                              className={cn("px-2 py-1 text-sm rounded border", taskType === ':' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 hover:bg-stone-50")}
                          >
                              :
                          </button>
                      </div>

                      <div className="border-t border-stone-100 pt-3">
                          <h3 className="text-sm font-semibold text-stone-700 mb-2">Kleines 1x1</h3>
                          <div className="grid grid-cols-5 gap-1">
                              {Array.from({ length: 10 }).map((_, i) => {
                                  const num = i + 1;
                                  const isSelected = taskType === '1x1' && selectedTable === num;
                                  return (
                                      <button
                                          key={num}
                                          onClick={() => {
                                              setTaskType('1x1');
                                              setSelectedTable(num);
                                              setShowTaskMenu(false);
                                          }}
                                          className={cn(
                                              "h-8 text-xs rounded border flex items-center justify-center",
                                              isSelected ? "bg-blue-50 border-blue-200 text-blue-700 font-medium" : "border-stone-200 hover:bg-stone-50"
                                          )}
                                      >
                                          {num}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
              )}
          </div>

          <button
            onClick={() => setIsCarryMode(!isCarryMode)}
            className={cn(
              "p-2 rounded transition-colors",
              isCarryMode ? "bg-amber-100 text-amber-700" : "hover:bg-stone-100 text-stone-600"
            )}
            title="Merkzahl-Modus (Übertrag) [Leertaste]"
          >
            <Superscript size={20} />
          </button>

          <div className="w-px h-6 bg-stone-200 mx-2" />

          <div className="flex items-center bg-stone-100 rounded p-0.5">
              <button
                onClick={() => setAutoMoveDir('left')}
                className={cn("p-1.5 rounded", autoMoveDir === 'left' ? "bg-white shadow text-blue-600" : "text-stone-500 hover:text-stone-700")}
                title="Auto-Move Left"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => setAutoMoveDir('right')}
                className={cn("p-1.5 rounded", autoMoveDir === 'right' ? "bg-white shadow text-blue-600" : "text-stone-500 hover:text-stone-700")}
                title="Auto-Move Right"
              >
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setAutoMoveDir('down')}
                className={cn("p-1.5 rounded", autoMoveDir === 'down' ? "bg-white shadow text-blue-600" : "text-stone-500 hover:text-stone-700")}
                title="Auto-Move Down"
              >
                <ArrowDown size={16} />
              </button>
              <button
                onClick={() => setAutoMoveDir('none')}
                className={cn("p-1.5 rounded", autoMoveDir === 'none' ? "bg-white shadow text-blue-600" : "text-stone-500 hover:text-stone-700")}
                title="Auto-Move Off"
              >
                <Ban size={16} />
              </button>
          </div>

          <div className="w-px h-6 bg-stone-200 mx-2" />

          <button
            onClick={clearGrid}
            className="p-2 rounded hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors"
            title="Alles löschen"
          >
            <Trash2 size={20} />
          </button>
        </div>
        
        <div className="text-sm text-stone-500">
          Klicken zum Schreiben • Pfeiltasten zum Bewegen
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-stone-100">
        <div 
          className="bg-white shadow-lg border-t border-l border-blue-200 relative"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 32px)`,
            gridTemplateRows: `repeat(${ROWS}, 32px)`,
            width: 'fit-content'
          }}
        >
          {Array.from({ length: ROWS }).map((_, r) => (
            Array.from({ length: COLS }).map((_, c) => {
              const key = getCellKey(r, c);
              const cellData = grid[key] || { value: '', underlined: false };
              
              const isUnderlined = cellData.underlined;
              const selected = isSelected(r, c);
              const isValid = cellData.isValid;
              
              return (
                <div 
                  key={key} 
                  className={cn(
                    "relative w-full h-full border-r border-blue-200",
                    isUnderlined ? "border-b-2 border-b-stone-900" : "border-b border-b-blue-200",
                    selected && "bg-blue-100/50"
                  )}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                >
                  {cellData.carry && (
                    <span className="absolute top-0 left-0.5 text-[10px] leading-none text-stone-500 font-mono pointer-events-none">
                      {cellData.carry}
                    </span>
                  )}
                  <input
                    ref={el => {
                      if (cellRefs.current[r]) {
                        cellRefs.current[r][c] = el;
                      }
                    }}
                    type="text"
                    className={cn(
                      "w-full h-full text-center outline-none transition-colors font-mono text-lg leading-none bg-transparent p-0 m-0 cursor-default select-none",
                      isValid === false && "text-red-500",
                      isValid === true && "text-green-600"
                    )}
                    style={{
                      caretColor: selected && !isDragging && focusedCell?.r === r && focusedCell?.c === c ? 'auto' : 'transparent'
                    }}
                    value={cellData.value}
                    onChange={(e) => {
                      if (!isCarryMode) {
                          const val = e.target.value;
                          updateCell(r, c, { value: val });
                          
                          // Smart Carry Logic
                          const key = getCellKey(r, c);
                          const expectedCarry = carryMap[key];
                          const currentCarry = grid[key]?.carry;
                          
                          // If a carry is expected and NOT yet entered, switch to carry mode and stay here
                          if (expectedCarry && !currentCarry) {
                              setIsCarryMode(true);
                              // Do not auto-move
                          } else {
                              // Auto-move logic
                              if (val.length === 1) {
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
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                        e.preventDefault();
                        toggleUnderline();
                      } else {
                        handleKeyDown(e, r, c);
                      }
                    }}
                    onFocus={(e) => {
                        if (!isDragging) {
                            setFocusedCell({ r, c });
                            setSelectionStart({ r, c });
                            setSelectionEnd({ r, c });
                            setIsCarryMode(false); // Reset carry mode on new cell focus
                            e.target.select();
                        }
                    }}
                    maxLength={1}
                  />
                </div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}
