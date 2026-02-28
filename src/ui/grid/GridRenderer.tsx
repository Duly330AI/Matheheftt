import React, { useMemo, useEffect, useRef } from 'react';
import { GridMatrix, Step } from '../../engine/types';
import { GridCell } from './GridCell';
import { AnimationInstruction } from '../../flow/types';
import { motion } from 'motion/react';

export type GridRendererProps = {
  grid: GridMatrix;
  activeStep?: Step;
  onCellChange?: (cellId: string, value: string) => void;
  onCellKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, cellId: string) => void;
  highlightCells?: string[];
  cellSize?: number;
  focusTargetId?: string | null;
  animation?: AnimationInstruction | null;
};

export const GridRenderer: React.FC<GridRendererProps> = ({
  grid,
  activeStep,
  onCellChange,
  onCellKeyDown,
  highlightCells = [],
  cellSize = 56, // default 56px for good touch targets
  focusTargetId,
  animation
}) => {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  const width = cols * cellSize;
  const height = rows * cellSize;

  const activeCellIds = useMemo(() => {
    if (!activeStep) return new Set<string>();
    return new Set(activeStep.targetCells.map(pos => `${pos.r},${pos.c}`));
  }, [activeStep]);

  const highlightCellIds = useMemo(() => {
    return new Set(highlightCells);
  }, [highlightCells]);

  const flatCells = useMemo(() => {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell) {
          cells.push({ cell, r, c });
        }
      }
    }
    return cells;
  }, [grid, rows, cols]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusTargetId && containerRef.current) {
      // Small delay to ensure DOM is updated before focusing
      setTimeout(() => {
        const input = containerRef.current?.querySelector(`#cell-${focusTargetId.replace(',', '\\,')}`) as HTMLInputElement;
        if (input && typeof input.focus === 'function') {
          input.focus();
        }
      }, 50);
    }
  }, [focusTargetId, grid]);

  const getAnimationProps = (cellId: string) => {
    if (!animation || !('cells' in animation) || !animation.cells.includes(cellId)) return {};

    if (animation.type === 'error-shake') {
      return {
        animate: { x: [-5, 5, -5, 5, 0] },
        transition: { duration: 0.4 }
      };
    }
    if (animation.type === 'success-flash') {
      return {
        animate: { scale: [1, 1.1, 1], backgroundColor: ['#ffffff', '#dcfce7', '#ffffff'] },
        transition: { duration: 0.5 }
      };
    }
    return {};
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative bg-white border-2 border-gray-100 rounded-xl shadow-sm mx-auto"
      style={{ width: width + 8, height: height + 8 }}
      role="grid"
      aria-label="Math Grid"
      animate={animation?.type === 'step-complete' ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Background Grid Lines (Optional, for the "math notebook" feel) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          top: 4,
          left: 4,
          width: width,
          height: height,
          backgroundImage: `
            linear-gradient(to right, #cbd5e1 1px, transparent 1px),
            linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`
        }}
      />

      {/* Cells */}
      {flatCells.map(({ cell, r, c }) => {
        const style: React.CSSProperties = {
          top: r * cellSize + 4,
          left: c * cellSize + 4,
          width: cellSize,
          height: cellSize,
          position: 'absolute'
        };

        const animProps = getAnimationProps(cell.id);

        return (
          <motion.div key={cell.id} style={style} {...animProps}>
            <GridCell
              cell={cell}
              isActive={activeCellIds.has(cell.id)}
              highlight={highlightCellIds.has(cell.id)}
              onChange={onCellChange}
              onKeyDown={onCellKeyDown}
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};
