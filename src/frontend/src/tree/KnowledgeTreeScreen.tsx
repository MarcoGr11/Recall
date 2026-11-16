import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme';
import { TIMES, timeOfDayAt, type TimeOfDay } from './Background';
import { DevPanel, type DevAction } from './DevPanel';
import { KnowledgeTree } from './KnowledgeTree';
import { MAX_SLOTS } from './generate';
import { isDue } from './mastery';
import { DAY, EXTRA_COURSES, mockCourse, mockTopic, mockTree, stressTree } from './mockData';
import { TopicList, formatDate, percent } from './TopicList';
import type { Course, Topic, TreeInput } from './types';

const MAX_TOPICS = 30;
const TIME_LABEL: Record<TimeOfDay, string> = { morning: 'ранок', day: 'день', evening: 'вечір', night: 'ніч' };
// ponytail: fixed top inset instead of react-native-safe-area-context; add the library when real navigation lands
const TOP_INSET = Platform.select({ ios: 54, android: (StatusBar.currentHeight ?? 24) + 8, default: 12 });

type Selection = { topicId: string } | { courseId: string } | null;

const mapTopic = (input: TreeInput, topicId: string, change: (t: Topic) => Topic): TreeInput => ({
  ...input,
  courses: input.courses.map((c) => (c.topics.some((t) => t.id === topicId) ? { ...c, topics: c.topics.map((t) => (t.id === topicId ? change(t) : t)) } : c)),
});

