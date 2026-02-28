import { MathEngine } from './types';

export interface SkillDefinition {
  id: string;
  name: string;
  domain: string;
  description: string;
  dependsOn?: string[];
  decayHalfLife?: number; // in days
}

export interface DifficultySchema {
  [key: string]: any;
}

export interface EnginePlugin<TConfig = any> {
  id: string;
  displayName: string;
  create(): MathEngine<TConfig>;
  getSkills(): SkillDefinition[];
  getDifficultySchema(): DifficultySchema;
}

export class EngineRegistry {
  private static instance: EngineRegistry;
  private plugins: Map<string, EnginePlugin> = new Map();

  private constructor() {}

  public static getInstance(): EngineRegistry {
    if (!EngineRegistry.instance) {
      EngineRegistry.instance = new EngineRegistry();
    }
    return EngineRegistry.instance;
  }

  public register(plugin: EnginePlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Engine with id '${plugin.id}' is already registered.`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  public get(id: string): EnginePlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Engine with id '${id}' not found.`);
    }
    return plugin;
  }

  public list(): EnginePlugin[] {
    return Array.from(this.plugins.values());
  }
}
