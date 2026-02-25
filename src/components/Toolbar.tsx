import React from 'react';
import { cn } from '@/lib/utils';
import { Eraser, Underline, Trash2, Download, RefreshCw, CheckCircle, Superscript, ArrowLeft, ArrowRight, ArrowDown, Ban, Settings, ChevronDown } from 'lucide-react';
import { TaskType, Profile, SessionState } from '../types';
import { Timer } from './Timer';

interface ToolbarProps {
  activeProfile: Profile | null;
  sessionState: SessionState;
  onNewTask: () => void;
  onClear: () => void;
  onToggleUnderline: () => void;
  onToggleCarryMode: () => void;
  isCarryMode: boolean;
  taskType: TaskType;
  setTaskType: (type: TaskType) => void;
  selectedTable: number | null;
  setSelectedTable: (table: number) => void;
  autoMoveDir: 'left' | 'right' | 'down' | 'none';
  setAutoMoveDir: (dir: 'left' | 'right' | 'down' | 'none') => void;
  onInsertSymbol: (symbol: string) => void;
  onLogout: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeProfile,
  sessionState,
  onNewTask,
  onClear,
  onToggleUnderline,
  onToggleCarryMode,
  isCarryMode,
  taskType,
  setTaskType,
  selectedTable,
  setSelectedTable,
  autoMoveDir,
  setAutoMoveDir,
  onInsertSymbol,
  onLogout
}) => {
  const [showTaskMenu, setShowTaskMenu] = React.useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-stone-200 shadow-sm z-10">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-stone-700 mr-4">Matheheft</h1>

        {activeProfile && (
          <div className="flex items-center gap-2 mr-4 text-sm text-stone-600 bg-stone-100 px-2 py-1 rounded cursor-pointer hover:bg-stone-200" onClick={onLogout} title="Profil wechseln">
            <span className="font-medium">{activeProfile.name}</span>
            <span className="text-stone-400">|</span>
            <span>{sessionState.score} Pkt</span>
            <span className="text-stone-400">|</span>
            <span>Aufgabe {sessionState.currentTaskIndex}/{sessionState.totalTasks}</span>
            <span className="text-stone-400">|</span>
            <Timer startTime={sessionState.startTime} />
          </div>
        )}

        <button
          onClick={onToggleUnderline}
          className="p-2 rounded hover:bg-stone-100 transition-colors text-stone-600"
          title="Unterstreichen (oder Strg+U)"
        >
          <Underline size={20} />
        </button>

        <div className="w-px h-6 bg-stone-200 mx-2" />

        {['+', '-', '·', ':', '='].map((symbol) => (
          <button
            key={symbol}
            onClick={() => onInsertSymbol(symbol)}
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
              onClick={onNewTask}
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
                {['mixed', '+', '-', '*', ':'].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setTaskType(type as TaskType); setShowTaskMenu(false); }}
                    className={cn("px-2 py-1 text-sm rounded border", taskType === type ? "bg-blue-50 border-blue-200 text-blue-700" : "border-stone-200 hover:bg-stone-50")}
                  >
                    {type === 'mixed' ? 'Mix' : type}
                  </button>
                ))}
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
          onClick={onToggleCarryMode}
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
          onClick={onClear}
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
  );
};
