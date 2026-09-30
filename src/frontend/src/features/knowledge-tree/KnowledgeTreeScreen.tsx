import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, G, Image, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { computeTreeLayout, FoliageSprite, LeafSlot, TreeMeta } from "./layout";
import { masteryFromEase, nextEase, ZONE_COLOR, zoneOf } from "./mastery";
import { courses, flagshipTopics, Topic } from "./mockData";
import metaJson from "./tree-meta.json";

const meta = metaJson as unknown as TreeMeta;

const TRUNK = require("../../../assets/tree/trunk.png");
const BRANCH = require("../../../assets/tree/branch.png");
const GROUND = require("../../../assets/tree/ground.png");
const FOLIAGE = [
  require("../../../assets/tree/foliage-0.png"),
  require("../../../assets/tree/foliage-1.png"),
  require("../../../assets/tree/foliage-2.png"),
  require("../../../assets/tree/foliage-3.png"),
];

const LEAF_PATH = "M6 0 C10 -11.5 25 -14 39 0 C25 14 10 11.5 6 0Z";
const FLAGSHIP_NAME = "Базовий модуль";

const layout = computeTreeLayout(
  courses.map(c => ({ id: c.id, topicCount: c.topics.length })),
  flagshipTopics.length,
  meta,
);
const { viewBox: vb } = layout;

interface PlacedTopic { topic: Topic; course: string; isOwn: boolean; slot: LeafSlot }

const placed: PlacedTopic[] = [
  ...flagshipTopics.map((topic, i) => ({ topic, course: FLAGSHIP_NAME, isOwn: true, slot: layout.trunkLeafSlots[i] })),
  ...courses.flatMap((c, ci) =>
    c.topics.map((topic, i) => ({ topic, course: c.name, isOwn: c.isOwn === true, slot: layout.branches[ci].leafSlots[i] })),
  ),
];

// react-native-svg 15 on web turns onPress into responder props that react-native-web 0.21
// no longer consumes (React warns about unknown DOM props). A plain onClick works there, but
// only with onPress === null: any other value (even undefined) overwrites onClick.
const pressProps = (fn?: () => void) =>
  (Platform.OS === "web" ? { onClick: fn, onPress: null } : { onPress: fn }) as { onPress?: () => void };

const foliageLayer = (layer: FoliageSprite["layer"]) =>
  layout.foliage.filter(f => f.layer === layer).map((f, i) => (
    <Image
      key={`${layer}-${i}`}
      href={FOLIAGE[f.sprite]}
      x={-f.size / 2}
      y={-f.size / 2}
      width={f.size}
      height={f.size}
      transform={`translate(${f.x} ${f.y}) scale(${f.flip ? -1 : 1} 1)`}
    />
  ));

