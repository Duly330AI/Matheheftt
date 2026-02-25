import React, { useState, useMemo } from 'react';
import { TaskType, Difficulty, GameMode } from '../types';
import { useProfiles } from '../hooks/useProfiles';
import { Trophy, X, Filter, List, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const { profiles } = useProfiles();
  const [filterType, setFilterType] = useState<TaskType>('mixed');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty>('medium');
  const [filterMode, setFilterMode] = useState<GameMode>('classic');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  const categoryKey = useMemo(() => {
    let base = filterType;
    if (filterType === '1x1' && selectedTable) {
      base = `1x1-${selectedTable}`;
    }
    return `${base}-${filterDifficulty}-${filterMode}`;
  }, [filterType, filterDifficulty, filterMode, selectedTable]);

  const leaderboardData = useMemo(() => {
    return profiles
      .map(p => {
        const scores = p.highscores[categoryKey] || [];
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
        return {
          ...p,
          bestScore
        };
      })
      .filter(p => p.bestScore > 0)
      .sort((a, b) => b.bestScore - a.bestScore);
  }, [profiles, categoryKey]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50 rounded-t-xl">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full text-yellow-600 shadow-sm">
                    <Trophy size={24} />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">Bestenliste</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                <X size={24} className="text-stone-400" />
            </button>
        </div>

        {/* Filters */}
        <div className="p-6 bg-white border-b border-stone-100 space-y-4 shadow-sm z-10">
            <div className="flex flex-wrap gap-2">
                {/* Game Mode */}
                <div className="flex rounded-lg border border-stone-200 p-1 bg-stone-50">
                    <button 
                        onClick={() => setFilterMode('classic')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            filterMode === 'classic' ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
                        )}
                    >
                        <List size={14} /> Klassik
                    </button>
                    <button 
                        onClick={() => setFilterMode('time_attack')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                            filterMode === 'time_attack' ? "bg-white text-purple-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
                        )}
                    >
                        <Clock size={14} /> Zeit
                    </button>
                </div>

                {/* Difficulty */}
                <div className="flex rounded-lg border border-stone-200 p-1 bg-stone-50">
                    <button 
                        onClick={() => setFilterDifficulty('easy')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            filterDifficulty === 'easy' ? "bg-white text-green-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
                        )}
                    >
                        Leicht
                    </button>
                    <button 
                        onClick={() => setFilterDifficulty('medium')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            filterDifficulty === 'medium' ? "bg-white text-orange-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
                        )}
                    >
                        Mittel
                    </button>
                    <button 
                        onClick={() => setFilterDifficulty('hard')}
                        className={cn(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                            filterDifficulty === 'hard' ? "bg-white text-red-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
                        )}
                    >
                        Schwer
                    </button>
                </div>
            </div>

            {/* Task Type */}
            <div className="flex flex-wrap gap-2">
                {(['mixed', '+', '-', '*', ':', '1x1'] as TaskType[]).map(type => (
                    <button
                        key={type}
                        onClick={() => {
                            setFilterType(type);
                            if (type !== '1x1') setSelectedTable(null);
                        }}
                        className={cn(
                            "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                            filterType === type 
                                ? "bg-blue-50 border-blue-500 text-blue-700" 
                                : "bg-white border-stone-200 text-stone-600 hover:border-blue-300"
                        )}
                    >
                        {type === 'mixed' ? 'Mix' : type}
                    </button>
                ))}
            </div>

            {/* 1x1 Table Selection */}
            {filterType === '1x1' && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button
                            key={num}
                            onClick={() => setSelectedTable(num)}
                            className={cn(
                                "w-8 h-8 rounded border text-sm font-medium transition-colors flex items-center justify-center",
                                selectedTable === num
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "bg-white border-stone-200 text-stone-600 hover:border-blue-300"
                            )}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
            {leaderboardData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-4">
                    <Trophy size={48} className="opacity-20" />
                    <p>Noch keine Einträge für diese Kategorie.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {leaderboardData.map((entry, index) => (
                        <div key={entry.id} className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm hover:shadow-md",
                            index === 0 ? "bg-yellow-50 border-yellow-200" : 
                            index === 1 ? "bg-stone-100 border-stone-200" :
                            index === 2 ? "bg-orange-50 border-orange-200" : "bg-white border-stone-100"
                        )}>
                            <div className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg shadow-inner",
                                index === 0 ? "bg-yellow-400 text-white" :
                                index === 1 ? "bg-stone-400 text-white" :
                                index === 2 ? "bg-orange-400 text-white" : "bg-stone-100 text-stone-500"
                            )}>
                                {index + 1}
                            </div>
                            
                            <div className="text-3xl filter drop-shadow-sm transition-transform hover:scale-110 cursor-default" title={entry.avatar}>
                                {
                                    entry.avatar === 'cat' ? '🐱' :
                                    entry.avatar === 'dog' ? '🐶' :
                                    entry.avatar === 'rabbit' ? '🐰' :
                                    entry.avatar === 'bird' ? '🐦' :
                                    entry.avatar === 'fish' ? '🐠' : '🐢'
                                }
                            </div>
                            
                            <div className="flex-1">
                                <div className="font-bold text-stone-800 text-lg">{entry.name}</div>
                                <div className="text-xs text-stone-400 font-medium uppercase tracking-wider">
                                    {filterMode === 'classic' ? 'Klassik' : 'Zeit-Attacke'} • {filterDifficulty === 'easy' ? 'Leicht' : filterDifficulty === 'medium' ? 'Mittel' : 'Schwer'}
                                </div>
                            </div>
                            
                            <div className="font-mono font-bold text-2xl text-blue-600 tabular-nums tracking-tight">
                                {entry.bestScore.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
