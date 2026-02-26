import React, { useState } from 'react';
import { TaskType, Difficulty, GameMode } from '../types';
import { Play, Settings, ChevronDown, ArrowLeft, Clock, List, Zap, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

interface StartScreenProps {
  onStart: (taskType: TaskType, selectedTable: number | null, difficulty: Difficulty, gameMode: GameMode, timeLimit?: number) => void;
  onBack: () => void;
  onOpenLeaderboard: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onBack, onOpenLeaderboard }) => {
  const [taskType, setTaskType] = useState<TaskType>('mixed');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [timeLimit, setTimeLimit] = useState<number>(180); // 3 minutes default

  const handleStart = () => {
    onStart(taskType, selectedTable, difficulty, gameMode, gameMode === 'time_attack' ? timeLimit : undefined);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-stone-100 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full text-center border border-stone-200 relative my-8">
        <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-full hover:bg-stone-100"
            title="Profil wechseln"
        >
            <ArrowLeft size={24} />
        </button>

        <button 
            onClick={onOpenLeaderboard}
            className="absolute top-6 right-6 text-yellow-500 hover:text-yellow-600 transition-colors p-1 rounded-full hover:bg-yellow-50"
            title="Bestenliste"
        >
            <Trophy size={24} />
        </button>

        <h2 className="text-2xl font-bold text-stone-800 mb-6">Wähle deine Übung</h2>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {['mixed', '+', '-', '*', ':'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setTaskType(type as TaskType);
                if (type !== '1x1') setSelectedTable(null);
              }}
              className={cn(
                "px-4 py-3 rounded-lg border-2 text-lg font-medium transition-all",
                taskType === type 
                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                  : "border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
              )}
            >
              {type === 'mixed' ? 'Mix' : type}
            </button>
          ))}
          <button
             onClick={() => setTaskType('1x1')}
             className={cn(
               "px-4 py-3 rounded-lg border-2 text-lg font-medium transition-all",
               taskType === '1x1'
                 ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                 : "border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300"
             )}
          >
            1x1
          </button>
        </div>

        {taskType === '1x1' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-sm font-semibold text-stone-500 mb-3 uppercase tracking-wider">Welche Reihe?</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }).map((_, i) => {
                const num = i + 1;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedTable(num)}
                    className={cn(
                      "h-10 rounded-lg border-2 flex items-center justify-center font-medium transition-all",
                      selectedTable === num
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="h-px bg-stone-100 my-6" />

        {/* Difficulty Selection */}
        <div className="mb-6">
          <p className="text-sm text-stone-500 mb-2 font-medium uppercase tracking-wider">Schwierigkeit</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setDifficulty('easy')}
              className={cn(
                "p-2 rounded-lg border-2 text-sm font-medium transition-all",
                difficulty === 'easy'
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-stone-200 hover:border-green-300 text-stone-600"
              )}
            >
              Leicht
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={cn(
                "p-2 rounded-lg border-2 text-sm font-medium transition-all",
                difficulty === 'medium'
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-stone-200 hover:border-orange-300 text-stone-600"
              )}
            >
              Mittel
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={cn(
                "p-2 rounded-lg border-2 text-sm font-medium transition-all",
                difficulty === 'hard'
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-stone-200 hover:border-red-300 text-stone-600"
              )}
            >
              Schwer
            </button>
          </div>
        </div>

        {/* Game Mode Selection */}
        <div className="mb-8">
          <p className="text-sm text-stone-500 mb-2 font-medium uppercase tracking-wider">Modus</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => setGameMode('classic')}
              className={cn(
                "p-3 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center justify-center gap-1",
                gameMode === 'classic'
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-stone-200 hover:border-indigo-300 text-stone-600"
              )}
            >
              <List size={18} />
              <span>Klassik</span>
            </button>
            <button
              onClick={() => setGameMode('time_attack')}
              className={cn(
                "p-3 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center justify-center gap-1",
                gameMode === 'time_attack'
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-stone-200 hover:border-purple-300 text-stone-600"
              )}
            >
              <Clock size={18} />
              <span>Zeit</span>
            </button>
            <button
              onClick={() => setGameMode('exam')}
              className={cn(
                "p-3 rounded-lg border-2 text-sm font-medium transition-all flex flex-col items-center justify-center gap-1",
                gameMode === 'exam'
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-stone-200 hover:border-red-300 text-stone-600"
              )}
              title="Keine direkte Hilfe, Auswertung am Ende"
            >
              <Zap size={18} />
              <span>Prüfung</span>
            </button>
          </div>

          {(gameMode === 'time_attack' || gameMode === 'exam') && (
            <div className="flex justify-center gap-2 animate-in fade-in slide-in-from-top-2">
              {[180, 300, 600].map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => setTimeLimit(seconds)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    timeLimit === seconds
                      ? (gameMode === 'exam' ? "bg-red-100 text-red-700 border-red-200" : "bg-purple-100 text-purple-700 border-purple-200")
                      : "bg-stone-50 text-stone-500 border-stone-200 hover:border-stone-300"
                  )}
                >
                  {seconds / 60} Min
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={taskType === '1x1' && !selectedTable}
          className="w-full py-4 rounded-xl bg-blue-600 text-white text-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <Play size={24} fill="currentColor" />
          Starten
        </button>
      </div>
    </div>
  );
};
