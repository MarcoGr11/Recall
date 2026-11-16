import {
  BlendMode,
  BlurStyle,
  PaintStyle,
  Skia,
  StrokeCap,
  TileMode,
  type SkCanvas,
  type SkPaint,
  type SkPath,
} from '@shopify/react-native-skia';

import { outline } from './generate';
import { masteryColor } from './mastery';
import { DUR, progress, shownMastery, trunkLength, visibleLength, type LeafState, type Scene } from './scene';
import type { TreePrimitives } from './types';

export interface Resources {
  groundY: number;
  leaf: SkPath;
  /** Shaded lower half and the veins of the unit leaf. */
  half: SkPath;
  veins: SkPath;
  bark: SkPaint;
  grain: SkPaint;
  edge: SkPaint;
  shade: SkPaint;
  fill: SkPaint;
  vein: SkPaint;
  twig: SkPaint;
  glow: SkPaint;
  canopy: SkPaint;
  dot: SkPaint;
  roots: SkPath[];
  /** Cached outlines of fully grown branches, keyed by course id. */
  full: Record<string, { path: SkPath; length: number }>;
}

const rgba = (r: number, g: number, b: number, a = 1) => Float32Array.of(r, g, b, a);
const svg = (d: string) => Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();

/** Paints and shaders shared by every frame. Created once on the JS thread. */
export function createPaints() {
  const bark = Skia.Paint();
  bark.setAntiAlias(true);
  bark.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 0, y: 1300 },
      { x: 0, y: 200 },
      [rgba(0.24, 0.15, 0.1), rgba(0.42, 0.28, 0.18), rgba(0.55, 0.4, 0.27)],
      [0, 0.45, 1],
      TileMode.Clamp,
    ),
  );

  // light bark noise: fractal noise turned into dark, semi-transparent speckles
  const grain = Skia.Paint();
  grain.setAntiAlias(true);
  grain.setShader(Skia.Shader.MakeFractalNoise(0.22, 0.05, 3, 7, 0, 0));
  // prettier-ignore
  grain.setColorFilter(Skia.ColorFilter.MakeMatrix([
    0, 0, 0, 0, 0.08,
    0, 0, 0, 0, 0.04,
    0, 0, 0, 0, 0.02,
    1.5, 0, 0, 0, -0.5,
  ]));

  const edge = Skia.Paint();
  edge.setAntiAlias(true);
  edge.setStyle(PaintStyle.Stroke);
  edge.setStrokeWidth(1.6);
  edge.setColor(rgba(0.16, 0.09, 0.05, 0.55));

  // cylindrical shading across the trunk
  const shade = Skia.Paint();
  shade.setAntiAlias(true);
  shade.setBlendMode(BlendMode.Multiply);
  shade.setShader(
    Skia.Shader.MakeLinearGradient(
      { x: 440, y: 0 },
      { x: 560, y: 0 },
      [rgba(0.45, 0.4, 0.4), rgba(1, 1, 1), rgba(1, 0.98, 0.92), rgba(0.55, 0.5, 0.5)],
      [0, 0.4, 0.6, 1],
      TileMode.Clamp,
    ),
  );

  const fill = Skia.Paint();
  fill.setAntiAlias(true);

  const vein = Skia.Paint();
  vein.setAntiAlias(true);
  vein.setStyle(PaintStyle.Stroke);
  vein.setStrokeWidth(0.028);
  vein.setStrokeCap(StrokeCap.Round);

  const twig = Skia.Paint();
  twig.setAntiAlias(true);
  twig.setStyle(PaintStyle.Stroke);
  twig.setStrokeWidth(2.4);
  twig.setStrokeCap(StrokeCap.Round);
  twig.setColor(rgba(0.36, 0.24, 0.15));

  const glow = Skia.Paint();
  glow.setAntiAlias(true);
  glow.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 9, true));

  const canopy = Skia.Paint();
  canopy.setAntiAlias(true);
  canopy.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 22, true));

  const dot = Skia.Paint();
  dot.setAntiAlias(true);

  return { bark, grain, edge, shade, fill, vein, twig, glow, canopy, dot };
}

export function createResources(prims: TreePrimitives, paints: ReturnType<typeof createPaints>): Resources {
  const full: Resources['full'] = {};
  for (const b of prims.branches) full[b.id] = { path: svg(b.path), length: b.length };
  return {
    ...paints,
    groundY: prims.groundY,
    // unit leaf: base at (0,0), tip at (1,0)
    leaf: svg('M0 0C0.1 -0.2 0.3 -0.36 0.55 -0.3C0.78 -0.24 0.92 -0.1 1 0C0.92 0.1 0.78 0.24 0.55 0.3C0.3 0.36 0.1 0.2 0 0Z'),
    half: svg('M0 0L1 0C0.92 0.1 0.78 0.24 0.55 0.3C0.3 0.36 0.1 0.2 0 0Z'),
    veins: svg('M0.04 0L0.95 0M0.24 0L0.4 -0.2M0.24 0L0.4 0.2M0.45 0L0.6 -0.19M0.45 0L0.6 0.19M0.66 0L0.78 -0.13M0.66 0L0.78 0.13'),
    roots: prims.roots.map((r) => svg(r.path)),
    full,
  };
}

