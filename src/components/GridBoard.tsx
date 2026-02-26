import React, { useCallback } from 'react';
import { GridCell } from './GridCell';
import { CellData } from '../types';

interface GridBoardProps {
  grid: Record<string, CellData>;
  gridRows: number;
  cols: number;
  focusedCell: { r: number; c: number } | null;
  selectionStart: { r: number; c: number } | null;
  selectionEnd: { r: number; c: number } | null;
  isCarryMode: boolean;
  onCellMouseDown: (r: number, c: number) => void;
  onCellMouseEnter: (r: number, c: number) => void;
  onCellChange: (r: number, c: number, value: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => void;
  registerCellRef: (r: number, c: number, el: HTMLInputElement | null) => void;
}

export const GridBoard: React.FC<GridBoardProps> = ({
  grid,
  gridRows,
  cols,
  focusedCell,
  selectionStart,
  selectionEnd,
  isCarryMode,
  onCellMouseDown,
  onCellMouseEnter,
  onCellChange,
  onCellKeyDown,
  registerCellRef
}) => {
  const getCellKey = (r: number, c: number) => `${r},${c}`;

  const isSelected = useCallback((r: number, c: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const minR = Math.min(selectionStart.r, selectionEnd.r);
    const maxR = Math.max(selectionStart.r, selectionEnd.r);
    const minC = Math.min(selectionStart.c, selectionEnd.c);
    const maxC = Math.max(selectionStart.c, selectionEnd.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  }, [selectionStart, selectionEnd]);

  // We can't easily memoize the whole grid render because it depends on selection which changes often.
  // But GridCell is memoized, so only affected cells will re-render.

  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="flex-1 overflow-auto p-8 flex justify-center bg-stone-100 relative">
      <div className="absolute top-4 right-8 text-stone-500 font-mono text-sm pointer-events-none">
        {today}
      </div>
      <div
        className="bg-white shadow-lg border-t border-l border-blue-200 relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 32px)`,
          gridTemplateRows: `repeat(${gridRows}, 32px)`,
          width: 'fit-content',
          height: `${gridRows * 32}px`,
          minHeight: '100%'
        }}
      >
        {Array.from({ length: gridRows }).map((_, r) => (
          Array.from({ length: cols }).map((_, c) => {
            const key = getCellKey(r, c);
            const cellData = grid[key] || { value: '', underlined: false };
            const selected = isSelected(r, c);
            const focused = focusedCell?.r === r && focusedCell?.c === c;

            return (
              <GridCell
                key={key}
                r={r}
                c={c}
                cellData={cellData}
                isSelected={selected}
                isFocused={focused}
                isCarryMode={isCarryMode}
                onMouseDown={onCellMouseDown}
                onMouseEnter={onCellMouseEnter}
                onChange={onCellChange}
                onKeyDown={onCellKeyDown}
                setRef={(el: HTMLInputElement | null) => registerCellRef(r, c, el)}
              />
            );
          })
        ))}
      </div>
    </div>
  );
};
