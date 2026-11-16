/** @jest-environment node */
import { THEMES } from '../theme';

// required, not imported: the project has no @types/node and does not need it anywhere else
const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

type Draw = typeof import('./draw');
type SkiaModule = typeof import('@shopify/react-native-skia');

// Scenes are drawn imperatively on a Skia canvas, so they can be rendered here with CanvasKit, without a device.
let draw: Draw;
let Skia: SkiaModule['Skia'];

beforeAll(async () => {
  // jest-expo swaps in Expo's TextDecoder, which lacks the utf-16le that CanvasKit asks for
  globalThis.TextDecoder = require('util').TextDecoder;
  (globalThis as { CanvasKit?: unknown }).CanvasKit = await require('canvaskit-wasm/bin/full/canvaskit')({});
  // same idea as @shopify/react-native-skia/jestSetup.js, but from the CommonJS build so no extra Babel config is needed
  jest.doMock('@shopify/react-native-skia/lib/commonjs/Platform', () => ({ OS: 'web', PixelRatio: 1, View: () => undefined }));
  jest.doMock('@shopify/react-native-skia', () => require('@shopify/react-native-skia/lib/commonjs/mock').Mock((globalThis as { CanvasKit?: unknown }).CanvasKit));
  Skia = require('@shopify/react-native-skia').Skia;
  draw = require('./draw');
});

/** Renders one frame at 2× and returns its PNG bytes. */
function render(kind: Draw['KINDS'][number], scheme: 'light' | 'dark', t: number): Uint8Array {
  const { SCENE_W, SCENE_H, createSceneKit, drawScene } = draw;
  const surface = Skia.Surface.Make(SCENE_W * 2, SCENE_H * 2)!;
  const canvas = surface.getCanvas();
  canvas.scale(2, 2);
  drawScene(canvas, kind, createSceneKit(THEMES[scheme]), t);
  surface.flush();
  return surface.makeImageSnapshot().encodeToBytes();
}

describe('state scenes', () => {
  it('describes every scene for screen readers', () => {
    for (const kind of draw.KINDS) expect(draw.SCENE_LABEL[kind].length).toBeGreaterThan(10);
  });

  it.each(['light', 'dark'] as const)('draws every scene at any moment of its loop (%s)', (scheme) => {
    for (const kind of draw.KINDS) {
      // the still frame plus moments spread over the longest loop (7 s)
      for (const t of [draw.STILL, 0, 0.9, 2.3, 3.7, 5.1, 6.6, 123.4]) {
        const png = render(kind, scheme, t);
        // a PNG with real content, not an empty canvas
        expect(png.length).toBeGreaterThan(1500);
      }
    }
  });

  // SCENE_SHOTS=<dir> npm test -- draw  → key frames of every scene as PNG (used for the Figma library)
  const out = process.env.SCENE_SHOTS;
  (out ? it : it.skip)('exports key frames', () => {
    mkdirSync(out!, { recursive: true });
    for (const scheme of ['light', 'dark'] as const) {
      for (const kind of draw.KINDS) writeFileSync(join(out!, `${kind}-${scheme}.png`), render(kind, scheme, KEY_FRAME[kind] ?? draw.STILL));
      // contact sheet on the theme background, 3 × 3
      const { SCENE_W, SCENE_H, createSceneKit, drawScene } = draw;
      const sheet = Skia.Surface.Make(SCENE_W * 3, SCENE_H * 3)!;
      const canvas = sheet.getCanvas();
      canvas.drawColor(Skia.Color(THEMES[scheme].background));
      draw.KINDS.forEach((kind, i) => {
        canvas.save();
        canvas.translate((i % 3) * SCENE_W, Math.floor(i / 3) * SCENE_H);
        drawScene(canvas, kind, createSceneKit(THEMES[scheme]), KEY_FRAME[kind] ?? draw.STILL);
        canvas.restore();
      });
      sheet.flush();
      writeFileSync(join(out!, `sheet-${scheme}.png`), sheet.makeImageSnapshot().encodeToBytes());
    }
  });
});

/** Moments where each loop looks its best as a still. */
const KEY_FRAME: Partial<Record<Draw['KINDS'][number], number>> = { 'empty-courses': 3, 'test-done': 4.6, 'empty-drafts': 2.4, loading: 0.9 };
