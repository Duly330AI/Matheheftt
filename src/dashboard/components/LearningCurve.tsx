import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CognitiveLoadState } from '../../cognitive/types';

interface LearningCurveProps {
  history: {
    timestamp: number;
    accuracy: number;
    loadState: CognitiveLoadState;
    difficulty: number; // Normalized difficulty
  }[];
}

export const LearningCurve: React.FC<LearningCurveProps> = ({ history }) => {
  const data = history.map((h, i) => ({
    name: `Task ${i + 1}`,
    accuracy: h.accuracy * 100,
    difficulty: h.difficulty * 100,
    load: h.loadState === CognitiveLoadState.OVERLOADED ? 100 :
          h.loadState === CognitiveLoadState.HIGH ? 75 :
          h.loadState === CognitiveLoadState.OPTIMAL ? 50 : 25,
  }));

  return (
    <div className="w-full h-64">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">Lernverlauf</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="accuracy" stroke="#82ca9d" name="Genauigkeit" />
          <Line type="monotone" dataKey="difficulty" stroke="#8884d8" name="Schwierigkeit" />
          <Line type="step" dataKey="load" stroke="#ff7300" name="Kognitive Last" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
