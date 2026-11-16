import { Canvas, Circle, Group, Picture, Rect, Skia, type SkPicture, type Transforms3d } from '@shopify/react-native-skia';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, PanResponder, Platform, Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, { type FrameInfo, runOnJS, useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { Ground, PALETTE, Sky, type TimeOfDay } from './Background';
import { createPaints, createResources, drawParticles, drawTree } from './draw';
import { GROUND_Y, WORLD_H, WORLD_W, generateTree, structureKey } from './generate';
import { buildScene, type Scene } from './scene';
import type { Leaf, TreeInput, TreePrimitives } from './types';

const IS_WEB = Platform.OS === 'web';
const MAX_ZOOM = 5;
const TAP_SLOP = 6;

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce, () => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

/** CanvasKit objects are not garbage collected: on web keep the last two pictures and free older ones. */
function recycle(bin: SkPicture[], picture: SkPicture) {
  'worklet';
  bin.push(picture);
  if (bin.length > 2) bin.shift()?.dispose();
}

export const leafCenter = (l: Leaf) => ({
  x: l.x + Math.sin(l.rotation) * l.size * 0.5,
  y: l.y - Math.cos(l.rotation) * l.size * 0.5,
});

interface LeafButtonsProps {
  leaves: Leaf[];
  labels: Record<string, string>;
  onPress: (topicId: string) => void;
}

/** Skia is invisible to TalkBack / VoiceOver, so every leaf gets a transparent native button on top. */
const LeafButtons = memo(function LeafButtons({ leaves, labels, onPress }: LeafButtonsProps) {
  return (
    <>
      {leaves.map((l) => {
        const c = leafCenter(l);
        return (
          <Pressable
            key={l.topicId}
            accessibilityRole="button"
            accessibilityLabel={labels[l.topicId]}
            hitSlop={6}
            onPress={() => onPress(l.topicId)}
            style={{ position: 'absolute', left: c.x - l.size / 2, top: c.y - l.size / 2, width: l.size, height: l.size }}
          />
        );
      })}
    </>
  );
});

export interface KnowledgeTreeProps {
  input: TreeInput;
  /** "Today" for due / staleness checks (can be fast-forwarded in the dev panel). */
  nowMs: number;
  time: TimeOfDay;
  selectedTopicId?: string;
  /** accessibilityLabel per topic id. */
  labels: Record<string, string>;
  onPressTopic: (topicId: string) => void;
  onPressCourse: (courseId: string) => void;
  onPressNothing?: () => void;
  /** Dev only: UI-thread frames rendered during the last second. */
  onFps?: (fps: number) => void;
}

export function KnowledgeTree({ input, nowMs, time, selectedTopicId, labels, onPressTopic, onPressCourse, onPressNothing, onFps }: KnowledgeTreeProps) {
  const reduceMotion = useReduceMotion();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const root = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });

  // Regenerate geometry only when ids change — mastery updates reuse the same primitives.
  const key = structureKey(input);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prims: TreePrimitives = useMemo(() => generateTree(input), [key]);
  const paints = useMemo(createPaints, []);
  // ponytail: replaced paths are not disposed on web (a few KB per structure change); free them if it ever shows up
  const res = useMemo(() => createResources(prims, paints), [prims, paints]);

  // ---- animation clock + scene (all per-frame work happens on the UI thread) ----
  const clock = useSharedValue(0);
  const frames = useSharedValue(0);
  const fpsAt = useSharedValue(0);
  // stable identity: re-registering the callback on every render would restart the clock
  const onFrame = useCallback((info: FrameInfo) => {
    'worklet';
    clock.value = info.timeSinceFirstFrame;
    if (!onFps) return;
    frames.value += 1;
    if (info.timeSinceFirstFrame - fpsAt.value >= 1000) {
      runOnJS(onFps)(Math.round((frames.value * 1000) / (info.timeSinceFirstFrame - fpsAt.value)));
      frames.value = 0;
      fpsAt.value = info.timeSinceFirstFrame;
    }
  }, [clock, frames, fpsAt, onFps]);
  const frame = useFrameCallback(onFrame);
  useEffect(() => frame.setActive(!reduceMotion), [frame, reduceMotion]);

  const last = useRef<Scene | null>(null);
  const scene = useSharedValue<Scene>({ instant: true, trunk: { samples: [], from: 0, to: 0, born: 0 }, branches: [] });
  useEffect(() => {
    last.current = buildScene(last.current, prims, input, nowMs, clock.value, reduceMotion);
    scene.value = last.current;
  }, [prims, input, nowMs, reduceMotion, clock, scene]);

  // ---- layout: world → screen ----
  const { w, h } = box;
  // the ground line sits at 86 % of the height, the rest below it is ground and grass
  const horizon = h * 0.86;
  // Frame the tree, not the whole world: a small tree fills the screen too. The frame is quantised
  // (steps of 200 units) so it only changes when the tree outgrows it, not on every new leaf.
  const framing = useMemo(() => {
    let half = 0;
    let top = GROUND_Y - 760;
    for (const l of prims.leaves) {
      half = Math.max(half, Math.abs(l.x - WORLD_W / 2) + l.size);
      top = Math.min(top, l.y - l.size);
    }
    return { width: Math.max(600, Math.ceil((half * 2 + 60) / 200) * 200), top: Math.max(0, Math.floor((top - 30) / 200) * 200) };
  }, [prims]);
  const fit = Math.min(w / framing.width, (horizon * 0.94) / (GROUND_Y - framing.top)) || 1;
  const bx = w / 2 - (WORLD_W / 2) * fit;
  const by = horizon - GROUND_Y * fit;

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const zoom = useSharedValue(1);
  const worldTransform = useDerivedValue<Transforms3d>(() => [
    { translateX: w / 2 + tx.value + (bx - w / 2) * zoom.value },
    { translateY: h / 2 + ty.value + (by - h / 2) * zoom.value },
    { scale: fit * zoom.value },
  ], [w, h, bx, by, fit]);
  const far = useDerivedValue<Transforms3d>(() => [{ translateX: tx.value * 0.12 }, { translateY: ty.value * 0.12 }], []);
  const mid = useDerivedValue<Transforms3d>(() => [{ translateX: tx.value * 0.28 }, { translateY: ty.value * 0.28 }], []);
  const near = useDerivedValue<Transforms3d>(() => [{ translateX: tx.value * 0.5 }, { translateY: ty.value * 0.5 }], []);
  const period = w + 520;
  const driftFar = useDerivedValue<Transforms3d>(() => [{ translateX: ((clock.value * 0.004) % period) + tx.value * 0.05 }], [period]);
  const driftNear = useDerivedValue<Transforms3d>(() => [{ translateX: ((clock.value * 0.009 + period * 0.4) % period) + tx.value * 0.08 }], [period]);
  const overlayStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: w / 2 + tx.value + (bx - w / 2) * zoom.value },
      { translateY: h / 2 + ty.value + (by - h / 2) * zoom.value },
      { scale: fit * zoom.value },
    ],
  }), [w, h, bx, by, fit]);

  // ---- pictures, re-recorded on the UI thread whenever the clock or the scene changes ----
  const treeBin = useRef<SkPicture[]>([]).current;
  const tree = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    drawTree(recorder.beginRecording(), scene.value, res, clock.value);
    const picture = recorder.finishRecordingAsPicture();
    if (IS_WEB) recycle(treeBin, picture);
    return picture;
  }, [res]);

  const fireflies = time === 'evening' || time === 'night';
  const airBin = useRef<SkPicture[]>([]).current;
  const air = useDerivedValue(() => {
    const recorder = Skia.PictureRecorder();
    drawParticles(recorder.beginRecording(), paints, fireflies, clock.value, w, h, horizon);
    const picture = recorder.finishRecordingAsPicture();
    if (IS_WEB) recycle(airBin, picture);
    return picture;
  }, [paints, fireflies, w, h, horizon]);

  // ---- gestures: pan, pinch, tap on a branch ----
  const view = useRef({ tx: 0, ty: 0, zoom: 1 });
  const apply = (nx: number, ny: number, nz: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, nz));
    const limX = ((z - 1) * w) / 2 + 48;
    const limY = ((z - 1) * h) / 2 + 48;
    view.current = { zoom: z, tx: Math.min(limX, Math.max(-limX, nx)), ty: Math.min(limY, Math.max(-limY, ny)) };
    tx.value = view.current.tx;
    ty.value = view.current.ty;
    zoom.value = z;
  };
  /** Zoom by `factor` keeping the screen point (fx, fy) in place. */
  const zoomAt = (fx: number, fy: number, factor: number, from = view.current) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, from.zoom * factor));
    const k = z / from.zoom;
    apply(fx - w / 2 - (fx - w / 2 - from.tx) * k, fy - h / 2 - (fy - h / 2 - from.ty) * k, z);
  };
  const tap = (sx: number, sy: number) => {
    const v = view.current;
    const s = fit * v.zoom;
    const x = (sx - (w / 2 + v.tx + (bx - w / 2) * v.zoom)) / s;
    const y = (sy - (h / 2 + v.ty + (by - h / 2) * v.zoom)) / s;
    for (const b of prims.branches) {
      for (const p of b.samples) {
        if (Math.hypot(p.x - x, p.y - y) < Math.max(p.w / 2 + 6, 20 / s)) return onPressCourse(b.courseId);
      }
    }
    onPressNothing?.();
  };

  // PanResponder callbacks are created once, so they reach the latest closures through this ref.
  const live = useRef({ apply, zoomAt, tap });
  live.current = { apply, zoomAt, tap };
  const pan = useMemo(() => {
    let start = { tx: 0, ty: 0, zoom: 1 };
    let fingers = 0;
    let x0 = 0;
    let y0 = 0;
    let dist0 = 1;
    let moved = false;
    const read = (e: GestureResponderEvent) => {
      const t = e.nativeEvent.touches;
      const two = t.length >= 2;
      const x = two ? (t[0].pageX + t[1].pageX) / 2 : e.nativeEvent.pageX;
      const y = two ? (t[0].pageY + t[1].pageY) / 2 : e.nativeEvent.pageY;
      return { n: two ? 2 : 1, x: x - origin.current.x, y: y - origin.current.y, dist: two ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) || 1 : 1 };
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      // steal the gesture from a leaf button as soon as it turns into a drag or a pinch
      onMoveShouldSetPanResponderCapture: (e, g) => e.nativeEvent.touches.length >= 2 || Math.hypot(g.dx, g.dy) > TAP_SLOP,
      onPanResponderGrant: () => {
        fingers = 0;
        moved = false;
      },
      onPanResponderMove: (e, g) => {
        const p = read(e);
        if (p.n !== fingers) {
          // finger count changed: restart from the current view
          fingers = p.n;
          start = { ...view.current };
          x0 = p.x;
          y0 = p.y;
          dist0 = p.dist;
        }
        if (p.n === 2 || Math.hypot(g.dx, g.dy) > TAP_SLOP) moved = true;
        if (!moved) return;
        const shifted = { ...start, tx: start.tx + p.x - x0, ty: start.ty + p.y - y0 };
        if (p.n === 2) live.current.zoomAt(p.x, p.y, p.dist / dist0, shifted);
        else live.current.apply(shifted.tx, shifted.ty, shifted.zoom);
      },
      onPanResponderRelease: (e) => {
        if (!moved) live.current.tap(e.nativeEvent.pageX - origin.current.x, e.nativeEvent.pageY - origin.current.y);
      },
    });
  }, []);

  // web: mouse wheel / trackpad pinch zoom
  useEffect(() => {
    if (!IS_WEB) return;
    const el = root.current as unknown as HTMLElement | null;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      live.current.zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0022));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const selected = selectedTopicId ? prims.leaves.find((l) => l.topicId === selectedTopicId) : undefined;
  const ring = selected && leafCenter(selected);

  return (
    <View
      ref={root}
      style={styles.fill}
      onLayout={(e) => {
        setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
        root.current?.measureInWindow((x, y) => (origin.current = { x, y }));
      }}
      {...pan.panHandlers}
    >
      {w > 0 && (
        <>
          <Canvas style={styles.fill} accessible={false} importantForAccessibility="no-hide-descendants">
            <Sky w={w} h={h} horizon={horizon} time={time} parallax={[far, mid, near]} drift={[driftFar, driftNear]} period={period} />
            <Group transform={worldTransform}>
              <Ground time={time} />
              <Picture picture={tree} />
              {ring && <Circle cx={ring.x} cy={ring.y} r={selected.size * 0.72} style="stroke" strokeWidth={2.5} color="rgba(255,255,255,0.9)" />}
              <Ground time={time} front />
            </Group>
            <Rect x={0} y={0} width={w} height={h} color={PALETTE[time].veil} />
            <Picture picture={air} />
          </Canvas>
          <Animated.View style={[styles.world, overlayStyle]}>
            <LeafButtons leaves={prims.leaves} labels={labels} onPress={onPressTopic} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  world: { position: 'absolute', left: 0, top: 0, width: WORLD_W, height: WORLD_H, transformOrigin: 'left top', pointerEvents: 'box-none' },
});
