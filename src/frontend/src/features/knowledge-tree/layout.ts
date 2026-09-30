/**
 * Knowledge tree layout engine.
 * Pure function: data in -> positions out. No React, no rendering.
 * All coordinates are in "world" units: ground line at y = 0, up is negative y.
 * The renderer (react-native-svg) sets the SVG viewBox from `viewBox`.
 */

export interface TreeMeta {
  trunk: { w: number; h: number; profile: [number, number][]; crownTips: [number, number][]; forkHeight: number };
  branch: { w: number; h: number; centerline: [number, number, number][] };
  foliage: { w: number; h: number }[];
  ground: { w: number; h: number; topEdge: number[] };
}

export interface CourseInput { id: string; topicCount: number }

export interface LeafSlot { x: number; y: number; angleDeg: number; scale: number }

export interface BranchLayout {
  courseId: string;
  side: -1 | 1;
  base: [number, number];
  /** SVG transform string for the branch <Image>, anchored at the image's top-left. */
  transform: string;
  length: number;
  leafSlots: LeafSlot[];
  label: { x: number; y: number; anchor: "start" | "end" };
}

export interface FoliageSprite { x: number; y: number; size: number; sprite: number; flip: boolean; layer: "back" | "mid" | "front" }

export interface TreeLayout {
  viewBox: { x: number; y: number; width: number; height: number };
  trunk: { x: number; y: number; width: number; height: number };
  ground: { x: number; y: number; width: number; height: number };
  branches: BranchLayout[];
  trunkLeafSlots: LeafSlot[];
  foliage: FoliageSprite[];
  /** Points in the crown where falling leaves may detach from. */
  fallOrigins: [number, number][];
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function rng(seed: number) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647, (s - 1) / 2147483646);
}

