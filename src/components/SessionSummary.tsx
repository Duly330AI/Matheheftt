import React from 'react';
import { SessionState, TaskType } from '../types';
import { Trophy, RotateCcw, Menu } from 'lucide-react';

interface SessionSummaryProps {
  sessionState: SessionState;
  taskType: TaskType;
  onRestart: () => void;
  onMenu: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  sessionState,
  taskType,
  onRestart,
  onMenu
}) => {
  const duration = Math.floor((Date.now() - sessionState.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
          <Trophy size={40} />
        </div>
        
        <h2 className="text-3xl font-bold text-stone-800 mb-2">Klasse gemacht!</h2>
        <p className="text-stone-500 mb-8">Du hast die Session erfolgreich beendet.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
            <div className="text-sm text-stone-500 mb-1">Punkte</div>
            <div className="text-2xl font-bold text-blue-600">{sessionState.score}</div>
          </div>
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
            <div className="text-sm text-stone-500 mb-1">Zeit</div>
            <div className="text-2xl font-bold text-stone-700">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <RotateCcw size={20} />
            Nochmal spielen ({taskType === 'mixed' ? 'Mix' : taskType})
          </button>
          
          <button
            onClick={onMenu}
            className="w-full py-3 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Menu size={20} />
            Zurück zum Menü
          </button>
        </div>
      </div>
    </div>
  );
};
