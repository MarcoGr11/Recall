import { assignSlots, generateTree, outline, structureKey } from './generate';
import { isDue, masteryColor, vitality } from './mastery';
import type { Course, TreeInput } from './types';

const course = (c: number, topics: number): Course => ({
  id: `course-${c}`,
  title: `Курс ${c}`,
  topics: Array.from({ length: topics }, (_, t) => ({ id: `c${c}-t${t}`, title: `Тема ${t}`, mastery: (t % 10) / 10 })),
});
const input = (courses: number, topics: number): TreeInput => ({
  studentId: 'student-1',
  courses: Array.from({ length: courses }, (_, c) => course(c, topics)),
});

const numbers = (v: unknown): number[] =>
  typeof v === 'number' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(numbers) : [];

describe('generateTree', () => {
  it('is deterministic', () => {
    expect(generateTree(input(5, 12))).toEqual(generateTree(input(5, 12)));
  });

  it('does not depend on mastery', () => {
    const a = input(3, 8);
    const b = input(3, 8);
    b.courses[1].topics[2].mastery = 0.01;
    expect(generateTree(b)).toEqual(generateTree(a));
    expect(structureKey(b)).toBe(structureKey(a));
  });

  it('creates one leaf per topic and one branch per course', () => {
    const tree = generateTree(input(8, 30));
    expect(tree.branches).toHaveLength(8);
    expect(tree.leaves).toHaveLength(240);
    expect(new Set(tree.leaves.map((l) => l.topicId)).size).toBe(240);
  });

  it('produces no NaN and stays inside the world', () => {
    for (const [c, t] of [[0, 0], [1, 0], [1, 1], [5, 16], [8, 30], [10, 40]]) {
      const tree = generateTree(input(c, t));
      const all = numbers(tree);
      expect(all.every(Number.isFinite)).toBe(true);
      expect(tree.trunk.path).not.toMatch(/NaN|Infinity/);
      for (const l of tree.leaves) {
        expect(l.x).toBeGreaterThanOrEqual(0);
        expect(l.x).toBeLessThanOrEqual(tree.width);
        expect(l.y).toBeGreaterThanOrEqual(0);
        expect(l.y).toBeLessThan(tree.groundY);
      }
    }
  });

  it('keeps existing branches and leaves when a course is added', () => {
    const before = generateTree(input(4, 10));
    const grown = input(4, 10);
    grown.courses.push(course(99, 7));
    const after = generateTree(grown);
    expect(after.branches.slice(0, 4)).toEqual(before.branches);
    expect(after.leaves.slice(0, before.leaves.length)).toEqual(before.leaves);
    expect(after.trunk).toEqual(before.trunk);
  });

  it('keeps existing leaves when a topic is added', () => {
    for (const n of [3, 15, 16, 23, 24]) {
      const base = input(2, n);
      const before = generateTree(base);
      base.courses[0].topics.push({ id: 'new-topic', title: 'Нова', mastery: 0 });
      const after = generateTree(base);
      const old = after.leaves.filter((l) => l.topicId !== 'new-topic');
      expect(old).toEqual(before.leaves);
      expect(after.branches[1]).toEqual(before.branches[1]);
    }
  });

  it('only extends the tip when a branch gets longer', () => {
    const short = generateTree(input(1, 16)).branches[0];
    const long = generateTree(input(1, 17)).branches[0];
    expect(long.length).toBeGreaterThan(short.length);
    expect(long.samples.slice(0, short.samples.length)).toEqual(short.samples);
  });

  it('gives every course its own slot and keeps branches apart for 8×30', () => {
    const data = input(8, 30);
    expect(new Set(assignSlots(data.courses)).size).toBe(8);
    const tree = generateTree(data);
    const bases = tree.branches.map((b) => b.samples[0]);
    const tips = tree.branches.map((b) => b.samples[b.samples.length - 1]);
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        expect(Math.hypot(bases[i].x - bases[j].x, bases[i].y - bases[j].y)).toBeGreaterThan(40);
        expect(Math.hypot(tips[i].x - tips[j].x, tips[i].y - tips[j].y)).toBeGreaterThan(80);
      }
    }
    // centerlines of different branches never come closer than a branch width
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        for (const p of tree.branches[i].samples.slice(8)) {
          for (const q of tree.branches[j].samples.slice(8)) {
            expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(40);
          }
        }
      }
    }
  });
});

describe('outline', () => {
  it('grows monotonically and never emits NaN', () => {
    const { samples, length } = generateTree(input(1, 30)).branches[0];
    expect(outline(samples, 0)).toEqual([]);
    let prev = 0;
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const pts = outline(samples, length * p);
      expect(pts.every(Number.isFinite)).toBe(true);
      expect(pts.length).toBeGreaterThanOrEqual(prev);
      prev = pts.length;
    }
  });
});

describe('mastery', () => {
  it('maps mastery to red-brown → yellow → green', () => {
    const [r0, g0] = masteryColor(0);
    const [r5, g5, b5] = masteryColor(0.5);
    const [r1, g1] = masteryColor(1);
    expect(r0).toBeGreaterThan(g0);
    expect(r5).toBeGreaterThan(0.8);
    expect(g5).toBeGreaterThan(0.7);
    expect(b5).toBeLessThan(0.3);
    expect(g1).toBeGreaterThan(r1);
    expect(masteryColor(-1)).toEqual(masteryColor(0));
    expect(masteryColor(2)).toEqual(masteryColor(1));
  });

  it('turns unreviewed topics yellow and detects due topics', () => {
    const now = Date.parse('2026-11-16T12:00:00Z');
    const day = 86_400_000;
    const topic = { id: 't', title: 'T', mastery: 0.9, lastReviewedAt: new Date(now - 5 * day).toISOString(), dueAt: new Date(now + day).toISOString() };
    expect(vitality(topic, now)).toBe(0.9);
    expect(vitality(topic, now + 16 * day)).toBeLessThan(0.9);
    expect(vitality(topic, now + 60 * day)).toBeCloseTo(0.5);
    expect(isDue(topic, now)).toBe(false);
    expect(isDue(topic, now + 2 * day)).toBe(true);
  });
});
