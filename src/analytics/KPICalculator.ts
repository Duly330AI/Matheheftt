import { StudentSnapshot, KPI, TeacherInsight } from './types';
import { CognitiveLoadState } from '../cognitive/types';

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
  'algebra_simplify_terms': 'Terme vereinfachen',
  'algebra_parentheses_insertion': 'Klammern setzen',
  'algebra_order_of_operations': 'Vorrangregeln'
};

export class KPICalculator {
  public static calculateKPIs(snapshot: StudentSnapshot): KPI {
    // Mastery: Weighted average of skill scores (already in snapshot, but we can refine)
    const mastery = isNaN(snapshot.masteryLevel) ? 0 : snapshot.masteryLevel;

    // Struggle: Combination of frustration index, load state, and accuracy
    // High struggle = High frustration, Overloaded, Low accuracy
    let struggle = (isNaN(snapshot.frustrationIndex) ? 0 : snapshot.frustrationIndex) * 0.5;
    if (snapshot.loadState === CognitiveLoadState.OVERLOADED) struggle += 0.3;
    if (snapshot.accuracy < 0.5) struggle += 0.2;
    struggle = Math.min(1.0, isNaN(struggle) ? 0 : struggle);

    // Focus: Inverse of solve time variance (not available in single snapshot)
    // For single snapshot, we can use load state optimal as proxy
    let focus = 0.5;
    if (snapshot.loadState === CognitiveLoadState.OPTIMAL) focus = 0.9;
    if (snapshot.loadState === CognitiveLoadState.HIGH) focus = 0.7;
    if (snapshot.loadState === CognitiveLoadState.UNDERLOADED) focus = 0.3;

    // Confidence: Based on mastery and recent accuracy
    const accuracy = isNaN(snapshot.accuracy) ? 1.0 : snapshot.accuracy;
    const confidence = (mastery * 0.6) + (accuracy * 0.4);

    return {
      mastery,
      struggle,
      focus,
      confidence: isNaN(confidence) ? 0.5 : confidence
    };
  }

  public static generateInsights(snapshot: StudentSnapshot): TeacherInsight[] {
    const insights: TeacherInsight[] = [];

    // 1. Frustration Alert
    if (snapshot.frustrationIndex > 0.7) {
      insights.push({
        type: 'alert',
        message: 'Hohes Frustrationslevel erkannt. Empfehlung: Pause oder einfachere Aufgaben.',
        priority: 'high'
      });
    }

    // 2. Skill Weakness Recommendation
    const weakSkills = Object.entries(snapshot.skills)
      .filter(([_, score]) => score < 0.4)
      .map(([id]) => id);
    
    if (weakSkills.length > 0) {
      const translatedSkills = weakSkills.map(id => skillTranslations[id] || id);
      insights.push({
        type: 'recommendation',
        message: `Schwierigkeiten bei: ${translatedSkills.slice(0, 3).join(', ')}. Gezieltes Training empfohlen.`,
        relatedSkill: weakSkills[0],
        priority: 'medium'
      });
    }

    // 3. Flow Praise
    if (snapshot.loadState === CognitiveLoadState.OPTIMAL && snapshot.accuracy > 0.9) {
      insights.push({
        type: 'praise',
        message: 'Exzellenter Lernfluss! Der Schüler ist im "Flow".',
        priority: 'low'
      });
    }

    return insights;
  }
}
