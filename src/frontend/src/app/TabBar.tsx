import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '../icons/Icon';
import { useTheme } from '../theme';
import { BAR_H, BAR_INSET } from './barMetrics';

export interface Tab {
  key: string;
  title: string;
  icon: IconName;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  /** Over the tree scene: no background of its own (the scene draws the blurred underlay), all content in on-surface. */
  translucent?: boolean;
}

export function TabBar({ tabs, active, onChange, translucent }: Props) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, translucent ? styles.floating : { backgroundColor: t.surface, borderTopColor: t.outline, borderTopWidth: StyleSheet.hairlineWidth }]}
    >
      {tabs.map((tab) => {
        const on = tab.key === active;
        // on the translucent bar the primary colour can drop below 4.5:1, so the active tab is marked by the pill and weight only
        const color = translucent ? t.onSurface : on ? t.onPrimaryContainer : t.onSurfaceVariant;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.title}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <View style={[styles.pill, on && { backgroundColor: t.primaryContainer }]}>
              <Icon name={tab.icon} color={on && !translucent ? t.onPrimaryContainer : color} decorative />
            </View>
            <Text numberOfLines={1} style={[styles.label, { color, fontWeight: on ? '700' : '500' }]}>
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', minHeight: BAR_H + BAR_INSET, paddingBottom: BAR_INSET, paddingTop: 6 },
  floating: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tab: { flex: 1, alignItems: 'center', gap: 2, minHeight: 48 },
  pill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
});
