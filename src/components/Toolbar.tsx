import React from 'react';
import { cn } from '../lib/utils';
import { Eraser, Trash2, Download, RefreshCw, CheckCircle, Settings, ChevronDown } from 'lucide-react';
import { TaskType, Profile, SessionState, Difficulty } from '../types';
import { Timer } from './Timer';

interface ToolbarProps {
  activeProfile: Profile | null;
  sessionState: SessionState;
  taskType: TaskType;
  difficulty: Difficulty;
  onNewTask: () => void;
  onExamSubmit?: () => void;
  onNextExamTask?: () => void;
  onClear: () => void;
  onLogout: () => void;
}

const taskTypeLabels: Record<string, string> = {
  'mixed': 'Mix',
  '+': 'Addition',
  '-': 'Subtraktion',
  '*': 'Multiplikation',
  ':': 'Division',
  '1x1': 'Einmaleins',
  'algebra': 'Algebra',
  'insert_parentheses': 'Klammern setzen',
  'parentheses_evaluation': 'Klammern ausrechnen'
};

const difficultyLabels: Record<string, string> = {
  'easy': 'Leicht',
  'medium': 'Mittel',
  'hard': 'Schwer'
};

const modeLabels: Record<string, string> = {
  'classic': 'Klassik',
  'time_attack': 'Zeit',
  'exam': 'Prüfung'
};

export const Toolbar: React.FC<ToolbarProps> = ({
  activeProfile,
  sessionState,
  taskType,
  difficulty,
  onNewTask,
  onExamSubmit,
  onNextExamTask,
  onClear,
  onLogout
}) => {

  return (
    <div className="bg-white border-b border-stone-200 shadow-sm z-10 flex flex-col shrink-0">
      {/* Mobile Compact Bar */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-white border-b border-stone-200 shrink-0 h-12">
          <div className="flex items-center gap-2 overflow-hidden">
             <span className="font-bold text-stone-700 truncate max-w-[80px]">{activeProfile?.name}</span>
             <span className="text-stone-300">|</span>
             <span className="text-sm text-stone-600 whitespace-nowrap">{sessionState.score} Pkt</span>
             <span className="text-stone-300">|</span>
             <div className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium truncate max-w-[100px]">
                {taskTypeLabels[taskType] || taskType}
             </div>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
             <Timer startTime={sessionState.startTime} className="text-xs text-stone-500 font-mono mr-2" />
             <button onClick={onClear} className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors">
                <Trash2 size={16} />
             </button>
          </div>
      </div>

      {/* Desktop Layout (Hidden on Mobile) */}
      <div className="hidden md:flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 w-full">
          <h1 className="text-lg font-semibold text-stone-700 mr-4 shrink-0">Matheheft</h1>

          {activeProfile && (
            <div className="flex items-center gap-2 mr-4 text-sm text-stone-600 bg-stone-100 px-2 py-1 rounded cursor-pointer hover:bg-stone-200 shrink-0" onClick={onLogout} title="Profil wechseln">
              <span className="font-medium">{activeProfile.name}</span>
              <span className="text-stone-400">|</span>
              <span>{sessionState.score} Pkt</span>
              {sessionState.gameMode !== 'time_attack' && (
                <>
                  <span className="text-stone-400">|</span>
                  <span>Aufgabe {sessionState.currentTaskIndex}/{sessionState.totalTasks}</span>
                </>
              )}
              <span className="text-stone-400">|</span>
              <Timer startTime={sessionState.startTime} />
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider shrink-0">
            <span>{taskTypeLabels[taskType] || taskType}</span>
            <span className="opacity-30">•</span>
            <span>{difficultyLabels[difficulty] || difficulty}</span>
            <span className="opacity-30">•</span>
            <span>{modeLabels[sessionState.gameMode] || sessionState.gameMode}</span>
          </div>

          <div className="flex items-center bg-stone-100 rounded p-0.5 ml-auto shrink-0">
            {sessionState.gameMode === 'exam' && !sessionState.examReviewMode && (
              <>
                <button
                  onClick={onNextExamTask}
                  className="px-3 py-1.5 rounded hover:bg-white hover:shadow text-stone-600 transition-colors text-sm font-medium"
                  title="Nächste Aufgabe"
                >
                  Nächste
                </button>
                <button
                  onClick={onExamSubmit}
                  className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors text-sm font-medium ml-1"
                  title="Prüfung abgeben"
                >
                  Abgeben
                </button>
              </>
            )}
            
            <button
              onClick={onClear}
              className="p-2 rounded hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors"
              title="Alles löschen"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="hidden lg:block text-sm text-stone-500 ml-4 shrink-0 whitespace-nowrap">
          Klicken zum Schreiben • Pfeiltasten zum Bewegen
        </div>
      </div>
    </div>
  );
};
