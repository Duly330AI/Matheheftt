import React from 'react';
import { TeacherInsight } from '../../analytics/types';

interface InterventionAlertsProps {
  insights: TeacherInsight[];
}

const alertColors: Record<string, string> = {
  alert: 'bg-red-50 border-red-200 text-red-700',
  recommendation: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  praise: 'bg-green-50 border-green-200 text-green-700',
};

export const InterventionAlerts: React.FC<InterventionAlertsProps> = ({ insights }) => {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">Interventionen</h3>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li
            key={index}
            className={`p-3 rounded-md border text-sm flex items-start gap-2 ${alertColors[insight.type]}`}
          >
            <span className="font-bold uppercase text-xs tracking-wider mt-0.5">{insight.type}</span>
            <p>{insight.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
