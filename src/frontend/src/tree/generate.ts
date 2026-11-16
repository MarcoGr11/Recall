import type { Branch, Course, Fork, Leaf, Limb, LimbSample, TreeInput, TreePrimitives } from './types';

export const WORLD_W = 1000;
export const WORLD_H = 1400;
export const GROUND_Y = 1300;
export const MAX_SLOTS = 8;

const TRUNK_X = WORLD_W / 2;
const TRUNK_H = 700;
const TIP_TAPER = 42;
const STATIONS_PER_SEGMENT = 8;
const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 4;
const SAMPLES_PER_SEGMENT = 12;
const DEG = Math.PI / 180;

/** FNV-1a, 32 bit. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rngFor = (key: string) => mulberry32(hash(key));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Unit vector for an angle measured clockwise from "up" (screen coordinates, y grows down). */
const dir = (a: number) => ({ x: Math.sin(a), y: -Math.cos(a) });

/**
 * Closed polygon [x0,y0,x1,y1,...] around the first `visible` units of a limb.
 * The tip always tapers to a point, so trimming `visible` 0→length "grows" the limb.
 * `widthScale` thins the whole limb (a young trunk is slimmer).
 */
export function outline(samples: LimbSample[], visible: number, widthScale = 1): number[] {
  'worklet';
  const n = samples.length;
  if (n < 2 || visible <= 0) return [];
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = samples[i];
    const a = samples[i > 0 ? i - 1 : 0];
    const b = samples[i < n - 1 ? i + 1 : n - 1];
    let px = p.x;
    let py = p.y;
    let pw = p.w;
    let pd = p.d;
    const last = pd >= visible;
    if (pd > visible) {
      const k = (visible - a.d) / (pd - a.d);
      px = a.x + (px - a.x) * k;
      py = a.y + (py - a.y) * k;
      pw = a.w + (pw - a.w) * k;
      pd = visible;
    }
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const tl = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= tl;
    ty /= tl;
    const hw = 0.5 * pw * widthScale * Math.min(1, (visible - pd) / TIP_TAPER);
    left.push(px - ty * hw, py + tx * hw);
    right.push(px + ty * hw, py - tx * hw);
    if (last) break;
  }
  for (let i = right.length - 2; i >= 0; i -= 2) left.push(right[i], right[i + 1]);
  return left;
}

function polygonToSvg(pts: number[]): string {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) {
    d += `${i === 0 ? 'M' : 'L'}${pts[i].toFixed(1)} ${pts[i + 1].toFixed(1)}`;
  }
  return d + 'Z';
}

function limb(id: string, pts: { x: number; y: number }[], width: (d: number) => number): Limb {
  let d = 0;
  const samples: LimbSample[] = pts.map((p, i) => {
    if (i > 0) d += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    return { x: p.x, y: p.y, w: width(d), d };
  });
  return { id, samples, length: d, path: polygonToSvg(outline(samples, d)) };
}

function trunkCenter(seed: string, t: number) {
  const r = rngFor(seed + '/trunk');
  const phase = r() * Math.PI * 2;
  const amp = 10 + r() * 12;
  return { x: TRUNK_X + Math.sin(t * 4 + phase) * amp * t, y: GROUND_Y - TRUNK_H * t };
}

function makeTrunk(seed: string): Limb {
  const pts = [];
  for (let i = 0; i <= 28; i++) pts.push(trunkCenter(seed, i / 28));
  return limb('trunk', pts, (d) => {
    const t = d / TRUNK_H;
    return 16 + 46 * Math.pow(Math.max(0, 1 - t), 1.4) + 34 * Math.exp(-t * 14);
  });
}

