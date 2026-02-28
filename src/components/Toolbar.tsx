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
  'algebra': 'Klammern',
  'simplify_terms': 'Terme'
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
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-stone-200 shadow-sm z-10">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-stone-700 mr-4">Matheheft</h1>

        {activeProfile && (
          <div className="flex items-center gap-2 mr-4 text-sm text-stone-600 bg-stone-100 px-2 py-1 rounded cursor-pointer hover:bg-stone-200" onClick={onLogout} title="Profil wechseln">
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

        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <span>{taskTypeLabels[taskType]}</span>
          <span className="opacity-30">•</span>
          <span>{difficultyLabels[difficulty]}</span>
          <span className="opacity-30">•</span>
          <span>{modeLabels[sessionState.gameMode]}</span>
        </div>

        <div className="flex items-center bg-stone-100 rounded p-0.5 ml-4">
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
        </div>

        <button
          onClick={onClear}
          className="p-2 rounded hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors ml-2"
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
