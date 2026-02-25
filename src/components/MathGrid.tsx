import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Eraser, Underline, Trash2, Download } from 'lucide-react';

interface CellData {
  value: string;
  underlined: boolean;
}

// Grid dimensions
const ROWS = 25;
const COLS = 30;

export function MathGrid() {
  // Initialize grid state
  const [grid, setGrid] = useState<Record<string, CellData>>({});
  const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for cell inputs to manage focus
  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Initialize refs array synchronously to ensure they exist during render
  if (cellRefs.current.length !== ROWS) {
    cellRefs.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  }

  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const updateCell = (r: number, c: number, updates: Partial<CellData>) => {
    const key = getCellKey(r, c);
    setGrid(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { value: '', underlined: false }), ...updates }
    }));
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
                 next[key] = { ...next[key], value: '' };
              }
            }
          }
          return next;
        });
      }
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
                  <input
                    ref={el => {
                      if (cellRefs.current[r]) {
                        cellRefs.current[r][c] = el;
                      }
                    }}
                    type="text"
                    className={cn(
                      "w-full h-full text-center outline-none transition-colors font-mono text-lg leading-none bg-transparent p-0 m-0 cursor-default select-none",
                      // Only show cursor/caret if it's the focused cell AND we are not dragging a selection
                      // But we need input to work. 
                      // Actually, for multi-select, we might want to disable pointer events on input while dragging?
                      // Or just let the div handle mouse events.
                      // To let div handle mouse events, we can make input pointer-events-none when not focused?
                      // Or just rely on bubbling? Input stops propagation of some events.
                      // Let's try pointer-events-none on input unless it is the single focused cell?
                      // No, that makes it hard to click to focus.
                      // Let's just put mouse handlers on the parent div and maybe make input transparent to clicks?
                      // No, input needs to receive focus.
                    )}
                    style={{
                      caretColor: selected && !isDragging && focusedCell?.r === r && focusedCell?.c === c ? 'auto' : 'transparent'
                    }}
                    value={cellData.value}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCell(r, c, { value: val });
                      if (val.length === 1 && c < COLS - 1) {
                        cellRefs.current[r][c + 1]?.focus();
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