function makeRoots(seed: string): Limb[] {
  const roots: Limb[] = [];
  for (let i = 0; i < 5; i++) {
    const r = rngFor(`${seed}/root${i}`);
    const side = i % 2 === 0 ? -1 : 1;
    const len = 70 + r() * 70;
    const lift = 10 + r() * 14;
    const x0 = TRUNK_X + side * (6 + i * 3);
    const y0 = GROUND_Y - 14;
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      // quadratic Bézier hugging the ground and diving into it at the end
      const cx = x0 + side * len * 0.45;
      const cy = y0 - lift + 12;
      const ex = x0 + side * len;
      const ey = GROUND_Y + 10;
      pts.push({
        x: (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * ex,
        y: (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * ey,
      });
    }
    const w0 = 16 + r() * 8;
    roots.push(limb(`root-${i}`, pts, (d) => 2 + w0 * Math.max(0, 1 - d / len)));
  }
  return roots;
}

/**
 * Each item takes the first free place of its own probe sequence. Items are processed in
 * creation order, so a newly added item can never move an existing one.
 */
function probe(ids: string[], tierOf: (tier: number) => [start: number, size: number]): number[] {
  const used = new Set<number>();
  return ids.map((id) => {
    const h = hash(id);
    for (let tier = 0; ; tier++) {
      const [start, size] = tierOf(tier);
      for (let r = 0; r < size; r++) {
        // stride 5 is coprime with 8 and 16 — visits every place, spreads neighbours apart
        const s = start + ((h + r * 5) % size);
        if (!used.has(s)) {
          used.add(s);
          return s;
        }
      }
    }
  });
}

/** Branch slot per course. Attach points of different slots are ≥ 52 units apart on the trunk. */
export function assignSlots(courses: Course[]): number[] {
  // ponytail: beyond 8 courses slots are reused (second ring, shifted angle) — branches may overlap
  return probe(courses.map((c) => c.id), (tier) => [tier * MAX_SLOTS, MAX_SLOTS]);
}

/** Leaf station per topic: first two segments (16 stations) fill first, then one segment at a time. */
function assignStations(course: Course): number[] {
  return probe(course.topics.map((t) => `${course.id}/${t.id}`), (tier) =>
    tier === 0 ? [0, 16] : [8 + tier * 8, 8],
  );
}

interface Segment {
  p0: { x: number; y: number };
  c1: { x: number; y: number };
  c2: { x: number; y: number };
  p1: { x: number; y: number };
}

function bezier(s: Segment, t: number) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p1.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p1.y,
  };
}

function bezierTangent(s: Segment, t: number) {
  const u = 1 - t;
  const x = 3 * u * u * (s.c1.x - s.p0.x) + 6 * u * t * (s.c2.x - s.c1.x) + 3 * t * t * (s.p1.x - s.c2.x);
  const y = 3 * u * u * (s.c1.y - s.p0.y) + 6 * u * t * (s.c2.y - s.c1.y) + 3 * t * t * (s.p1.y - s.c2.y);
  return Math.atan2(x, -y); // same convention as dir()
}

/**
 * Segment j depends only on (studentId, course.id, slot, j), so adding a segment extends the
 * tip and leaves the already grown part of the curve untouched.
 */
function branchSegments(seed: string, course: Course, slot: number, count: number): Segment[] {
  const ring = Math.floor(slot / MAX_SLOTS);
  const k = slot % MAX_SLOTS;
  const side = k % 2 === 0 ? -1 : 1;
  const rc = rngFor(course.id);
  const base = (lerp(78, 22, k / (MAX_SLOTS - 1)) + ring * 9) * DEG;
  let tangent = base + (rc() - 0.5) * 6 * DEG;
  let p0 = trunkCenter(seed, 0.4 + 0.075 * k);
  const segments: Segment[] = [];
  for (let j = 0; j < count; j++) {
    const r = rngFor(`${course.id}/seg${j}`);
    const len = (j < 2 ? 130 : 90) * (0.9 + 0.2 * r());
    // wander a little and curl towards the light
    // (bounded around the slot angle, so neighbouring branches cannot cross)
    const next = clamp(tangent + ((r() - 0.5) * 14 - 4) * DEG, base - 12 * DEG, base + 5 * DEG);
    const chord = dir((tangent + next) / 2);
    const p1 = { x: p0.x + side * chord.x * len, y: p0.y + chord.y * len };
    const d0 = dir(tangent);
    const d1 = dir(next);
    segments.push({
      p0,
      c1: { x: p0.x + (side * d0.x * len) / 3, y: p0.y + (d0.y * len) / 3 },
      c2: { x: p1.x - (side * d1.x * len) / 3, y: p1.y - (d1.y * len) / 3 },
      p1,
    });
    p0 = p1;
    tangent = next;
  }
  return segments;
}

