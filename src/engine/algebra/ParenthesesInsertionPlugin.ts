import { EnginePlugin } from '../registry';
import { ParenthesesInsertionEngine } from './ParenthesesInsertionEngine';
import { ProblemConfig } from '../../generator/profiles/difficultyProfiles';

export const ParenthesesInsertionPlugin: EnginePlugin<ProblemConfig> = {
  id: 'insert_parentheses',
  displayName: 'Klammern setzen',
  create: () => new ParenthesesInsertionEngine(),
  getSkills: () => [
    {
      id: 'algebra_order_of_operations',
      name: 'Vorrangregeln',
      domain: 'algebra',
      description: 'Punkt-vor-Strich und Klammerregeln verstehen',
      decayHalfLife: 60,
    },
    {
      id: 'algebra_parentheses_insertion',
      name: 'Klammern setzen',
      domain: 'algebra',
      description: 'Klammern bewusst setzen, um die Rechenreihenfolge zu verändern',
      decayHalfLife: 45,
      dependsOn: ['algebra_order_of_operations']
    }
  ],
  getDifficultySchema: () => ({}),
};