export default function KnowledgeTreeScreen() {
  const [ease, setEase] = useState<Record<string, number>>(() =>
    Object.fromEntries(placed.map(p => [p.topic.id, p.topic.ease])),
  );
  const [teacher, setTeacher] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const easeOf = (p: PlacedTopic) => (teacher ? p.topic.groupEase : ease[p.topic.id]);
  const isActive = (p: PlacedTopic) => !teacher || p.isOwn;
  const selected = placed.find(p => p.topic.id === selectedId);

  const switchMode = (toTeacher: boolean) => {
    setTeacher(toTeacher);
    setSelectedId(null);
  };
  const answer = (q: number) => {
    if (!selected) return;
    const id = selected.topic.id;
    setEase(s => ({ ...s, [id]: nextEase(s[id], q) }));
  };

  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.width} ${vb.height}`}>
        <Defs>
          <LinearGradient id="sky" gradientUnits="userSpaceOnUse" x1={0} y1={vb.y} x2={0} y2={vb.y + vb.height}>
            <Stop offset="0" stopColor="#141E33" />
            <Stop offset="1" stopColor="#2A3553" />
          </LinearGradient>
        </Defs>
        {/* oversized so the sky also covers the letterbox; the gradient pads beyond the viewBox */}
        <Rect x={vb.x - vb.width} y={vb.y - vb.height} width={vb.width * 3} height={vb.height * 3} fill="url(#sky)" />

        <G opacity={0.6}>{foliageLayer("back")}</G>
        {foliageLayer("mid")}
        {layout.branches.map(b => (
          <Image key={b.courseId} href={BRANCH} width={meta.branch.w} height={meta.branch.h} transform={b.transform} />
        ))}
        <Image href={TRUNK} {...layout.trunk} />
        <Image href={GROUND} {...layout.ground} />
        {foliageLayer("front")}

        {layout.branches.map((b, i) => (
          <SvgText
            key={b.courseId}
            x={b.label.x}
            y={b.label.y}
            textAnchor={b.label.anchor}
            fontSize={30}
            fontWeight="600"
            fill="#E8EEF8"
            opacity={teacher && !courses[i].isOwn ? 0.4 : 1}
          >
            {courses[i].name}
          </SvgText>
        ))}

        {placed.map(p => {
          const active = isActive(p);
          const isSelected = p.topic.id === selectedId;
          return (
            <G
              key={p.topic.id}
              transform={`translate(${p.slot.x} ${p.slot.y}) rotate(${p.slot.angleDeg}) scale(${p.slot.scale})`}
              opacity={active ? 1 : 0.35}
              {...pressProps(active ? () => setSelectedId(p.topic.id) : undefined)}
            >
              {/* near-invisible hit area: the leaf alone is too small to tap */}
              <Circle cx={22} cy={0} r={24} fill="#FFFFFF" fillOpacity={0.001} />
              <Path
                d={LEAF_PATH}
                fill={ZONE_COLOR[zoneOf(masteryFromEase(easeOf(p)))]}
                stroke={isSelected ? "#FFFFFF" : "#0C1611"}
                strokeWidth={isSelected ? 3 : 1.5}
              />
            </G>
          );
        })}
      </Svg>

      <View style={styles.toggle}>
        {[false, true].map(t => (
          <Pressable key={String(t)} onPress={() => switchMode(t)} style={[styles.toggleBtn, teacher === t && styles.toggleBtnOn]}>
            <Text style={[styles.toggleText, teacher === t && styles.toggleTextOn]}>{t ? "Викладач" : "Студент"}</Text>
          </Pressable>
        ))}
      </View>

      {selected && (
        <View style={styles.card}>
          <Pressable onPress={() => setSelectedId(null)} style={styles.close} hitSlop={12} accessibilityLabel="Закрити">
            <Text style={styles.closeText}>×</Text>
          </Pressable>
          <Text style={styles.title}>{selected.topic.name}</Text>
          <Text style={styles.sub}>{selected.course}</Text>
          <Text style={styles.stats}>
            {teacher ? "Група: " : ""}
            {masteryFromEase(easeOf(selected))}% · ease {easeOf(selected).toFixed(2)}
          </Text>
          {teacher ? (
            <Text style={styles.sub}>Студентів у зоні прогалин: {selected.topic.studentsInGap}</Text>
          ) : (
            <View style={styles.actions}>
              <Pressable style={[styles.btn, { backgroundColor: ZONE_COLOR.mastered }]} onPress={() => answer(5)}>
                <Text style={styles.btnText}>Відповів правильно</Text>
              </Pressable>
              <Pressable style={[styles.btn, { backgroundColor: ZONE_COLOR.gap }]} onPress={() => answer(2)}>
                <Text style={styles.btnText}>Помилився</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#141E33" },
  toggle: { position: "absolute", top: 56, alignSelf: "center", flexDirection: "row", backgroundColor: "#0C1611AA", borderRadius: 20, padding: 4 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  toggleBtnOn: { backgroundColor: "#E8EEF8" },
  toggleText: { color: "#E8EEF8", fontWeight: "600" },
  toggleTextOn: { color: "#141E33" },
  card: { position: "absolute", left: 12, right: 12, bottom: 24, backgroundColor: "#F4F6FA", borderRadius: 16, padding: 16, gap: 4 },
  close: { position: "absolute", top: 8, right: 12, zIndex: 1 },
  closeText: { fontSize: 24, color: "#4A5570" },
  title: { fontSize: 18, fontWeight: "700", color: "#141E33", paddingRight: 24 },
  sub: { color: "#4A5570" },
  stats: { fontSize: 16, fontWeight: "600", color: "#141E33", marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#0C1611", fontWeight: "700" },
});
