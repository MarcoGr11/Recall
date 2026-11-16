import { hash } from './generate';
import { FALL_THRESHOLD, isDue, vitality } from './mastery';
import type { LimbSample, TreeInput, TreePrimitives } from './types';

/** Animation durations, ms. */
export const DUR = { grow: 1200, leaf: 600, color: 800, fall: 1900 };
/** "Long ago": anything stamped with it is already fully animated. */
export const NEVER = -1e9;

export interface LeafState {
  id: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  ax: number;
  ay: number;
  /** Wind phase, radians. */
  phase: number;
  /** Clock time the leaf starts opening from a bud. */
  born: number;
  /** Clock time the topic was removed, 0 while alive. */
  died: number;
  /** Colour transition m0 → m1 started at mT. */
  m0: number;
  m1: number;
  mT: number;
  /** Mastery below FALL_THRESHOLD: the leaf has fallen (since fellAt), only a bud stays. */
  fallen: boolean;
  fellAt: number;
  due: boolean;
}

export interface BranchState {
  id: string;
  samples: LimbSample[];
  phase: number;
  /** Visible length animates from → to since born. */
  from: number;
  to: number;
  born: number;
  died: number;
  leaves: LeafState[];
}

export interface Scene {
  /** Reduce-motion: no wind, every transition is instant. */
  instant: boolean;
  branches: BranchState[];
}

export function progress(t: number, start: number, duration: number, instant: boolean): number {
  'worklet';
  if (instant) return 1;
  const p = (t - start) / duration;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

export function easeInOut(p: number): number {
  'worklet';
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function shownMastery(l: LeafState, t: number, instant: boolean): number {
  'worklet';
  return l.m0 + (l.m1 - l.m0) * easeInOut(progress(t, l.mT, DUR.color, instant));
}

export function visibleLength(b: BranchState, t: number, instant: boolean): number {
  'worklet';
  const grown = b.from + (b.to - b.from) * easeInOut(progress(t, b.born, DUR.grow, instant));
  return b.died ? grown * (1 - easeInOut(progress(t, b.died, DUR.grow, instant))) : grown;
}

const phaseOf = (id: string) => ((hash(id) % 6283) / 1000);

/**
 * Diffs the new tree against the previous scene and stamps what changed with the clock time `t`,
 * so the UI-thread drawing code can animate it without any per-frame work on the JS thread.
 * Removed items stay in the scene until their reverse animation is over.
 */
export function buildScene(
  prev: Scene | null,
  prims: TreePrimitives,
  input: TreeInput,
  nowMs: number,
  t: number,
  instant: boolean,
): Scene {
  const stamp = prev ? t : NEVER;
  const prevBranches = new Map((prev?.branches ?? []).filter((b) => !b.died).map((b) => [b.id, b]));
  const branches: BranchState[] = [];

  prims.branches.forEach((branch, ci) => {
    const course = input.courses[ci];
    const pb = prevBranches.get(branch.id);
    prevBranches.delete(branch.id);
    const resized = pb && pb.to !== branch.length;
    const state: BranchState = {
      id: branch.id,
      samples: branch.samples,
      phase: phaseOf(branch.id),
      from: pb ? (resized ? visibleLength(pb, t, instant) : pb.from) : 0,
      to: branch.length,
      born: pb && !resized ? pb.born : stamp,
      died: 0,
      leaves: [],
    };
    const prevLeaves = new Map((pb?.leaves ?? []).filter((l) => !l.died).map((l) => [l.id, l]));
    const topics = new Map(course.topics.map((topic) => [topic.id, topic]));

    for (const leaf of prims.leaves) {
      if (leaf.courseId !== branch.id) continue;
      const topic = topics.get(leaf.topicId);
      if (!topic) continue;
      const pl = prevLeaves.get(leaf.topicId);
      prevLeaves.delete(leaf.topicId);
      const m = vitality(topic, nowMs);
      const fallen = topic.mastery < FALL_THRESHOLD;
      let born = pl ? pl.born : stamp;
      if (!pl && !pb && prev) {
        // leaves of a sprouting branch open when the growing tip reaches them
        let along = 0;
        let nearest = Infinity;
        for (const s of branch.samples) {
          const dist = Math.hypot(s.x - leaf.ax, s.y - leaf.ay);
          if (dist < nearest) {
            nearest = dist;
            along = s.d;
          }
        }
        born = t + DUR.grow * (0.25 + (0.75 * along) / branch.length);
      }
      if (pl && pl.fallen && !fallen) born = t;
      const recolored = pl && pl.m1 !== m;
      state.leaves.push({
        id: leaf.topicId,
        x: leaf.x,
        y: leaf.y,
        rot: leaf.rotation,
        size: leaf.size,
        ax: leaf.ax,
        ay: leaf.ay,
        phase: phaseOf(leaf.topicId),
        born,
        died: 0,
        m0: pl ? (recolored ? shownMastery(pl, t, instant) : pl.m0) : m,
        m1: m,
        mT: pl ? (recolored ? t : pl.mT) : NEVER,
        fallen,
        fellAt: pl ? (fallen && !pl.fallen ? t : pl.fellAt) : NEVER,
        due: isDue(topic, nowMs),
      });
    }
    // removed topics: play the leaf animation backwards, then drop them on a later rebuild
    for (const gone of pb?.leaves ?? []) {
      if (topics.has(gone.id) && !gone.died) continue;
      const died = gone.died || t;
      if (!instant && t - died < DUR.leaf) state.leaves.push({ ...gone, died });
    }
    branches.push(state);
  });

  // removed courses (and ones still retracting from an earlier rebuild)
  for (const gone of prev?.branches ?? []) {
    if (!gone.died && !prevBranches.has(gone.id)) continue;
    const died = gone.died || t;
    if (instant || t - died >= DUR.grow) continue;
    branches.push({ ...gone, died, leaves: gone.leaves.map((l) => ({ ...l, died: l.died || died })) });
  }

  return { instant, branches };
}
