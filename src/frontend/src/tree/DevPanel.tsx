import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export interface DevAction {
  label: string;
  run: () => void;
  disabled?: boolean;
}

/** Dev-only controls to trigger every animation live. Rendered only when __DEV__ is true. */
export function DevPanel({ actions, status }: { actions: DevAction[]; status: string }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.panel}>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)} style={styles.head}>
        <Text style={styles.status}>
          {open ? '▾' : '▸'} DEV · {status}
        </Text>
      </Pressable>
      {open && (
        <View style={styles.actions}>
          {actions.map((a, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              disabled={a.disabled}
              onPress={a.run}
              style={({ pressed }) => [styles.button, a.disabled && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.label}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: 'rgba(16,24,20,0.82)', paddingHorizontal: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 10, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  head: { paddingVertical: 8 },
  status: { color: '#CFE8D2', fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { backgroundColor: '#2F6B3B', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  label: { color: '#FFFFFF', fontSize: 13 },
});
