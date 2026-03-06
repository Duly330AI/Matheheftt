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
  activeCellId?: string | null;
  onCellFocus?: (cellId: string) => void;
  readOnly?: boolean;
};

export const GridRenderer: React.FC<GridRendererProps> = ({
  grid,
  activeStep,
  onCellChange,
  onCellKeyDown,
  highlightCells = [],
  cellSize = 56, // default 56px for good touch targets
  focusTargetId,
  animation,
  activeCellId,
  onCellFocus,
  readOnly = false
}) => {
  const rows = grid.length;
  // Calculate max columns robustly
  let maxCols = 0;
  if (rows > 0) {
    // Explicitly check the first row as it often contains the long equation text
    maxCols = grid[0].length;
    for (let r = 1; r < rows; r++) {
      if (grid[r] && grid[r].length > maxCols) {
        maxCols = grid[r].length;
      }
    }
  }
  const cols = maxCols;

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const updateScale = () => {
      if (!wrapperRef.current) return;
      
      const availableWidth = wrapperRef.current.clientWidth;
      const availableHeight = wrapperRef.current.clientHeight;
      
      // Add some padding to prevent edge-to-edge
      const contentWidth = (cols * cellSize) + 80; // 40px padding each side
      const contentHeight = (rows * cellSize) + 80;

      const scaleX = availableWidth / contentWidth;
      const scaleY = availableHeight / contentHeight;
      
      // Use the smaller scale to fit both dimensions, but cap at 1.0 (don't upscale)
      // Also set a minimum scale to prevent it from becoming unreadable (e.g. 0.5)
      const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1);
      
      setScale(newScale);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapperRef.current);
    
    // Initial calculation
    updateScale();

    return () => observer.disconnect();
  }, [cols, rows, cellSize]);

  useEffect(() => {
    if (focusTargetId && containerRef.current) {
      // Small delay to ensure DOM is updated before focusing
      setTimeout(() => {
        // Escape special characters in ID for querySelector
        // IDs might contain commas (e.g. "0,1") which need escaping
        const safeId = focusTargetId.replace(/(:|\.|\[|\]|,|=|@)/g, "\\$1");
        const input = containerRef.current?.querySelector(`#cell-${safeId}`) as HTMLInputElement;
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
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <motion.div
        ref={containerRef}
        className="relative bg-white border-2 border-gray-100 rounded-xl shadow-sm mx-auto origin-center"
        style={{ 
          width: width + 48, 
          height: height + 48,
          transform: `scale(${scale})`
        }}
        role="grid"
        aria-label="Math Grid"
        animate={animation?.type === 'step-complete' ? { scale: [scale, scale * 1.02, scale] } : {}}
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
              readOnly={readOnly}
              onFocus={() => onCellFocus?.(cell.id)}
              isFocused={activeCellId === cell.id}
            />
          </motion.div>
        );
      })}
      </motion.div>
    </div>
  );
};
