import React from 'react';
import { StudentSnapshot, KPI, TeacherInsight } from '../analytics/types';
import { PlannedTask } from '../planner/types';
import { Profile } from '../types';
import { SkillRadar } from './components/SkillRadar';
import { LearningCurve } from './components/LearningCurve';
import { CognitiveStateTimeline } from './components/CognitiveStateTimeline';
import { PlannerDecisions } from './components/PlannerDecisions';
import { InterventionAlerts } from './components/InterventionAlerts';
import { CognitiveLoadState } from '../cognitive/types';

interface DashboardProps {
  profiles: Profile[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  snapshot: StudentSnapshot;
  kpis: KPI;
  insights: TeacherInsight[];
  plannerHistory: PlannedTask[];
  learningHistory: {
    timestamp: number;
    accuracy: number;
    loadState: CognitiveLoadState;
    difficulty: number;
  }[];
  cognitiveTimeline: {
    timestamp: number;
    state: CognitiveLoadState;
  }[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  profiles,
  activeProfileId,
  onProfileChange,
  snapshot,
  kpis,
  insights,
  plannerHistory,
  learningHistory,
  cognitiveTimeline,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lehrer Dashboard</h1>
            <p className="text-gray-500">Echtzeit-Analyse & Pädagogische Einblicke</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 w-full sm:w-auto">
              <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Schüler:</span>
              <select 
                value={activeProfileId}
                onChange={(e) => onProfileChange(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer w-full sm:w-auto"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-center min-w-[100px]">
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Meisterschaft</span>
                <span className="text-lg font-bold text-blue-600 block leading-none">{((kpis.mastery || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-center min-w-[100px]">
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Anstrengung</span>
                <span className={`text-lg font-bold block leading-none ${kpis.struggle > 0.7 ? 'text-red-500' : 'text-green-500'}`}>
                  {((kpis.struggle || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 text-center min-w-[100px]">
                <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Fokus</span>
                <span className="text-lg font-bold text-purple-600 block leading-none">{((kpis.focus || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Visuals */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
              <LearningCurve history={learningHistory} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80">
                <SkillRadar skills={snapshot.skills} />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-80 flex flex-col justify-center">
                <CognitiveStateTimeline timeline={cognitiveTimeline} />
              </div>
            </div>
          </div>

          {/* Right Column: Insights & Decisions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <InterventionAlerts insights={insights} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <PlannerDecisions decisions={plannerHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
