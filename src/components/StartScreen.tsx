import React, { useState } from 'react';
import { TaskType } from '../types';
import { Play, Settings, ChevronDown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartScreenProps {
  onStart: (taskType: TaskType, selectedTable: number | null) => void;
  onBack: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, onBack }) => {
  const [taskType, setTaskType] = useState<TaskType>('mixed');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  return (
    <div className="flex-1 flex items-center justify-center bg-stone-100 p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full text-center border border-stone-200 relative">
        <button 
            onClick={onBack}
            className="absolute top-6 left-6 text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-full hover:bg-stone-100"
            title="Profil wechseln"
        >
            <ArrowLeft size={24} />
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

        <button
          onClick={() => onStart(taskType, selectedTable)}
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
