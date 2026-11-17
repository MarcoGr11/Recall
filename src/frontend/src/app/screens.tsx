import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '../icons/Icon';
import { KINDS, SCENE_LABEL, StateScene, type SceneKind } from '../scenes/StateScene';
import { type Scheme, useTheme } from '../theme';

export const TOP = Platform.select({ ios: 54, android: (StatusBar.currentHeight ?? 24) + 8, default: 16 });

function Screen({ title, children }: { title: string; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: t.background, paddingTop: TOP }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: t.onSurface }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

interface StateProps {
  title: string;
  scene: SceneKind;
  heading: string;
  text: string;
  action?: { label: string; onPress: () => void };
}

/** Empty / error state: animated scene, heading, explanation and an optional action. */
export function StateScreen({ title, scene, heading, text, action }: StateProps) {
  const t = useTheme();
  return (
    <Screen title={title}>
      <View style={styles.state}>
        <StateScene kind={scene} />
        <Text style={[styles.heading, { color: t.onSurface }]}>{heading}</Text>
        <Text style={[styles.text, { color: t.onSurfaceVariant }]}>{text}</Text>
        {action && (
          <Pressable accessibilityRole="button" onPress={action.onPress} style={[styles.button, { backgroundColor: t.primary }]}>
            <Text style={[styles.buttonText, { color: t.onPrimary }]}>{action.label}</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const TITLES: Record<SceneKind, string> = {
  offline: 'Офлайн',
  'empty-courses': 'Немає курсів',
  'empty-plan': 'Все повторено',
  'empty-drafts': 'Немає чернеток',
  session: 'Сесія завершилась',
  forbidden: '403 — немає доступу',
  'rate-limit': '429 — забагато запитів',
  'test-done': 'Тест завершено',
  loading: 'Завантаження',
};

/** Dev gallery with every state scene, for demos and for checking both themes. */
export function ScenesScreen({ onBack }: { onBack: () => void }) {
  const t = useTheme();
  return (
    <Screen title="Scenes">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Icon name="arrow-left" decorative />
        <Text style={[styles.rowTitle, { color: t.onSurface }]}>Профіль</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.gallery}>
        {KINDS.map((kind) => (
          <View key={kind} testID={`scene-${kind}`} style={[styles.tile, { backgroundColor: t.background, borderColor: t.outline }]}>
            <StateScene kind={kind} />
            <Text style={[styles.rowTitle, { color: t.onSurface }]}>{TITLES[kind]}</Text>
            <Text style={[styles.caption, { color: t.onSurfaceVariant }]}>
              {kind} · {SCENE_LABEL[kind]}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

interface ProfileProps {
  scheme: Scheme;
  onScheme: (s: Scheme) => void;
  onOpenScenes: () => void;
}

const SCHEMES: { key: Scheme; title: string; icon: IconName }[] = [
  { key: 'system', title: 'Системна', icon: 'phone' },
  { key: 'light', title: 'Світла', icon: 'sun' },
  { key: 'dark', title: 'Темна', icon: 'moon' },
];

export function ProfileScreen({ scheme, onScheme, onOpenScenes }: ProfileProps) {
  const t = useTheme();
  const rows: { icon: IconName; title: string; sub: string; onPress?: () => void }[] = [
    { icon: 'settings', title: 'Налаштування', sub: 'Сповіщення, доступність' },
    { icon: 'book', title: 'Мої курси', sub: '5 курсів' },
    { icon: 'key', title: 'Приєднатися за кодом', sub: 'Код запрошення від викладача' },
  ];
  if (__DEV__) rows.push({ icon: 'sparkles', title: 'Scenes', sub: 'Dev: усі анімовані сцени станів', onPress: onOpenScenes });
  return (
    <Screen title="Профіль">
      <Text style={[styles.section, { color: t.onSurfaceVariant }]}>Тема оформлення</Text>
      <View accessibilityRole="radiogroup" style={[styles.segments, { backgroundColor: t.surfaceVariant }]}>
        {SCHEMES.map((s) => {
          const on = s.key === scheme;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => onScheme(s.key)}
              style={[styles.segment, on && { backgroundColor: t.surface }]}
            >
              <Icon name={s.icon} size={20} decorative />
              <Text style={[styles.segmentText, { color: t.onSurface }]}>{s.title}</Text>
            </Pressable>
          );
        })}
      </View>
      {rows.map((r) => (
        <Pressable
          key={r.title}
          accessibilityRole="button"
          accessibilityLabel={`${r.title}. ${r.sub}`}
          onPress={r.onPress}
          style={[styles.row, { backgroundColor: t.surface, borderColor: t.outline }]}
        >
          <Icon name={r.icon} decorative />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: t.onSurface }]}>{r.title}</Text>
            <Text style={[styles.caption, { color: t.onSurfaceVariant }]}>{r.sub}</Text>
          </View>
          <Icon name="chevron-right" color={t.onSurfaceVariant} decorative />
        </Pressable>
      ))}
    </Screen>
  );
}

// no fixed heights on text containers: everything grows with the system font scale
const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 32 },
  heading: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  text: { fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  button: { marginTop: 12, minHeight: 48, borderRadius: 24, paddingHorizontal: 24, justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingBottom: 24 },
  tile: { width: 304, padding: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 2 },
  section: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  segments: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16 },
  segment: { flex: 1, flexDirection: 'row', gap: 6, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 13 },
});
