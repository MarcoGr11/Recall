import { StatusBar } from 'expo-status-bar';

import KnowledgeTreeScreen from './src/tree/KnowledgeTreeScreen';

export default function App() {
  return (
    <>
      <KnowledgeTreeScreen />
      <StatusBar style="light" />
    </>
  );
}