function easeOutBack(p: number): number {
  'worklet';
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}

function drawLimb(canvas: SkCanvas, path: SkPath, r: Resources) {
  'worklet';
  canvas.drawPath(path, r.bark);
  canvas.drawPath(path, r.grain);
  canvas.drawPath(path, r.edge);
}

function drawLeafShape(
  canvas: SkCanvas,
  r: Resources,
  x: number,
  y: number,
  rot: number,
  size: number,
  mastery: number,
  alpha: number,
) {
  'worklet';
  const c = masteryColor(mastery);
  canvas.save();
  canvas.translate(x, y);
  canvas.rotate((rot * 180) / Math.PI - 90, 0, 0);
  canvas.scale(size, size);
  r.fill.setColor(Float32Array.of(c[0], c[1], c[2], alpha));
  canvas.drawPath(r.leaf, r.fill);
  r.fill.setColor(Float32Array.of(c[0] * 0.62, c[1] * 0.68, c[2] * 0.5, alpha * 0.5));
  canvas.drawPath(r.half, r.fill);
  r.vein.setColor(Float32Array.of(c[0] * 0.42, c[1] * 0.45, c[2] * 0.36, alpha * 0.75));
  canvas.drawPath(r.veins, r.vein);
  canvas.restore();
}

function drawLeaf(canvas: SkCanvas, r: Resources, l: LeafState, t: number, scene: Scene, twigs: boolean) {
  'worklet';
  const instant = scene.instant;
  if (!instant && t < l.born) return;
  const open = progress(t, l.born, DUR.leaf, instant);
  const alive = l.died ? 1 - progress(t, l.died, DUR.leaf, instant) : 1;
  if (alive <= 0) return;
  const reach = Math.min(1, open * 3) * alive;
  const x = l.ax + (l.x - l.ax) * reach;
  const y = l.ay + (l.y - l.ay) * reach;

  if (twigs) {
    canvas.drawLine(l.ax, l.ay, x, y, r.twig);
    return;
  }

  // the bud the leaf opens from (and what stays after it falls)
  r.dot.setColor(Float32Array.of(0.45, 0.36, 0.16, 1));
  canvas.drawCircle(x, y, 3.6 * alive, r.dot);
  if (l.fallen) return;

  const flutter = instant ? 0 : Math.sin(t * 0.0031 + l.phase) * 0.09 + Math.sin(t * 0.0013 + l.phase * 1.7) * 0.05;
  const size = l.size * (0.14 + 0.86 * easeOutBack(open)) * alive;
  const rot = l.rot + flutter - (1 - open) * 0.9;
  if (l.due && open >= 1) {
    const pulse = instant ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0035 + l.phase);
    r.glow.setColor(Float32Array.of(1, 0.95, 0.55, 0.3 + 0.3 * pulse));
    canvas.drawCircle(x + Math.sin(rot) * size * 0.5, y - Math.cos(rot) * size * 0.5, size * (0.48 + 0.08 * pulse), r.glow);
  }
  drawLeafShape(canvas, r, x, y, rot, size, shownMastery(l, t, instant), 1);
}

