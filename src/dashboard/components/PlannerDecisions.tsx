import React from 'react';
import { PlannedTask } from '../../planner/types';

interface PlannerDecisionsProps {
  decisions: PlannedTask[];
}

export const PlannerDecisions: React.FC<PlannerDecisionsProps> = ({ decisions }) => {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">KI-Entscheidungen</h3>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {decisions.map((decision, index) => (
          <li key={index} className="bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-gray-800">{decision.task.id}</span>
              <span className="text-xs text-gray-400">Score: {decision.score.toFixed(2)}</span>
            </div>
            <p className="text-gray-600 text-xs italic">{decision.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
