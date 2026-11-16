import { PaintStyle, Skia, StrokeCap, StrokeJoin, type SkCanvas, type SkPaint, type SkPath, type SkRect } from '@shopify/react-native-skia';

import type { Theme } from '../theme';

export const SCENE_W = 280;
export const SCENE_H = 200;
/** Clock time (seconds) of the still frame shown when reduce-motion is on. */
export const STILL = 1.4;

export const KINDS = ['offline', 'empty-courses', 'empty-plan', 'empty-drafts', 'session', 'forbidden', 'rate-limit', 'test-done', 'loading'] as const;
export type SceneKind = (typeof KINDS)[number];

/** Screen-reader description of each scene. */
export const SCENE_LABEL: Record<SceneKind, string> = {
  offline: 'Деревце під дощовою хмарою, що закрила небо: немає з’єднання',
  'empty-courses': 'Насінина в землі, з якої пробивається паросток: курсів ще немає',
  'empty-plan': 'Спокійне зелене дерево з гойдалкою на гілці: на сьогодні все повторено',
  'empty-drafts': 'Порожній кошик під деревом: чернеток немає',
  session: 'Ніч, місяць і дерево, що спить: сесія завершилась',
  forbidden: 'Дерев’яний паркан із хвірткою перед деревом: немає доступу',
  'rate-limit': 'Лійка, з якої переливається вода, і пісочний годинник: забагато запитів, зачекайте',
  'test-done': 'Розпускається квітка і падають золоті листки: тест завершено',
  loading: 'Паросток росте по колу: завантаження',
};

/** Paints and static paths of one theme. Everything is created once; a frame only issues draw calls. */
export interface SceneKit {
  ink: SkPaint;
  inkFill: SkPaint;
  /** Ink stroke whose alpha is changed per draw (Zzz, rain). */
  fade: SkPaint;
  soft: SkPaint;
  softLine: SkPaint;
  postEdge: SkPaint;
  accent: SkPaint;
  accentSoft: SkPaint;
  accentLine: SkPaint;
  gold: SkPaint;
  hillFar: SkPaint;
  hillMid: SkPaint;
  ground: SkPaint;
  orb: SkPaint;
  star: SkPaint;
  bg: SkPaint;
  far: SkPath;
  mid: SkPath;
  soil: SkPath;
  soilLine: SkPath;
  leafL: SkPath;
  leafM: SkPath;
  leafS: SkPath;
  basket: SkPath;
  handle: SkPath;
  can: SkPath;
  canHandle: SkPath;
  glass: SkPath;
  ring: SkRect;
}

function leafPath(size: number): SkPath {
  const b = Skia.PathBuilder.Make();
  b.moveTo(0, 0);
  b.cubicTo(-0.55 * size, -0.25 * size, -0.5 * size, -0.8 * size, 0, -size);
  b.cubicTo(0.5 * size, -0.8 * size, 0.55 * size, -0.25 * size, 0, 0);
  b.close();
  return b.build();
}

function poly(points: number[], close = true): SkPath {
  const b = Skia.PathBuilder.Make();
  b.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) b.lineTo(points[i], points[i + 1]);
  if (close) b.close();
  return b.build();
}

