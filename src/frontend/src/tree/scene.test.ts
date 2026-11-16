import { generateTree } from './generate';
import { DUR, NEVER, buildScene, shownMastery, visibleLength } from './scene';
import type { TreeInput } from './types';

const now = Date.parse('2026-11-16T12:00:00Z');
const input = (): TreeInput => ({
  studentId: 's',
  courses: [{ id: 'c1', title: 'C1', topics: [{ id: 't1', title: 'T1', mastery: 0.9 }, { id: 't2', title: 'T2', mastery: 0.5 }] }],
});
const build = (prev: ReturnType<typeof buildScene> | null, data: TreeInput, t: number, instant = false) =>
  buildScene(prev, generateTree(data), data, now, t, instant);

describe('buildScene', () => {
  it('shows the first tree fully grown', () => {
    const scene = build(null, input(), 0);
    const b = scene.branches[0];
    expect(b.born).toBe(NEVER);
    expect(visibleLength(b, 0, false)).toBe(b.to);
    expect(b.leaves.map((l) => l.id)).toEqual(['t1', 't2']);
  });

  it('keeps the trunk a sapling until a course needs it taller', () => {
    const empty = build(null, { studentId: 's', courses: [] }, 0);
    const data = input();
    const grown = build(empty, data, 100);
    expect(grown.trunk.to).toBeGreaterThan(empty.trunk.to);
    expect(grown.trunk.born).toBe(100);
    const base = grown.branches[0].samples[0];
    const top = grown.trunk.samples.filter((s) => s.d <= grown.trunk.to).at(-1);
    expect(top!.y).toBeLessThan(base.y);
  });

  it('grows a new course from the trunk and opens its leaves after the tip reaches them', () => {
    const data = input();
    const first = build(null, data, 0);
    data.courses.push({ id: 'c2', title: 'C2', topics: [{ id: 'n1', title: 'N1', mastery: 1 }] });
    const scene = build(first, data, 1000);
    expect(scene.branches[0]).toEqual(first.branches[0]);
    const grown = scene.branches[1];
    expect(visibleLength(grown, 1000, false)).toBe(0);
    expect(visibleLength(grown, 1000 + DUR.grow, false)).toBe(grown.to);
    expect(grown.leaves[0].born).toBeGreaterThan(1000);
  });

  it('animates mastery changes and drops the leaf below the threshold', () => {
    const data = input();
    const first = build(null, data, 0);
    data.courses[0].topics[0] = { ...data.courses[0].topics[0], mastery: 0.1 };
    const leaf = build(first, data, 500).branches[0].leaves[0];
    expect(shownMastery(leaf, 500, false)).toBeCloseTo(0.9);
    expect(shownMastery(leaf, 500 + DUR.color, false)).toBeCloseTo(0.1);
    expect(leaf.fallen).toBe(true);
    expect(leaf.fellAt).toBe(500);
  });

  it('keeps removed topics and courses until the reverse animation ends', () => {
    const data = input();
    const first = build(null, data, 0);
    data.courses[0].topics.pop();
    const second = build(first, data, 100);
    expect(second.branches[0].leaves.find((l) => l.id === 't2')?.died).toBe(100);
    data.courses = [];
    const third = build(second, data, 200);
    expect(third.branches[0].died).toBe(200);
    expect(build(third, data, 200 + DUR.grow).branches).toHaveLength(0);
  });

  it('skips every transition with reduce motion', () => {
    const data = input();
    const first = build(null, data, 0, true);
    data.courses[0].topics.pop();
    data.courses.push({ id: 'c2', title: 'C2', topics: [] });
    const scene = build(first, data, 100, true);
    expect(scene.branches[0].leaves).toHaveLength(1);
    expect(visibleLength(scene.branches[1], 100, true)).toBe(scene.branches[1].to);
  });
});