export function computeTreeLayout(courses: CourseInput[], trunkTopicCount: number, meta: TreeMeta): TreeLayout {
  const N = courses.length;
  const Ht = clamp(460 + N * 32, 500, 780);
  const TW = Ht * meta.trunk.w / meta.trunk.h;
  const prof = (h: number) => meta.trunk.profile[clamp(Math.round(h * 100), 0, 100)];
  const tx = (f: number) => -TW / 2 + f * TW;
  const rootSink = Ht * 0.02;

  const line = meta.branch.centerline, BW = meta.branch.w, by = line[0][1] * BW;
  const a0 = Math.atan2((line[line.length - 1][1] - line[0][1]) * BW, BW);
  const lenBase = clamp(330 * Math.sqrt(3 / Math.max(N, 1)), 170, 340);
  const attachTop = meta.trunk.forkHeight - 0.04;

  const bounds = { x0: -TW * 0.7, x1: TW * 0.7, y0: -Ht - 60, y1: 20 };
  const grow = (x: number, y: number, pad = 0) => {
    bounds.x0 = Math.min(bounds.x0, x - pad); bounds.x1 = Math.max(bounds.x1, x + pad);
    bounds.y0 = Math.min(bounds.y0, y - pad); bounds.y1 = Math.max(bounds.y1, y + pad);
  };

  const branches: BranchLayout[] = courses.map((c, i) => {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const frac = N > 1 ? i / (N - 1) : 0.5;
    const h = 0.3 + (attachTop - 0.3) * frac;
    const pr = prof(h), wRow = (pr[1] - pr[0]) * TW;
    const base: [number, number] = [side < 0 ? tx(pr[0]) + wRow * 0.3 : tx(pr[1]) - wRow * 0.3, -h * Ht + rootSink];
    const ang = (10 + 42 * frac) * Math.PI / 180;
    const L = lenBase * (1 - 0.2 * frac);
    const sc = L / BW, k = clamp(280 / L, 1, 1.45), th = -ang - a0;
    const cos = Math.cos(th), sin = Math.sin(th);
    const map = (u: number, v: number): [number, number] => {
      const x0 = u * BW * sc, y0 = (v * BW - by) * sc * k;
      return [base[0] + side * (x0 * cos - y0 * sin), base[1] + (x0 * sin + y0 * cos)];
    };
    const at = (t: number) => {
      const f = clamp(t, 0, 1) * (line.length - 1), i0 = Math.floor(f), i1 = Math.min(line.length - 1, i0 + 1), r = f - i0;
      const [u0, v0, w0] = line[i0], [u1, v1, w1] = line[i1];
      return { p: map(u0 + (u1 - u0) * r, v0 + (v1 - v0) * r), w: (w0 + (w1 - w0) * r) * BW * sc * k };
    };

    const M = c.topicCount;
    const leafScale = clamp(1.05 - Math.max(0, M - 5) * 0.06, 0.6, 1.05) * clamp(L / 260, 0.75, 1.05);
    const leafSlots: LeafSlot[] = [];
    for (let k2 = 0; k2 < M; k2++) {
      const tt = M === 1 ? 0.98 : 0.26 + 0.72 * k2 / (M - 1);
      const A = at(tt), B = at(Math.min(1, tt + 0.02)), C = at(Math.max(0, tt - 0.02));
      const dx = B.p[0] - C.p[0], dy = B.p[1] - C.p[1], dl = Math.hypot(dx, dy) || 1;
      const tg = [dx / dl, dy / dl], nv = [-tg[1], tg[0]];
      if (k2 === M - 1) { leafSlots.push({ x: A.p[0], y: A.p[1], angleDeg: Math.atan2(tg[1], tg[0]) * 180 / Math.PI, scale: leafScale }); continue; }
      const s = k2 % 2 ? 1 : -1, off = A.w * 0.45 + 4;
      leafSlots.push({
        x: A.p[0] + nv[0] * s * off, y: A.p[1] + nv[1] * s * off,
        angleDeg: Math.atan2(nv[1] * s * 0.8 + tg[1] * 0.6, nv[0] * s * 0.8 + tg[0] * 0.6) * 180 / Math.PI,
        scale: leafScale,
      });
    }

    const tip = at(1).p, pre = at(0.95).p;
    const d = [tip[0] - pre[0], tip[1] - pre[1]], dl = Math.hypot(d[0], d[1]) || 1, reach = 44 * leafScale + 16;
    const label = { x: tip[0] + d[0] / dl * reach + side * 6, y: tip[1] + d[1] / dl * reach - 10, anchor: (side < 0 ? "end" : "start") as "start" | "end" };
    grow(tip[0], tip[1], 40); grow(label.x + side * 190, label.y - 18); grow(label.x, label.y + 24);

    const transform = `translate(${base[0].toFixed(1)} ${base[1].toFixed(1)}) scale(${side} 1) rotate(${(th * 180 / Math.PI).toFixed(2)}) scale(${sc.toFixed(4)} ${(sc * k).toFixed(4)}) translate(0 ${(-by).toFixed(1)})`;
    return { courseId: c.id, side, base, transform, length: L, leafSlots, label, _at: at } as BranchLayout & { _at: typeof at };
  });

  /* foliage: hull of branch tips + crown tips, filled with clumps */
  const rand = rng(5 + N * 131);
  const crownPts: [number, number][] = meta.trunk.crownTips.map(([u, v]) => [tx(u), -v * Ht + rootSink]);
  const hullSrc: [number, number][] = [...crownPts.map(([x, y]) => [x, y - 40] as [number, number])];
  branches.forEach(b => { const at = (b as any)._at; const e = at(1).p; hullSrc.push([e[0], e[1] - 30], at(0.45).p); });
  const hull = convexHull(hullSrc);
  const cx = hull.reduce((a, p) => a + p[0], 0) / hull.length, cy = hull.reduce((a, p) => a + p[1], 0) / hull.length;
  const shrunk = hull.map(([x, y]) => [cx + (x - cx) * 0.9, cy + (y - cy) * 0.9] as [number, number]);
  const lowY = Math.min(...branches.map(b => b.base[1]), -Ht * attachTop) - 20;
  const foliage: FoliageSprite[] = [];
  const xs = hull.map(p => p[0]), ys = hull.map(p => p[1]);
  let n = 0;
  for (let y = Math.min(...ys); y < Math.max(lowY, Math.min(...ys) + 1); y += 62)
    for (let x = Math.min(...xs); x < Math.max(...xs); x += 70) {
      const jx = x + (rand() - 0.5) * 26, jy = y + (rand() - 0.5) * 20;
      if (pointInPolygon(jx, jy, shrunk)) { const r = 58 + rand() * 18; foliage.push({ x: jx, y: jy, size: 2 * r, sprite: n % meta.foliage.length, flip: n % 3 === 0, layer: "back" }); grow(jx, jy, r); n++; }
    }
  branches.forEach((b, i) => {
    const at = (b as any)._at, cs = clamp(b.length / 280, 0.65, 1.1);
    [0.35, 0.58, 0.8, 1.02].forEach((t, j) => { const p = at(Math.min(t, 1)).p, r = (44 + 16 * t) * cs;
      foliage.push({ x: p[0] + b.side * 6, y: p[1] - 30 * cs, size: 2 * r, sprite: (i * 5 + j) % meta.foliage.length, flip: (i + j) % 2 === 0, layer: "mid" }); });
  });
  crownPts.forEach(([x, y], j) => { const r = 52 * clamp(TW / 420, 0.8, 1.3); foliage.push({ x, y: y - 10, size: 2 * r, sprite: (20 + j) % meta.foliage.length, flip: j % 2 === 0, layer: "front" }); grow(x, y, r); });

  /* flagship topics on the lower trunk */
  const avgScale = branches.length ? Math.min(1, branches.reduce((a, b) => a + b.leafSlots[0]?.scale || 0, 0) / branches.length) : 1;
  const trunkLeafSlots: LeafSlot[] = Array.from({ length: trunkTopicCount }, (_, k) => {
    const h = 0.12 + 0.2 * (trunkTopicCount > 1 ? k / (trunkTopicCount - 1) : 0.5), s = k % 2 ? 1 : -1, pr = prof(h);
    return { x: s < 0 ? tx(pr[0]) + 8 : tx(pr[1]) - 8, y: -h * Ht + rootSink, angleDeg: s > 0 ? -24 : 204, scale: avgScale };
  });

  branches.forEach(b => delete (b as any)._at);
  grow(-TW / 2, 0); grow(TW / 2, 0);
  const W = bounds.x1 - bounds.x0;
  const groundW = W + 200, groundH = groundW * meta.ground.h / meta.ground.w;
  return {
    viewBox: { x: bounds.x0 - 30, y: bounds.y0 - 20, width: W + 60, height: bounds.y1 - bounds.y0 + groundH * 0.5 },
    trunk: { x: -TW / 2, y: -Ht + rootSink, width: TW, height: Ht },
    ground: { x: bounds.x0 - 100, y: -groundH * Math.min(...meta.ground.topEdge.slice(18, 23)) - rootSink * 0.5, width: groundW, height: groundH },
    branches,
    trunkLeafSlots,
    foliage,
    fallOrigins: foliage.filter(f => f.layer !== "back").map(f => [f.x, f.y] as [number, number]),
  };
}

function convexHull(points: [number, number][]): [number, number][] {
  const P = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of P.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}

function pointInPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
