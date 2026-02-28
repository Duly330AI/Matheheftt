import { EngineRegistry } from './registry';
import { AdditionPlugin } from './AdditionEngine';
import { SubtractionPlugin } from './SubtractionEngine';
import { MultiplicationPlugin } from './MultiplicationEngine';
import { DivisionPlugin } from './DivisionEngine';
import { AlgebraPlugin } from './algebra';

const registry = EngineRegistry.getInstance();

registry.register(AdditionPlugin);
registry.register(SubtractionPlugin);
registry.register(MultiplicationPlugin);
registry.register(DivisionPlugin);
registry.register(AlgebraPlugin);

export { registry as engineRegistry };
export * from './registry';
export * from './types';
