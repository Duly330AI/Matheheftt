import React from 'react';
import { CognitiveLoadState } from '../../cognitive/types';

interface CognitiveStateTimelineProps {
  timeline: {
    timestamp: number;
    state: CognitiveLoadState;
  }[];
}

const stateColors: Record<CognitiveLoadState, string> = {
  [CognitiveLoadState.UNDERLOADED]: 'bg-blue-200',
  [CognitiveLoadState.OPTIMAL]: 'bg-green-400',
  [CognitiveLoadState.HIGH]: 'bg-yellow-400',
  [CognitiveLoadState.OVERLOADED]: 'bg-red-500',
};

export const CognitiveStateTimeline: React.FC<CognitiveStateTimelineProps> = ({ timeline }) => {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">Kognitiver Zustand</h3>
      <div className="flex h-8 rounded-full overflow-hidden border border-gray-200">
        {timeline.map((entry, index) => (
          <div
            key={index}
            className={`flex-1 ${stateColors[entry.state]} border-r border-white/20 last:border-0`}
            title={`${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.state}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>Start</span>
        <span>Ende</span>
      </div>
    </div>
  );
};
