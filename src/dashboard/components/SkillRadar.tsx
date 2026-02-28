import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarProps {
  skills: Record<string, number>;
  skillHistory?: Record<string, { timestamp: number, score: number }[]>;
}

const skillTranslations: Record<string, string> = {
  'addition_no_carry': 'Addition ohne Übertrag',
  'addition_carry': 'Addition mit Übertrag',
  'subtraction_no_borrow': 'Subtraktion ohne Entleihen',
  'subtraction_borrow': 'Subtraktion mit Entleihen',
  'multiplication_basic': 'Einmaleins',
  'multiplication_carry': 'Multiplikation mit Übertrag',
  'division_estimation': 'Divisions-Schätzung',
  'division_subtract': 'Divisions-Subtraktion',
  'division_process': 'Divisions-Ablauf',
  'place_value': 'Stellenwert-Verständnis',
  'algebra_expand_brackets': 'Klammern auflösen',
  'algebra_simplify_terms': 'Terme vereinfachen'
};

export const SkillRadar: React.FC<SkillRadarProps> = ({ skills, skillHistory }) => {
  const data = Object.entries(skills).map(([skill, score]) => {
    // Calculate previous score (average of last 3 entries or just the last one)
    let previousScore = 0;
    if (skillHistory && skillHistory[skill] && skillHistory[skill].length > 0) {
      const history = skillHistory[skill];
      // Get the score from before the current one, or average of recent history
      // For simplicity, let's take the average of the last 5 entries to smooth it out
      const recentHistory = history.slice(-5);
      previousScore = recentHistory.reduce((acc, curr) => acc + curr.score, 0) / recentHistory.length;
    }

    return {
      subject: skillTranslations[skill] || skill.replace(/_/g, ' '),
      A: (score as number) * 100,
      B: previousScore * 100,
      fullMark: 100,
    };
  });

  return (
    <div className="w-full h-full min-h-[250px] flex flex-col">
      <h3 className="text-sm font-semibold text-gray-500 mb-2">Skill Profil</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#6b7280' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
            <Radar
              name="Aktuell"
              dataKey="A"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            {skillHistory && (
              <Radar
                name="Verlauf"
                dataKey="B"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
