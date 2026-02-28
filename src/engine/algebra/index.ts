import { EnginePlugin } from '../registry';
import { AlgebraEngine, AlgebraConfig } from './AlgebraEngine';

export const AlgebraPlugin: EnginePlugin<AlgebraConfig> = {
  id: 'algebra',
  displayName: 'Algebra',
  create: () => new AlgebraEngine(),
  getSkills: () => [
    {
      id: 'algebra_expand_brackets',
      name: 'Klammern auflösen',
      domain: 'algebra',
      description: 'Distributivgesetz anwenden: a(b+c) = ab+ac',
      decayHalfLife: 45,
    },
    {
      id: 'algebra_simplify_terms',
      name: 'Terme vereinfachen',
      domain: 'algebra',
      description: 'Gleichartige Terme zusammenfassen',
      dependsOn: ['algebra_expand_brackets'],
      decayHalfLife: 45,
    }
  ],
  getDifficultySchema: () => ({
    // Schema for difficulty configuration
    // Not fully implemented in MVP yet
  }),
};