/** Records one frame of the tree. Runs on the UI thread; `t` is the animation clock in ms. */
export function drawTree(canvas: SkCanvas, scene: Scene, r: Resources, t: number) {
  'worklet';
  const instant = scene.instant;
  const tall = trunkLength(scene, t);
  const samples = scene.trunk.samples;
  const full = samples.length ? samples[samples.length - 1].d : 1;
  // a young tree has a slimmer trunk
  const young = 0.4 + 0.6 * Math.min(1, tall / full);
  if (samples.length) {
    // roots shrink towards the trunk base together with it
    canvas.save();
    canvas.translate(samples[0].x * (1 - young), r.groundY * (1 - young));
    canvas.scale(young, young);
    for (let i = 0; i < r.roots.length; i++) drawLimb(canvas, r.roots[i], r);
    canvas.restore();
  }
  const flatTrunk = outline(samples, tall, young);
  const trunkPts = [];
  for (let k = 0; k < flatTrunk.length; k += 2) trunkPts.push({ x: flatTrunk[k], y: flatTrunk[k + 1] });
  if (trunkPts.length > 0) {
    const trunk = Skia.Path.Polygon(trunkPts, true);
    drawLimb(canvas, trunk, r);
    canvas.drawPath(trunk, r.shade);
    trunk.dispose();
  }
  let alive = 0;
  for (let i = 0; i < scene.branches.length; i++) if (!scene.branches[i].died) alive++;
  if (alive === 0 && trunkPts.length > 0) {
    // sapling: two fresh leaves on the tip (the tip is the middle vertex of the outline)
    const tip = trunkPts[trunkPts.length >> 1];
    const wave = instant ? 0 : Math.sin(t * 0.002) * 0.08;
    drawLeafShape(canvas, r, tip.x, tip.y + 6, -0.95 + wave, 52, 1, 1);
    drawLeafShape(canvas, r, tip.x, tip.y + 6, 0.8 + wave, 46, 0.92, 1);
  }

  for (let i = 0; i < scene.branches.length; i++) {
    const b = scene.branches[i];
    const visible = visibleLength(b, t, instant);
    const sway = instant ? 0 : Math.sin(t * 0.0011 + b.phase) * 0.9 + Math.sin(t * 0.0024 + b.phase * 2.3) * 0.4;
    canvas.save();
    canvas.rotate(sway, b.samples[0].x, b.samples[0].y);

    // soft canopy clumps behind the branch, tinted by the average mastery of its leaves
    if (b.lush > 0 && !b.died) {
      const c = masteryColor(b.tone);
      const n = b.samples.length - 1;
      for (let k = 0; k < 4; k++) {
        const s = b.samples[Math.round(n * (0.34 + 0.22 * k))];
        if (s.d > visible) break;
        const breathe = instant ? 1 : 1 + 0.025 * Math.sin(t * 0.0016 + b.phase + k * 1.9);
        const rad = (74 + 20 * (k % 2)) * b.lush * breathe;
        r.canopy.setColor(Float32Array.of(c[0] * 0.6, c[1] * 0.8, c[2] * 0.5, 0.3));
        canvas.drawCircle(s.x, s.y - 20, rad, r.canopy);
      }
    }
    for (let k = 0; k < b.leaves.length; k++) drawLeaf(canvas, r, b.leaves[k], t, scene, true);

    const cached = r.full[b.id];
    if (!b.died && cached && cached.length === b.to && visible >= b.to) {
      drawLimb(canvas, cached.path, r);
    } else if (visible > 0) {
      // growing / retracting: trim the outline to the visible length
      const flat = outline(b.samples, visible);
      const pts = [];
      for (let k = 0; k < flat.length; k += 2) pts.push({ x: flat[k], y: flat[k + 1] });
      const path = Skia.Path.Polygon(pts, true);
      drawLimb(canvas, path, r);
      path.dispose();
      for (let f = 0; f < b.forks.length; f++) {
        const fork = b.forks[f];
        const reach = Math.min(fork.length, visible - fork.at);
        if (reach <= 0) continue;
        const ff = outline(fork.samples, reach);
        const fp = [];
        for (let k = 0; k < ff.length; k += 2) fp.push({ x: ff[k], y: ff[k + 1] });
        const forkPath = Skia.Path.Polygon(fp, true);
        drawLimb(canvas, forkPath, r);
        forkPath.dispose();
      }
    }

    for (let k = 0; k < b.leaves.length; k++) drawLeaf(canvas, r, b.leaves[k], t, scene, false);
    canvas.restore();
  }

  if (instant) return;
  // leaves that are falling right now: sway down to the ground and fade out
  for (let i = 0; i < scene.branches.length; i++) {
    const leaves = scene.branches[i].leaves;
    for (let k = 0; k < leaves.length; k++) {
      const l = leaves[k];
      if (!l.fallen || l.died) continue;
      const q = (t - l.fellAt) / DUR.fall;
      if (q < 0 || q >= 1) continue;
      const x = l.x + Math.sin(q * 9 + l.phase) * 34 * q;
      const y = l.y + (r.groundY - 8 - l.y) * q * q;
      const rot = l.rot + Math.sin(q * 11 + l.phase) * 0.9 + q * 1.6;
      drawLeafShape(canvas, r, x, y, rot, l.size, shownMastery(l, t, false), q > 0.8 ? (1 - q) / 0.2 : 1);
    }
  }
}

function rand(i: number, salt: number): number {
  'worklet';
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Fireflies (evening, night) or pollen (morning, day), in screen space. Stateless: positions are functions of time. */
export function drawParticles(
  canvas: SkCanvas,
  r: Pick<Resources, 'glow' | 'dot'>,
  fireflies: boolean,
  t: number,
  w: number,
  h: number,
  horizon: number,
) {
  'worklet';
  for (let i = 0; i < 26; i++) {
    const fx = rand(i, 1);
    const fy = rand(i, 2);
    const fz = rand(i, 3);
    if (fireflies) {
      const x = w * (fx + 0.07 * Math.sin(t * 0.0004 * (1 + fz) + i));
      const y = horizon - h * 0.5 * fy + 22 * Math.sin(t * 0.0007 + i * 2.1);
      const a = Math.max(0, Math.sin(t * 0.003 * (0.5 + fz) + i * 1.7));
      r.glow.setColor(Float32Array.of(1, 0.95, 0.45, 0.55 * a));
      canvas.drawCircle(x, y, 7, r.glow);
      r.dot.setColor(Float32Array.of(1, 1, 0.75, a));
      canvas.drawCircle(x, y, 1.8, r.dot);
    } else {
      const x = ((fx * w + t * 0.014 * (0.4 + fz)) % (w + 40)) - 20;
      const y = h * (0.12 + 0.62 * fy) + 16 * Math.sin(t * 0.0009 + i * 1.3);
      r.dot.setColor(Float32Array.of(1, 1, 0.86, 0.25 + 0.3 * fz));
      canvas.drawCircle(x, y, 1.2 + fz, r.dot);
    }
  }
}