export function createSceneKit(t: Theme): SceneKit {
  const fill = (color: string, alpha = 1) => {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    p.setColor(Skia.Color(color));
    p.setAlphaf(alpha);
    return p;
  };
  const stroke = (color: string, width = 2) => {
    const p = fill(color);
    p.setStyle(PaintStyle.Stroke);
    p.setStrokeWidth(width);
    p.setStrokeCap(StrokeCap.Round);
    p.setStrokeJoin(StrokeJoin.Round);
    return p;
  };
  const hill = (y0: number, c: number[], close: boolean) => {
    const b = Skia.PathBuilder.Make();
    b.moveTo(0, y0);
    for (let i = 0; i < c.length; i += 6) b.cubicTo(c[i], c[i + 1], c[i + 2], c[i + 3], c[i + 4], c[i + 5]);
    if (close) {
      b.lineTo(SCENE_W, SCENE_H);
      b.lineTo(0, SCENE_H);
      b.close();
    }
    return b.build();
  };
  const soil = [70, 166, 210, 166, SCENE_W, 176];
  const handle = Skia.PathBuilder.Make();
  handle.moveTo(-18, -22);
  handle.quadTo(0, -50, 18, -22);
  const canHandle = Skia.PathBuilder.Make();
  canHandle.moveTo(-20, -10);
  canHandle.quadTo(-38, 0, -20, 10);
  return {
    ink: stroke(t.onSurface),
    inkFill: fill(t.onSurface),
    fade: stroke(t.onSurface),
    soft: fill(t.surfaceVariant),
    softLine: stroke(t.surfaceVariant, 6),
    postEdge: stroke(t.onSurface, 10),
    accent: fill(t.primary),
    accentSoft: fill(t.primaryContainer),
    accentLine: stroke(t.primary),
    gold: fill(t.mastery50),
    hillFar: fill(t.sceneHillFar),
    hillMid: fill(t.sceneHillMid),
    ground: fill(t.sceneHillNear),
    orb: fill(t.sceneOrb),
    star: fill(t.sceneStar),
    bg: fill(t.background),
    far: hill(150, [60, 110, 110, 105, 160, 128, 200, 146, 240, 120, SCENE_W, 112], true),
    mid: hill(166, [70, 140, 150, 150, 200, 160, 240, 168, 262, 158, SCENE_W, 154], true),
    soil: hill(176, soil, true),
    soilLine: hill(176, soil, false),
    leafL: leafPath(18),
    leafM: leafPath(12),
    leafS: leafPath(8),
    basket: poly([-22, -22, 22, -22, 16, 0, -16, 0]),
    handle: handle.build(),
    can: poly([-20, -14, 18, -14, 18, 14, -20, 14]),
    canHandle: canHandle.build(),
    glass: poly([-14, -26, 14, -26, 0, 0, 14, 26, -14, 26, 0, 0]),
    ring: Skia.XYWHRect(102, 50, 76, 76),
  };
}

// ---- helpers (all run on the UI thread) ----

const STARS = [22, 30, 64, 58, 98, 22, 132, 44, 166, 16, 248, 70, 262, 26, 40, 84];
const CROWN = [-18, -58, 15, 16, -64, 16, 0, -78, 21];
const CLOUD = [176, 64, 14, 196, 54, 18, 217, 64, 13, 196, 68, 14];

/** Union of circles with one outline: ink discs first, then the fill 2 px smaller. `pts` = [x, y, r, …]. */
function blob(c: SkCanvas, k: SceneKit, pts: number[], fill: SkPaint) {
  'worklet';
  for (let i = 0; i < pts.length; i += 3) c.drawCircle(pts[i], pts[i + 1], pts[i + 2] + 2, k.inkFill);
  for (let i = 0; i < pts.length; i += 3) c.drawCircle(pts[i], pts[i + 1], pts[i + 2], fill);
}

function leaf(c: SkCanvas, k: SceneKit, path: SkPath, x: number, y: number, deg: number, fill: SkPaint) {
  'worklet';
  c.save();
  c.translate(x, y);
  c.rotate(deg, 0, 0);
  c.drawPath(path, fill);
  c.drawPath(path, k.ink);
  c.restore();
}

function backdrop(c: SkCanvas, k: SceneKit, orbX: number, orbY: number, orbR: number) {
  'worklet';
  for (let i = 0; i < STARS.length; i += 2) c.drawCircle(STARS[i], STARS[i + 1], 1.3, k.star);
  if (orbR > 0) c.drawCircle(orbX, orbY, orbR, k.orb);
  c.drawPath(k.far, k.hillFar);
  c.drawPath(k.mid, k.hillMid);
  c.drawPath(k.soil, k.ground);
  c.drawPath(k.soilLine, k.ink);
}

/** Line-art tree rooted at (x, y): `sway` tilts the crown (degrees), `fold` < 1 squashes it (sleeping tree). */
function tree(c: SkCanvas, k: SceneKit, x: number, y: number, s: number, sway: number, fold = 1) {
  'worklet';
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.drawLine(0, 0, 0, -58, k.ink);
  c.rotate(sway, 0, -30);
  c.drawLine(0, -30, -16, -48, k.ink);
  c.drawLine(0, -38, 15, -54, k.ink);
  c.translate(0, -58);
  c.scale(1, fold);
  c.translate(0, 58);
  blob(c, k, CROWN, k.accentSoft);
  c.drawCircle(-8, -80, 3, k.accent);
  c.drawCircle(10, -66, 3, k.accent);
  c.drawCircle(-20, -58, 2.5, k.accent);
  c.restore();
}

function sprout(c: SkCanvas, k: SceneKit, x: number, y: number, grow: number) {
  'worklet';
  if (grow <= 0.02) return;
  c.save();
  c.translate(x, y);
  c.scale(grow, grow);
  c.drawLine(0, 0, 0, -26, k.ink);
  leaf(c, k, k.leafL, 0, -24, -52, k.accentSoft);
  leaf(c, k, k.leafM, 0, -26, 48, k.accent);
  c.restore();
}

