import React, { memo } from 'react';
import { Cell } from '../../engine/types';

export type GridCellProps = {
  cell: Cell;
  isActive: boolean;
  highlight: boolean;
  onChange?: (cellId: string, value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, cellId: string) => void;
  onFocus?: (cellId: string) => void;
  style: React.CSSProperties;
};

export const GridCell = memo(({ cell, isActive, highlight, onChange, onKeyDown, onFocus, style }: GridCellProps) => {
  const { role, value, isEditable, id } = cell;

  if (role === 'empty') {
    return <div style={style} className="absolute pointer-events-none" />;
  }

  if (role === 'separator') {
    return (
      <div style={style} className="absolute flex items-end pb-1 pointer-events-none">
        <div className="w-full h-0.5 bg-gray-800" />
      </div>
    );
  }

  const baseClasses = "absolute flex items-center justify-center font-mono transition-colors duration-200 select-none";
  let roleClasses = "";

  switch (role) {
    case 'digit':
      roleClasses = "text-2xl text-gray-800";
      break;
    case 'carry':
      roleClasses = "text-sm text-blue-600 items-start pt-1 font-medium";
      break;
    case 'borrow':
      roleClasses = "text-sm text-red-600 items-start pt-1 font-medium";
      break;
    case 'operator':
      roleClasses = "text-2xl text-gray-600";
      break;
    case 'result':
      roleClasses = "text-2xl font-bold text-gray-900";
      break;
    case 'helper':
      roleClasses = "text-sm text-gray-400";
      break;
    case 'algebra_term':
      roleClasses = "text-xl font-medium text-indigo-700";
      break;
    default:
      break;
  }

  const highlightClasses = highlight ? "bg-red-100 ring-2 ring-red-400 rounded-md z-10" : "";
  const activeClasses = isActive ? "bg-blue-50 ring-2 ring-blue-400 rounded-md z-10" : "";

  if (isEditable) {
    const isAlgebra = role === 'algebra_term';
    return (
      <input
        id={`cell-${id}`}
        type="text"
        inputMode="none" // Prevents native mobile keyboard
        maxLength={1}
        value={value}
        onChange={(e) => {
          const val = e.target.value;
          if (isAlgebra) {
             // Allow alphanumeric and basic math symbols
             if (val === '' || /^[a-zA-Z0-9+\-*()]$/.test(val)) {
                onChange?.(id, val);
             }
          } else {
             // Only allow digits or empty
             if (val === '' || /^[0-9]$/.test(val)) {
               onChange?.(id, val);
             }
          }
        }}
        onKeyDown={(e) => onKeyDown?.(e, id)}
        onFocus={() => onFocus?.(id)}
        style={style}
        className={`${baseClasses} ${roleClasses} ${highlightClasses} ${activeClasses} bg-transparent outline-none text-center caret-transparent cursor-default focus:bg-blue-100 focus:ring-2 focus:ring-blue-500 rounded-md z-20`}
        aria-label={`${role} input`}
        autoComplete="off"
      />
    );
  }

  return (
    <span
      id={`cell-${id}`}
      style={style}
      className={`${baseClasses} ${roleClasses} ${highlightClasses} ${activeClasses}`}
      aria-label={`${role} ${value}`}
    >
      {value}
    </span>
  );
});

GridCell.displayName = 'GridCell';
