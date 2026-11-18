import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { BAR_TOTAL } from './src/app/barMetrics';
import { ProfileScreen, ScenesScreen, StateScreen } from './src/app/screens';
import { TabBar, type Tab } from './src/app/TabBar';
import { SCENARIOS } from './src/scenario/mockScenarios';
import type { Scenario } from './src/scenario/model';
import { ScenarioScreen } from './src/scenario/ScenarioScreen';
import { SchemeContext, useTheme, type Scheme } from './src/theme';
import KnowledgeTreeScreen from './src/tree/KnowledgeTreeScreen';

const TABS: Tab[] = [
  { key: 'today', title: 'Сьогодні', icon: 'home' },
  { key: 'tree', title: 'Дерево', icon: 'tree' },
  { key: 'courses', title: 'Курси', icon: 'book' },
  { key: 'inbox', title: 'Сповіщення', icon: 'bell' },
  { key: 'profile', title: 'Профіль', icon: 'user' },
];

// web only: ?scenes=light|dark opens the dev gallery directly in that theme, ?scenario=<id> opens a trainer (used for screenshots)
const params = Platform.OS === 'web' && typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
const query = params?.get('scenes') ?? null;
const startScenario = SCENARIOS.find((s) => s.id === params?.get('scenario')) ?? null;

function Shell({ scheme, onScheme }: { scheme: Scheme; onScheme: (s: Scheme) => void }) {
  const theme = useTheme();
  const [tab, setTab] = useState(query ? 'profile' : 'tree');
  const [scenes, setScenes] = useState(!!query);
  const [scenario, setScenario] = useState<Scenario | null>(startScenario);
  const onTree = tab === 'tree';
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ flex: 1 }}>
        {/* ponytail: the tabs other than the tree are state placeholders until the real screens and data exist */}
        {tab === 'today' && (
          <StateScreen
            title="Сьогодні"
            scene="empty-plan"
            heading="На сьогодні все повторено"
            text="Нові питання з’являться завтра. Можна пройти пробний тест або переглянути дерево знань."
            action={{ label: 'До дерева знань', onPress: () => setTab('tree') }}
          />
        )}
        {/* the scene runs under the translucent bar, so the tree screen gets the full height */}
        {onTree && <KnowledgeTreeScreen bottomInset={BAR_TOTAL} onScenario={setScenario} paused={!!scenario} />}
        {tab === 'courses' && (
          <StateScreen
            title="Курси"
            scene="empty-courses"
            heading="Ще немає курсів"
            text="Приєднайтеся до курсу за кодом запрошення від викладача."
            action={{ label: 'Ввести код', onPress: () => setTab('profile') }}
          />
        )}
        {tab === 'inbox' && (
          <StateScreen title="Сповіщення" scene="offline" heading="Немає з’єднання" text="Перевірте інтернет і спробуйте ще раз. Незбережених відповідей немає." />
        )}
        {tab === 'profile' &&
          (scenes ? <ScenesScreen onBack={() => setScenes(false)} /> : <ProfileScreen scheme={scheme} onScheme={onScheme} onOpenScenes={() => setScenes(true)} />)}
      </View>
      <TabBar tabs={TABS} active={tab} onChange={setTab} translucent={onTree} />
      {/* the trainer covers everything, tab bar included, like a test; the tree stays mounted (paused) so "До теми" returns to the same topic */}
      {scenario && (
        <View style={StyleSheet.absoluteFill}>
          <ScenarioScreen scenario={scenario} onExit={() => setScenario(null)} />
        </View>
      )}
      <StatusBar style={onTree && !scenario ? 'light' : theme.dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  const forced = query ?? params?.get('theme');
  const [scheme, setScheme] = useState<Scheme>(forced === 'light' || forced === 'dark' ? forced : 'system');
  return (
    <SchemeContext.Provider value={scheme}>
      <Shell scheme={scheme} onScheme={setScheme} />
    </SchemeContext.Provider>
  );
}
