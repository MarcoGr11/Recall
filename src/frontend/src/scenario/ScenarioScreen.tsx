import { useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TOP } from '../app/screens';
import { Icon, type IconName } from '../icons/Icon';
import { useTheme } from '../theme';
import { choiceOf, debrief, depth, position, type Pick, type Scenario } from './model';

const BOTTOM = Platform.select({ ios: 34, default: 16 });

type Phase = 'intro' | 'step' | 'consequence' | 'debrief';

/**
 * Branching decision trainer (Figma S19–S22): intro → step → consequence → … → debrief of the whole path.
 * A choice is final: there is no way back to the previous step.
 */
export function ScenarioScreen({ scenario, onExit }: { scenario: Scenario; onExit: () => void }) {
  const t = useTheme();
  const [phase, setPhase] = useState<Phase>('intro');
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const total = depth(scenario);

  const restart = () => (setPicks([]), setSelected(null), setPhase('intro'));
  const at = position(scenario, phase === 'consequence' ? picks.slice(0, -1) : picks);

  if (phase === 'intro') {
    const rules: [IconName, string][] = [
      ['clock', `Близько ${scenario.minutes} хвилин. Таймера немає: важить рішення, а не швидкість.`],
      ['list', `До ${total} кроків. На кожному обираєте одну дію, і вона визначає наступний крок.`],
      ['lock', 'Повернутися до попереднього кроку не можна. Наслідки лишаються з вами.'],
      ['search', 'Наприкінці — розбір усього шляху: де і чому сталася помилка.'],
    ];
    return (
      <Layout title="Сценарій" onBack={onExit} backLabel="Назад" action={{ label: 'Почати сценарій', onPress: () => setPhase('step') }}>
        <Text accessibilityRole="header" style={[styles.h1, { color: t.onSurface }]}>
          {scenario.title}
        </Text>
        {rules.map(([icon, text]) => (
          <View key={icon} style={styles.rule}>
            <View style={[styles.ruleIcon, { backgroundColor: t.primaryContainer }]}>
              <Icon name={icon} color={t.onPrimaryContainer} decorative />
            </View>
            <Text style={[styles.body, styles.flex, { color: t.onSurface }]}>{text}</Text>
          </View>
        ))}
        <Banner icon="info" title="Матеріал курсу" text="Чернетку сценарію згенерував ШІ, викладач перевірив і схвалив її." />
      </Layout>
    );
  }

  if (phase === 'debrief') {
    const d = debrief(scenario, picks);
    return (
      <Layout
        title="Розбір сценарію"
        onBack={onExit}
        backLabel="До теми"
        action={{ label: 'Пройти ще раз', onPress: restart }}
        secondary={{ label: 'До теми', onPress: onExit }}
      >
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.outline }]}>
          <Text accessibilityRole="header" style={[styles.h2, { color: t.onSurface }]}>
            {d.optimal} з {d.total} рішень оптимальні
          </Text>
          <Text style={[styles.caption, { color: t.onSurfaceVariant }]}>Фінал: «{d.ending.title}»</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.h3, { color: t.onSurface }]}>
          Ваш шлях
        </Text>
        {d.path.map((p, i) => (
          <Option key={p.step.id} label={`${i + 1}. ${p.choice.label}`} state={p.choice.best ? 'correct' : 'incorrect'} />
        ))}
        {d.path.map((p, i) =>
          p.choice.best ? null : (
            <Banner key={p.step.id} icon="alert" tone="error" title={`Помилка на кроці ${i + 1}`} text={`${p.choice.why ?? ''}\nКраще: ${p.best.label.toLowerCase()}.`} />
          ),
        )}
        {d.optimal === d.total && <Banner icon="check" title="Без помилок" text="На кожному кроці ви обрали найкращу дію." />}
      </Layout>
    );
  }

  // step or consequence: `at` is the step being answered (or just answered)
  if (!('step' in at)) return null;
  const step = at.step;
  const n = picks.length + (phase === 'step' ? 1 : 0);

  if (phase === 'consequence') {
    const choice = choiceOf(scenario, picks[picks.length - 1]);
    const finished = 'ending' in position(scenario, picks);
    return (
      <Layout
        onBack={onExit}
        backLabel="Вийти"
        action={{ label: finished ? 'До розбору' : 'Далі', onPress: () => (setSelected(null), setPhase(finished ? 'debrief' : 'step')) }}
      >
        <Text style={[styles.caption, { color: t.onSurfaceVariant }]}>
          Крок {n} з {total} · наслідок вашого рішення
        </Text>
        <Option label={choice.label} state="selected" />
        <View accessibilityLiveRegion="polite">
          <Banner icon="info" title="Що змінилось" text={choice.consequence} />
        </View>
      </Layout>
    );
  }

  return (
    <Layout
      onBack={onExit}
      backLabel="Вийти"
      action={{
        label: 'Обрати дію',
        disabled: !selected,
        onPress: () => selected && (setPicks([...picks, { step: step.id, choice: selected }]), setPhase('consequence')),
      }}
    >
      <Text style={[styles.caption, { color: t.onSurfaceVariant }]}>
        {scenario.title} · крок {n} з {total}
      </Text>
      <Text accessibilityRole="header" style={[styles.h2, { color: t.onSurface }]}>
        {step.situation}
      </Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {step.choices.map((c) => (
          <Option key={c.id} label={c.label} state={c.id === selected ? 'selected' : 'default'} onPress={() => setSelected(c.id)} />
        ))}
      </View>
    </Layout>
  );
}

