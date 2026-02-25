import React, { memo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CellData } from '../types';

interface GridCellProps {
  r: number;
  c: number;
  cellData: CellData;
  isSelected: boolean;
  isFocused: boolean;
  isCarryMode: boolean;
  onMouseDown: (r: number, c: number) => void;
  onMouseEnter: (r: number, c: number) => void;
  onChange: (r: number, c: number, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => void;
  setRef: (el: HTMLInputElement | null) => void;
}

const GridCellComponent = ({
  r,
  c,
  cellData,
  isSelected,
  isFocused,
  isCarryMode,
  onMouseDown,
  onMouseEnter,
  onChange,
  onKeyDown,
  setRef
}: GridCellProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div
      className={cn(
        "relative w-full h-full border-r border-blue-200",
        cellData.underlined ? "border-b-2 border-b-stone-900" : "border-b border-b-blue-200",
        isSelected && "bg-blue-100/50"
      )}
      onMouseDown={() => onMouseDown(r, c)}
      onMouseEnter={() => onMouseEnter(r, c)}
    >
      {cellData.carry && (
        <span className={cn(
          "absolute top-0 left-0.5 text-[10px] leading-none font-mono pointer-events-none",
          cellData.isCarryValid === true && "text-green-600",
          cellData.isCarryValid === false && "text-red-500",
          (cellData.isCarryValid === null || cellData.isCarryValid === undefined) && "text-stone-500"
        )}>
          {cellData.carry}
        </span>
      )}
      <input
        ref={(el) => {
          inputRef.current = el;
          setRef(el);
        }}
        type="text"
        aria-label={`Zeile ${r + 1}, Spalte ${c + 1}`}
        className={cn(
          "w-full h-full text-center outline-none transition-colors font-mono text-lg leading-none bg-transparent p-0 m-0 cursor-default select-none",
          cellData.isValid === false && "text-red-500",
          cellData.isValid === true && "text-green-600"
        )}
        style={{
          caretColor: isFocused ? 'auto' : 'transparent'
        }}
        value={cellData.value}
        onChange={(e) => onChange(r, c, e.target.value)}
        onKeyDown={(e) => onKeyDown(e, r, c)}
        readOnly={isCarryMode} // Prevent typing in main input when in carry mode? No, we handle it in onChange/onKeyDown
      />
    </div>
  );
};

export const GridCell = memo(GridCellComponent, (prev, next) => {
  return (
    prev.cellData === next.cellData && // Shallow comparison of object reference might not be enough if object is mutated. But we use immutable updates.
    prev.isSelected === next.isSelected &&
    prev.isFocused === next.isFocused &&
    prev.isCarryMode === next.isCarryMode &&
    prev.cellData.value === next.cellData.value &&
    prev.cellData.underlined === next.cellData.underlined &&
    prev.cellData.carry === next.cellData.carry &&
    prev.cellData.isValid === next.cellData.isValid &&
    prev.cellData.isCarryValid === next.cellData.isCarryValid
  );
});
