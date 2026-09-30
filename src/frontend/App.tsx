import { StatusBar } from 'expo-status-bar';
import KnowledgeTreeScreen from './src/features/knowledge-tree/KnowledgeTreeScreen';

export default function App() {
  return (
    <>
      <KnowledgeTreeScreen />
      <StatusBar style="light" />
    </>
  );
}
