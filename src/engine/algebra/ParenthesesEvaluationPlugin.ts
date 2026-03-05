import { EnginePlugin } from '../registry';
import { ParenthesesEvaluationEngine, ParenthesesEvaluationConfig } from './ParenthesesEvaluationEngine';

export const ParenthesesEvaluationPlugin: EnginePlugin<ParenthesesEvaluationConfig> = {
  id: 'parentheses_evaluation',
  displayName: 'Klammern ausrechnen',
  create: () => new ParenthesesEvaluationEngine(),
  getSkills: () => [
    {
      id: 'algebra_parentheses_evaluation',
      name: 'Klammern ausrechnen',
      domain: 'algebra',
      description: 'Ausdrücke der Form a ± (b ± c) berechnen',
      decayHalfLife: 45,
    }
  ],
  getDifficultySchema: () => ({}),
};