/** `bottomInset` is the height of the translucent tab bar that floats over the bottom of the scene. */
export default function KnowledgeTreeScreen({ bottomInset = 0 }: { bottomInset?: number }) {
  const theme = useTheme();
  const [today] = useState(Date.now);
  const [input, setInput] = useState(() => mockTree(today));
  const [days, setDays] = useState(0);
  const [timeOverride, setTimeOverride] = useState<TimeOfDay | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [asList, setAsList] = useState(false);
  const [fps, setFps] = useState(0);
  const counter = useRef(0);

  const nowMs = today + days * DAY;
  const time = timeOverride ?? timeOfDayAt(new Date().getHours());

  const courseOf = (topicId: string) => input.courses.find((c) => c.topics.some((t) => t.id === topicId));
  const selectedTopicId = selection && 'topicId' in selection ? selection.topicId : undefined;
  const topicCourse = selectedTopicId ? courseOf(selectedTopicId) : undefined;
  const topic = topicCourse?.topics.find((t) => t.id === selectedTopicId);
  const course: Course | undefined = selection && 'courseId' in selection ? input.courses.find((c) => c.id === selection.courseId) : undefined;

  const labels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const c of input.courses) for (const t of c.topics) out[t.id] = `${t.title}, курс ${c.title}, засвоєно ${percent(t.mastery)} %`;
    return out;
  }, [input]);

  // ---- dev panel actions ----
  const allTopics = input.courses.flatMap((c) => c.topics);
  const targetTopic = () => topic?.id ?? allTopics[Math.floor(Math.random() * allTopics.length)]?.id;
  const targetCourse = () => course ?? topicCourse ?? input.courses[input.courses.length - 1];
  const bump = (delta: number) => {
    const id = targetTopic();
    if (!id) return;
    setInput((s) =>
      mapTopic(s, id, (t) => {
        const mastery = Math.min(1, Math.max(0, Math.round((t.mastery + delta) * 100) / 100));
        const reviewed = delta > 0;
        return {
          ...t,
          mastery,
          lastReviewedAt: reviewed ? new Date(nowMs).toISOString() : t.lastReviewedAt,
          dueAt: new Date(nowMs + (reviewed ? Math.round(1 + mastery * 13) * DAY : 0)).toISOString(),
        };
      }),
    );
    setSelection({ topicId: id });
  };
  const actions: DevAction[] = [
    {
      label: 'Додати курс',
      disabled: input.courses.length >= MAX_SLOTS,
      run: () => {
        const n = ++counter.current;
        const title = EXTRA_COURSES[(n - 1) % EXTRA_COURSES.length];
        const added = mockCourse(`dev-course-${n}`, title, ['Вступ', 'Основні поняття', 'Практикум', 'Підсумки'], nowMs);
        setInput((s) => ({ ...s, courses: [...s.courses, added] }));
        setSelection({ courseId: added.id });
      },
    },
    {
      label: 'Додати тему',
      disabled: !targetCourse() || targetCourse().topics.length >= MAX_TOPICS,
      run: () => {
        const target = targetCourse();
        const n = ++counter.current;
        const added = { ...mockTopic(`dev-topic-${n}`, `Нова тема ${n}`, nowMs), mastery: 0.6 };
        setInput((s) => ({ ...s, courses: s.courses.map((c) => (c.id === target.id ? { ...c, topics: [...c.topics, added] } : c)) }));
        setSelection({ topicId: added.id });
      },
    },
    { label: 'Повторити тему (+mastery)', disabled: !allTopics.length, run: () => bump(0.25) },
    { label: 'Забути тему (−mastery)', disabled: !allTopics.length, run: () => bump(-0.25) },
    { label: 'Перемотати час +7 днів', run: () => setDays((d) => d + 7) },
    {
      label: `Час доби: ${timeOverride ? TIME_LABEL[timeOverride] : 'авто'}`,
      run: () => setTimeOverride((t) => (t === null ? TIMES[0] : (TIMES[TIMES.indexOf(t) + 1] ?? null))),
    },
    {
      label: 'Видалити тему',
      disabled: !allTopics.length,
      run: () => {
        const id = topic?.id ?? targetCourse()?.topics.at(-1)?.id ?? allTopics.at(-1)?.id;
        setInput((s) => ({ ...s, courses: s.courses.map((c) => ({ ...c, topics: c.topics.filter((t) => t.id !== id) })) }));
        setSelection(null);
      },
    },
    {
      label: 'Видалити курс',
      disabled: !input.courses.length,
      run: () => {
        const id = targetCourse().id;
        setInput((s) => ({ ...s, courses: s.courses.filter((c) => c.id !== id) }));
        setSelection(null);
      },
    },
    { label: 'Порожнє', run: () => (setInput((s) => ({ ...s, courses: [] })), setSelection(null)) },
    { label: 'Мок 5 курсів', run: () => (setInput(mockTree(nowMs)), setSelection(null)) },
    { label: 'Стрес 8×30', run: () => (setInput(stressTree(nowMs)), setSelection(null)) },
  ];

  return (
    <View style={styles.screen}>
      {asList ? (
        <View style={[styles.fill, { paddingTop: TOP_INSET + 44, paddingBottom: bottomInset, backgroundColor: theme.background }]}>
          <TopicList input={input} nowMs={nowMs} onPressTopic={(topicId) => setSelection({ topicId })} />
        </View>
      ) : (
        <KnowledgeTree
          input={input}
          nowMs={nowMs}
          time={time}
          labels={labels}
          selectedTopicId={selectedTopicId}
          onPressTopic={(topicId) => setSelection({ topicId })}
          onPressCourse={(courseId) => setSelection({ courseId })}
          onPressNothing={() => setSelection(null)}
          onFps={__DEV__ ? setFps : undefined}
          bar={bottomInset ? { height: bottomInset, surface: theme.surface } : undefined}
        />
      )}

      <View style={[styles.top, { top: TOP_INSET }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={asList ? 'Показати дерево' : 'Показати списком'}
          onPress={() => setAsList(!asList)}
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>{asList ? 'Дерево' : 'Список'}</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { bottom: bottomInset }]}>
        {(topic || course) && (
          <View style={styles.card} accessibilityLiveRegion="polite">
            <View style={styles.cardText}>
              {topic && topicCourse ? (
                <>
                  <Text style={styles.cardTitle}>{topic.title}</Text>
                  <Text style={styles.cardLine}>Курс: {topicCourse.title}</Text>
                  <Text style={styles.cardLine}>Засвоєно: {percent(topic.mastery)} %</Text>
                  <Text style={styles.cardLine}>
                    Наступне повторення: {formatDate(topic.dueAt)}
                    {isDue(topic, nowMs) ? ' — пора повторити' : ''}
                  </Text>
                </>
              ) : course ? (
                <>
                  <Text style={styles.cardTitle}>{course.title}</Text>
                  <Text style={styles.cardLine}>Тем: {course.topics.length}</Text>
                  {course.topics.length > 0 && (
                    <Text style={styles.cardLine}>
                      Середнє засвоєння: {percent(course.topics.reduce((sum, t) => sum + t.mastery, 0) / course.topics.length)} %
                    </Text>
                  )}
                </>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Закрити картку" hitSlop={12} onPress={() => setSelection(null)} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        )}
        {__DEV__ && (
          <DevPanel
            actions={actions}
            status={`${input.courses.length} курсів · ${allTopics.length} тем · +${days} дн. · ${TIME_LABEL[time]} · ${asList ? '—' : fps} fps`}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0E1931' },
  fill: { flex: 1 },
  top: { position: 'absolute', right: 12, pointerEvents: 'box-none' },
  toggle: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 16, minHeight: 36, justifyContent: 'center' },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#1F3A26' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' },
  // no fixed heights: the card grows with the system font scale
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, margin: 12, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.96)' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#17261B', marginBottom: 4 },
  cardLine: { fontSize: 15, color: '#33443A', marginTop: 2 },
  close: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, color: '#33443A' },
});
