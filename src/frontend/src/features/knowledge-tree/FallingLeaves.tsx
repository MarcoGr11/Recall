import { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { TreeLayout } from "./layout";
import metaJson from "./tree-meta.json";

const SPRITES = [
  require("../../../assets/tree/leaves/leaf-0.png"),
  require("../../../assets/tree/leaves/leaf-1.png"),
  require("../../../assets/tree/leaves/leaf-2.png"),
  require("../../../assets/tree/leaves/leaf-3.png"),
  require("../../../assets/tree/leaves/leaf-4.png"),
  require("../../../assets/tree/leaves/leaf-5.png"),
  require("../../../assets/tree/leaves/leaf-6.png"),
  require("../../../assets/tree/leaves/leaf-7.png"),
];
const SPRITE_SIZE = metaJson.fallingLeaves;
const MAX_LEAVES = 4;
const LEAF_WORLD_SIZE = 34; // longest side, in layout units
const rand = (a: number, b: number) => a + Math.random() * (b - a);
let nextId = 0; // module-level so ids stay unique if the spawn effect restarts

interface Leaf { id: number; sprite: number; from: [number, number]; drift: number; sway: number; spin: number; duration: number }

/** Decorative leaves detaching from the crown. Overlay in screen space, drawn above the Svg. */
export default function FallingLeaves({ layout, width, height }: { layout: TreeLayout; width: number; height: number }) {
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion || !layout.fallOrigins.length) return setLeaves([]);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const spawn = () => {
      const leaf: Leaf = {
        id: nextId++,
        sprite: Math.floor(Math.random() * SPRITES.length),
        from: layout.fallOrigins[Math.floor(Math.random() * layout.fallOrigins.length)],
        drift: rand(-60, 60),
        sway: rand(14, 30),
        spin: rand(-540, 540),
        duration: rand(5000, 8000),
      };
      setLeaves(ls => (ls.length >= MAX_LEAVES ? ls : [...ls, leaf]));
      timers.push(setTimeout(() => setLeaves(ls => ls.filter(l => l.id !== leaf.id)), leaf.duration));
      timers.push(setTimeout(spawn, rand(3000, 6000)));
    };
    timers.push(setTimeout(spawn, rand(1000, 3000)));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion, layout]);

  if (reduceMotion || !width || !height) return null;

  // Same mapping as the Svg's default preserveAspectRatio (xMidYMid meet).
  const { viewBox: vb } = layout;
  const s = Math.min(width / vb.width, height / vb.height);
  const ox = (width - vb.width * s) / 2 - vb.x * s;
  const oy = (height - vb.height * s) / 2 - vb.y * s;

  return (
    <View style={styles.overlay}>
      {leaves.map(l => <FallingLeaf key={l.id} leaf={l} scale={s} ox={ox} oy={oy} />)}
    </View>
  );
}

function FallingLeaf({ leaf, scale, ox, oy }: { leaf: Leaf; scale: number; ox: number; oy: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: leaf.duration, easing: Easing.linear });
  }, []);

  const { w, h } = SPRITE_SIZE[leaf.sprite];
  const k = (LEAF_WORLD_SIZE * scale) / Math.max(w, h);
  const width = w * k, height = h * k;
  const x0 = ox + leaf.from[0] * scale - width / 2;
  const y0 = oy + leaf.from[1] * scale - height / 2;
  const fall = oy - height / 2 - y0; // world y = 0 is the ground line
  const { drift, sway, spin } = leaf;

  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.08 ? t.value / 0.08 : t.value > 0.85 ? (1 - t.value) / 0.15 : 1,
    transform: [
      { translateX: x0 + drift * scale * t.value + sway * scale * Math.sin(t.value * Math.PI * 4) },
      { translateY: y0 + fall * t.value },
      { rotate: `${spin * t.value + 25 * Math.sin(t.value * Math.PI * 4)}deg` },
    ],
  }));

  return <Animated.Image source={SPRITES[leaf.sprite]} style={[styles.leaf, { width, height }, style]} />;
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, pointerEvents: "none" },
  leaf: { position: "absolute", left: 0, top: 0 },
});