interface Action {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function Layout(props: { title?: string; onBack: () => void; backLabel: string; action: Action; secondary?: Action; children: ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: t.background, paddingTop: TOP, paddingBottom: BOTTOM }]}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel={props.backLabel} onPress={props.onBack} hitSlop={8} style={styles.back}>
          <Icon name="arrow-left" decorative />
        </Pressable>
        {props.title && (
          <Text accessibilityRole="header" style={[styles.title, { color: t.onSurface }]}>
            {props.title}
          </Text>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content}>{props.children}</ScrollView>
      <Button {...props.action} primary />
      {props.secondary && <Button {...props.secondary} />}
    </View>
  );
}

function Button({ label, onPress, disabled, primary }: Action & { primary?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, primary ? { backgroundColor: t.primary, opacity: disabled ? 0.4 : 1 } : null]}
    >
      <Text style={[styles.buttonText, { color: primary ? t.onPrimary : t.primary }]}>{label}</Text>
    </Pressable>
  );
}

type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

/** Same look as the AnswerOption component in Figma. */
function Option({ label, state, onPress }: { label: string; state: OptionState; onPress?: () => void }) {
  const t = useTheme();
  const bad = state === 'incorrect';
  const on = state !== 'default';
  const tone = bad ? t.error : t.primary;
  const icon: IconName | null = state === 'default' ? null : bad ? 'x' : 'check';
  return (
    <Pressable
      accessibilityRole={onPress ? 'radio' : 'text'}
      accessibilityState={onPress ? { checked: state === 'selected' } : undefined}
      accessibilityLabel={state === 'correct' ? `${label}. Оптимальне рішення` : bad ? `${label}. Помилка` : label}
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.option,
        { backgroundColor: on ? (bad ? t.errorContainer : t.primaryContainer) : t.surface, borderColor: on ? tone : t.outline, borderWidth: on ? 2 : 1 },
      ]}
    >
      <View style={[styles.indicator, { borderColor: on ? tone : t.onSurfaceVariant, backgroundColor: on ? tone : 'transparent' }]}>
        {icon && <Icon name={icon} size={16} color={bad ? t.errorContainer : t.onPrimary} decorative />}
      </View>
      <Text style={[styles.optionText, { color: bad ? t.onErrorContainer : on ? t.onPrimaryContainer : t.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

function Banner({ icon, title, text, tone }: { icon: IconName; title: string; text: string; tone?: 'error' }) {
  const t = useTheme();
  const fg = tone ? t.onErrorContainer : t.onPrimaryContainer;
  return (
    <View style={[styles.banner, { backgroundColor: tone ? t.errorContainer : t.primaryContainer }]}>
      <Icon name={icon} color={fg} decorative />
      <View style={styles.flex}>
        <Text style={[styles.bannerTitle, { color: fg }]}>{title}</Text>
        <Text style={[styles.caption, { color: fg }]}>{text}</Text>
      </View>
    </View>
  );
}

// no fixed heights on text containers: everything grows with the system font scale
const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  back: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700' },
  content: { gap: 12, paddingVertical: 12 },
  h1: { fontSize: 22, fontWeight: '700' },
  h2: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
  h3: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  body: { fontSize: 15, lineHeight: 21 },
  caption: { fontSize: 13, lineHeight: 18 },
  flex: { flex: 1 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  options: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  indicator: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: 16 },
  card: { padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  banner: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 12 },
  bannerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  button: { minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