const ease = (p: number) => {
  'worklet';
  const q = p < 0 ? 0 : p > 1 ? 1 : p;
  return q * q * (3 - 2 * q);
};

/** Draws one frame of a 280×200 state scene; `t` is the clock in seconds. */
export function drawScene(c: SkCanvas, kind: SceneKind, k: SceneKit, t: number) {
  'worklet';
  const wind = Math.sin(t * 1.3);
  if (kind === 'offline') {
    backdrop(c, k, 216, 42, 15);
    tree(c, k, 92, 172, 1, 5 + 3 * Math.sin(t * 2.1));
    blob(c, k, CLOUD, k.soft);
    for (let i = 0; i < 6; i++) {
      const p = (t * 1.3 + i * 0.37) % 1;
      const x = 172 + i * 10;
      const y = 86 + p * 56;
      k.fade.setAlphaf(1 - p);
      c.drawLine(x, y, x - 3, y + 8, k.fade);
    }
  } else if (kind === 'empty-courses') {
    backdrop(c, k, 216, 48, 14);
    c.drawLine(128, 169, 134, 164, k.ink);
    c.drawLine(152, 169, 146, 164, k.ink);
    blob(c, k, [140, 184, 5], k.gold);
    const p = (t % 5) / 5;
    sprout(c, k, 140, 167, p < 0.45 ? ease(p / 0.45) : p < 0.85 ? 1 : 1 - ease((p - 0.85) / 0.15));
  } else if (kind === 'empty-plan') {
    backdrop(c, k, 220, 44, 15);
    c.drawLine(112, 118, 178, 110, k.ink);
    tree(c, k, 112, 172, 1.15, 2 * wind);
    c.save();
    c.rotate(9 * Math.sin(t * 1.2), 160, 112);
    c.drawLine(151, 113, 151, 148, k.ink);
    c.drawLine(169, 111, 169, 148, k.ink);
    c.drawLine(146, 148, 174, 148, k.accentLine);
    c.restore();
  } else if (kind === 'empty-drafts') {
    backdrop(c, k, 214, 46, 14);
    tree(c, k, 88, 172, 1.05, 2.5 * wind);
    c.save();
    c.translate(178, 172);
    c.drawPath(k.handle, k.ink);
    c.drawPath(k.basket, k.soft);
    c.drawPath(k.basket, k.ink);
    c.drawLine(-20, -13, 20, -13, k.ink);
    c.drawLine(-9, -22, -7, 0, k.ink);
    c.drawLine(9, -22, 7, 0, k.ink);
    c.restore();
    const p = (t % 6) / 6;
    if (p < 0.9) leaf(c, k, k.leafM, 112 + p * 34 + 7 * Math.sin(p * 13), 78 + p * 100, t * 70, k.gold);
  } else if (kind === 'session') {
    backdrop(c, k, 0, 0, 0);
    c.drawCircle(206, 50, 16, k.orb);
    c.drawCircle(214, 44, 14, k.bg);
    tree(c, k, 108, 172, 1.05, 0.6 * wind, 0.72);
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.3 + i / 3) % 1;
      const s = 5 + p * 7;
      const x = 138 + p * 30;
      const y = 104 - p * 50;
      k.fade.setAlphaf(Math.sin(Math.PI * p));
      c.drawLine(x, y, x + s, y, k.fade);
      c.drawLine(x + s, y, x, y + s, k.fade);
      c.drawLine(x, y + s, x + s, y + s, k.fade);
    }
    for (let i = 0; i < 4; i++) {
      k.gold.setAlphaf(0.35 + 0.65 * Math.abs(Math.sin(t * 1.1 + i * 1.7)));
      c.drawCircle(52 + i * 58 + 5 * Math.sin(t * 0.7 + i), 138 - (i % 2) * 22 + 4 * Math.cos(t * 0.9 + i), 2.5, k.gold);
    }
    k.gold.setAlphaf(1);
  } else if (kind === 'forbidden') {
    backdrop(c, k, 220, 44, 14);
    tree(c, k, 140, 170, 1.1, 2 * wind);
    for (let pass = 0; pass < 2; pass++) {
      for (let x = 42; x <= 240; x += 22) {
        if (x > 112 && x < 168) continue;
        c.drawLine(x, 146, x, 174, pass ? k.softLine : k.postEdge);
      }
    }
    for (const y of [154, 166]) {
      c.drawLine(42, y, 108, y, k.ink);
      c.drawLine(174, y, 240, y, k.ink);
    }
    // the gate rattles for a moment every few seconds, as if someone tried the latch
    const burst = Math.max(0, Math.sin(t * 0.9)) ** 6;
    c.save();
    c.rotate(2.5 * burst * Math.sin(t * 22), 116, 174);
    c.drawLine(116, 144, 116, 176, k.postEdge);
    c.drawLine(166, 144, 166, 176, k.postEdge);
    c.drawLine(116, 144, 116, 176, k.softLine);
    c.drawLine(166, 144, 166, 176, k.softLine);
    c.drawLine(121, 150, 161, 150, k.ink);
    c.drawLine(121, 170, 161, 170, k.ink);
    c.drawLine(121, 170, 161, 150, k.ink);
    c.drawCircle(160, 160, 3.5, k.accent);
    c.restore();
  } else if (kind === 'rate-limit') {
    backdrop(c, k, 228, 40, 12);
    c.save();
    c.translate(150, 177);
    c.scale(1 + 0.25 * Math.sin(t * 1.5), 0.22);
    c.drawCircle(0, 0, 26, k.accentSoft);
    c.drawCircle(0, 0, 26, k.ink);
    c.restore();
    sprout(c, k, 150, 172, 0.7);
    c.save();
    c.translate(84, 112);
    c.rotate(22 + 2 * Math.sin(t * 1.5), 0, 0);
    c.drawPath(k.canHandle, k.ink);
    c.drawLine(18, 6, 42, -10, k.ink);
    c.drawLine(38, -16, 46, -4, k.ink);
    c.drawPath(k.can, k.soft);
    c.drawPath(k.can, k.ink);
    c.restore();
    for (let i = 0; i < 5; i++) {
      const p = (t * 1.5 + i * 0.2) % 1;
      c.drawCircle(128 + p * 20, 112 + p * p * 56, 2.5, k.accent);
    }
    c.save();
    c.translate(214, 146);
    c.drawPath(k.glass, k.soft);
    c.drawPath(k.glass, k.ink);
    c.drawLine(-16, -26, 16, -26, k.ink);
    c.drawLine(-16, 26, 16, 26, k.ink);
    c.drawCircle(0, -10 + ((t * 0.8) % 1) * 30, 2.2, k.gold);
    c.restore();
    leaf(c, k, k.leafS, 214, 134, 0, k.gold);
    leaf(c, k, k.leafM, 214, 172, 0, k.gold);
  } else if (kind === 'test-done') {
    backdrop(c, k, 220, 44, 14);
    const p = (t % 7) / 7;
    const stem = ease(p / 0.25);
    const bloom = ease((p - 0.2) / 0.3);
    c.drawLine(140, 170, 140, 170 - 62 * stem, k.ink);
    if (stem > 0.6) {
      leaf(c, k, k.leafM, 140, 150, -60, k.accentSoft);
      leaf(c, k, k.leafM, 140, 138, 58, k.accentSoft);
    }
    if (bloom > 0.02) {
      c.save();
      c.translate(140, 108);
      c.scale(bloom, bloom);
      for (let i = 0; i < 6; i++) leaf(c, k, k.leafL, 0, 0, i * 60 + 12 * (1 - bloom), k.accentSoft);
      blob(c, k, [0, 0, 6], k.gold);
      c.restore();
    }
    for (let i = 0; i < 4; i++) {
      const q = (t * 0.22 + i * 0.25) % 1;
      leaf(c, k, k.leafS, 56 + i * 56 + 9 * Math.sin(q * 9 + i), 14 + q * 150, t * 60 + i * 80, k.gold);
    }
  } else {
    backdrop(c, k, 0, 0, 0);
    // a shoot that keeps growing round a circle, like a spinner
    const start = t * 190;
    const sweep = 50 + 125 * (1 + Math.sin(t * 2.2));
    c.drawArc(k.ring, start, sweep, false, k.ink);
    for (let a = 40; a < sweep; a += 70) {
      const r = ((start + a) * Math.PI) / 180;
      leaf(c, k, k.leafS, 140 + 38 * Math.cos(r), 88 + 38 * Math.sin(r), start + a + (a % 140 ? 30 : 150), k.accentSoft);
    }
    const end = ((start + sweep) * Math.PI) / 180;
    leaf(c, k, k.leafM, 140 + 38 * Math.cos(end), 88 + 38 * Math.sin(end), start + sweep + 180, k.accent);
  }
}