function makeLeaf(course: Course, topicId: string, station: number, segments: Segment[], placed: Leaf[]): Leaf {
  const wrapped = station % (MAX_SEGMENTS * STATIONS_PER_SEGMENT);
  const overflow = station !== wrapped;
  const j = Math.floor(wrapped / STATIONS_PER_SEGMENT);
  const i = wrapped % STATIONS_PER_SEGMENT;
  const seg = segments[j];
  const t = j === 0 ? 0.22 + (0.78 * (i + 0.5)) / STATIONS_PER_SEGMENT : (i + 0.5) / STATIONS_PER_SEGMENT;
  const at = bezier(seg, t);
  const r = rngFor(`${course.id}/${topicId}`);
  const sideSign = i % 2 === 0 ? -1 : 1;
  const twigAngle = bezierTangent(seg, t) + sideSign * (40 + 35 * r()) * DEG;
  const twigLen = ((i % 4 < 2 ? 46 : 24) + 22 * r()) * (overflow ? 1.7 : 1);
  const rotation = twigAngle + (r() - 0.5) * 0.9;
  const size = 46 + 14 * r();
  const twig = dir(twigAngle);
  const axis = dir(rotation);

  // Simple distance check against earlier leaves of the same branch (creation order keeps it stable).
  let best: Leaf | null = null;
  let bestDist = -1;
  for (const m of [1, 0.65, 1.35, 0.45, 1.6]) {
    const x = clamp(at.x + twig.x * twigLen * m, 20, WORLD_W - 20);
    const y = clamp(at.y + twig.y * twigLen * m, 20, GROUND_Y - 30);
    const cx = x + axis.x * size * 0.5;
    const cy = y + axis.y * size * 0.5;
    let nearest = Infinity;
    for (const o of placed) {
      nearest = Math.min(
        nearest,
        Math.hypot(cx - (o.x + Math.sin(o.rotation) * o.size * 0.5), cy - (o.y - Math.cos(o.rotation) * o.size * 0.5)),
      );
    }
    if (nearest > bestDist) {
      bestDist = nearest;
      best = { topicId, courseId: course.id, x, y, rotation, size, ax: at.x, ay: at.y };
    }
    if (nearest >= size * 0.7) break;
  }
  return best as Leaf;
}

function makeBranch(seed: string, course: Course, slot: number): { branch: Branch; leaves: Leaf[] } {
  const stations = assignStations(course);
  const needed = stations.reduce((m, s) => Math.max(m, Math.floor(s / STATIONS_PER_SEGMENT) + 1), 0);
  const segments = branchSegments(seed, course, slot, clamp(needed, MIN_SEGMENTS, MAX_SEGMENTS));

  const pts = [segments[0].p0];
  for (const s of segments) {
    for (let k = 1; k <= SAMPLES_PER_SEGMENT; k++) pts.push(bezier(s, k / SAMPLES_PER_SEGMENT));
  }
  const w0 = lerp(22, 11, (slot % MAX_SLOTS) / (MAX_SLOTS - 1));
  // width depends on the distance from the base only → stable when the branch gets longer
  const body = limb(course.id, pts, (d) => 3 + w0 * Math.pow(Math.max(0, 1 - d / 480), 1.1));

  // one decorative fork per segment, so the branch reads as a branch and not as a spike
  let path = body.path;
  const forks: Fork[] = segments.map((seg, j) => {
    const r = rngFor(`${course.id}/fork${j}`);
    const k = 7;
    const from = body.samples[j * SAMPLES_PER_SEGMENT + k];
    const angle = bezierTangent(seg, k / SAMPLES_PER_SEGMENT) + (j % 2 === 0 ? 1 : -1) * (30 + 16 * r()) * DEG;
    const len = 52 + 34 * r();
    const bend = (r() - 0.5) * 0.5;
    const fpts = [];
    for (let i = 0; i <= 6; i++) {
      const d = dir(angle + (bend * i) / 6);
      const prev: { x: number; y: number } = i === 0 ? from : fpts[i - 1];
      fpts.push(i === 0 ? { x: from.x, y: from.y } : { x: prev.x + (d.x * len) / 6, y: prev.y + (d.y * len) / 6 });
    }
    const fork = limb('fork', fpts, (d) => 1.5 + from.w * 0.6 * Math.max(0, 1 - d / len));
    path += fork.path;
    return { at: from.d, samples: fork.samples, length: fork.length };
  });

  const leaves: Leaf[] = [];
  course.topics.forEach((topic, i) => leaves.push(makeLeaf(course, topic.id, stations[i], segments, leaves)));
  return { branch: { ...body, path, courseId: course.id, slot, forks }, leaves };
}

/** Pure, deterministic: the same input always gives the same primitives. Mastery is not used. */
export function generateTree(input: TreeInput): TreePrimitives {
  const slots = assignSlots(input.courses);
  const branches: Branch[] = [];
  const leaves: Leaf[] = [];
  input.courses.forEach((course, i) => {
    const made = makeBranch(input.studentId, course, slots[i]);
    branches.push(made.branch);
    leaves.push(...made.leaves);
  });
  return {
    width: WORLD_W,
    height: WORLD_H,
    groundY: GROUND_Y,
    trunk: makeTrunk(input.studentId),
    roots: makeRoots(input.studentId),
    branches,
    leaves,
  };
}

/** Changes only when ids change — the memoisation key for generateTree. */
export function structureKey(input: TreeInput): string {
  return input.studentId + '|' + input.courses.map((c) => c.id + ':' + c.topics.map((t) => t.id).join(',')).join(';');
}
