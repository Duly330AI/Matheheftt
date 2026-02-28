import { describe, it, expect } from 'vitest';
import { SkillGraph } from '../SkillGraph';
import { SkillDefinition } from '../../engine/registry';

describe('SkillGraph', () => {
  const skills: SkillDefinition[] = [
    { id: 'a', name: 'A', domain: 'test', description: 'A' },
    { id: 'b', name: 'B', domain: 'test', description: 'B', dependsOn: ['a'] },
    { id: 'c', name: 'C', domain: 'test', description: 'C', dependsOn: ['b'] },
  ];

  it('should build graph correctly', () => {
    const graph = new SkillGraph(skills);
    
    const nodeA = graph.getNode('a');
    const nodeB = graph.getNode('b');
    const nodeC = graph.getNode('c');

    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();
    expect(nodeC).toBeDefined();

    expect(nodeA?.children).toContain(nodeB);
    expect(nodeB?.parents).toContain(nodeA);
    
    expect(nodeB?.children).toContain(nodeC);
    expect(nodeC?.parents).toContain(nodeB);
  });

  it('should propagate negative scores to parents', () => {
    const graph = new SkillGraph(skills);
    const scores: Record<string, number> = { a: 0.5, b: 0.5, c: 0.5 };
    
    graph.propagateScore('c', -0.1, (id, delta) => {
      scores[id] += delta;
    });

    // C gets -0.1
    // B gets -0.05
    // A gets -0.025
    expect(scores['c']).toBeCloseTo(0.4);
    expect(scores['b']).toBeCloseTo(0.45);
    expect(scores['a']).toBeCloseTo(0.475);
  });

  it('should propagate positive scores to parents', () => {
    const graph = new SkillGraph(skills);
    const scores: Record<string, number> = { a: 0.5, b: 0.5, c: 0.5 };
    
    graph.propagateScore('c', 0.1, (id, delta) => {
      scores[id] += delta;
    });

    // C gets 0.1
    // B gets 0.02
    // A gets 0.004
    expect(scores['c']).toBeCloseTo(0.6);
    expect(scores['b']).toBeCloseTo(0.52);
    expect(scores['a']).toBeCloseTo(0.504);
  });
});
