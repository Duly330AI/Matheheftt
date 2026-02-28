import { EnginePlugin } from '../registry';
import { AlgebraEngine, AlgebraConfig } from './AlgebraEngine';
import { SimplifyTermsEngine, SimplifyTermsConfig } from './SimplifyTermsEngine';

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
    }
  ],
  getDifficultySchema: () => ({}),
};

export const SimplifyTermsPlugin: EnginePlugin<SimplifyTermsConfig> = {
  id: 'simplify_terms',
  displayName: 'Terme zusammenfassen',
  create: () => new SimplifyTermsEngine(),
  getSkills: () => [
    {
      id: 'algebra_simplify_terms',
      name: 'Terme vereinfachen',
      domain: 'algebra',
      description: 'Gleichartige Terme zusammenfassen',
      dependsOn: ['algebra_expand_brackets'],
      decayHalfLife: 45,
    },
    {
      id: 'algebra_symbol_understanding',
      name: 'Symbolverständnis',
      domain: 'algebra',
      description: 'Verständnis, dass Variablen wie Objekte behandelt werden (x bleibt x)',
      decayHalfLife: 60,
    },
    {
      id: 'algebra_sign_rules',
      name: 'Vorzeichenregeln',
      domain: 'algebra',
      description: 'Korrekter Umgang mit negativen Vorzeichen beim Zusammenfassen',
      decayHalfLife: 30,
    },
    {
      id: 'algebra_like_terms',
      name: 'Gleichartige Terme erkennen',
      domain: 'algebra',
      description: 'Erkennen, welche Terme zusammengefasst werden dürfen und welche nicht',
      decayHalfLife: 45,
    }
  ],
  getDifficultySchema: () => ({}),
};
