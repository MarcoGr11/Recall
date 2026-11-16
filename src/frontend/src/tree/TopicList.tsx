import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { isDue } from './mastery';
import type { TreeInput } from './types';

export const percent = (mastery: number) => Math.round(mastery * 100);
export const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('uk-UA') : 'не заплановано');

interface Props {
  input: TreeInput;
  nowMs: number;
  onPressTopic: (topicId: string) => void;
}

/** The same topics as a plain list — the alternative for screen readers and large fonts. */
export function TopicList({ input, nowMs, onPressTopic }: Props) {
  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      sections={input.courses.map((c) => ({ title: c.title, data: c.topics }))}
      keyExtractor={(t) => t.id}
      ListEmptyComponent={<Text style={styles.empty}>Курсів ще немає</Text>}
      renderSectionHeader={({ section }) => (
        <Text accessibilityRole="header" style={styles.header}>
          {section.title} · {section.data.length} тем
        </Text>
      )}
      renderItem={({ item, section }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, курс ${section.title}, засвоєно ${percent(item.mastery)} %`}
          onPress={() => onPressTopic(item.id)}
          style={styles.row}
        >
          <View style={styles.rowText}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{isDue(item, nowMs) ? 'Пора повторити' : `Повторення: ${formatDate(item.dueAt)}`}</Text>
          </View>
          <Text style={styles.percent}>{percent(item.mastery)} %</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#F4F7F2' },
  content: { padding: 16, paddingBottom: 48 },
  header: { fontSize: 18, fontWeight: '700', color: '#1F3A26', paddingTop: 18, paddingBottom: 8, backgroundColor: '#F4F7F2' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 6, borderRadius: 12, backgroundColor: '#FFFFFF', minHeight: 48 },
  rowText: { flex: 1 },
  title: { fontSize: 16, color: '#1B2A1F' },
  meta: { fontSize: 13, color: '#5B6B5F', marginTop: 2 },
  percent: { fontSize: 16, fontWeight: '700', color: '#1F3A26' },
  empty: { fontSize: 16, color: '#5B6B5F', textAlign: 'center', marginTop: 48 },
});
