import { SkillDefinition } from '../engine/registry';

export class SkillNode {
  public id: string;
  public definition: SkillDefinition;
  public parents: SkillNode[] = [];
  public children: SkillNode[] = [];

  constructor(definition: SkillDefinition) {
    this.id = definition.id;
    this.definition = definition;
  }
}

export class SkillGraph {
  private nodes: Map<string, SkillNode> = new Map();

  constructor(skills: SkillDefinition[]) {
    this.buildGraph(skills);
  }

  private buildGraph(skills: SkillDefinition[]) {
    // Create all nodes
    for (const skill of skills) {
      if (!this.nodes.has(skill.id)) {
        this.nodes.set(skill.id, new SkillNode(skill));
      }
    }

    // Link dependencies
    for (const skill of skills) {
      const node = this.nodes.get(skill.id)!;
      if (skill.dependsOn) {
        for (const depId of skill.dependsOn) {
          const parent = this.nodes.get(depId);
          if (parent) {
            node.parents.push(parent);
            parent.children.push(node);
          } else {
            console.warn(`Skill ${skill.id} depends on unknown skill ${depId}`);
          }
        }
      }
    }
  }

  public getNode(id: string): SkillNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): SkillNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Propagates a score change through the graph.
   * If a child skill fails, its parents might also be weak.
   * If a parent skill improves, its children might also benefit slightly.
   */
  public propagateScore(
    nodeId: string,
    delta: number,
    updateScore: (id: string, delta: number) => void,
    visited = new Set<string>()
  ) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Apply to current node
    updateScore(nodeId, delta);

    // If delta is negative (error), propagate to parents (dependencies)
    // because failing a complex task might mean failing its prerequisites.
    if (delta < 0) {
      const parentDelta = delta * 0.5; // Diminished effect
      for (const parent of node.parents) {
        this.propagateScore(parent.id, parentDelta, updateScore, visited);
      }
    }

    // If delta is positive (success), propagate to children slightly?
    // Usually success in prerequisite doesn't mean success in complex task,
    // but maybe success in complex task means success in prerequisites.
    if (delta > 0) {
      const parentDelta = delta * 0.2;
      for (const parent of node.parents) {
        this.propagateScore(parent.id, parentDelta, updateScore, visited);
      }
    }
  }
}
