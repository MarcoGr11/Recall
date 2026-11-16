import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

/** Colour tokens, same names and values as the `Color` variable collection in the Figma file. */
const light = {
  primary: '#2E7D4F',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D6F2DF',
  onPrimaryContainer: '#0B3D21',
  background: '#F4F7F2',
  surface: '#FFFFFF',
  surfaceVariant: '#E7EDE6',
  onSurface: '#17211A',
  onSurfaceVariant: '#4A564D',
  outline: '#C3CCC4',
  mastery50: '#F2CC33',
  sceneHillFar: '#DDEADF',
  sceneHillMid: '#C9DFCC',
  sceneHillNear: '#B4D3B8',
  sceneOrb: '#F6D465',
  sceneStar: '#F4F7F2',
};

export type Theme = typeof light & { dark: boolean };

const dark: typeof light = {
  primary: '#7FD6A0',
  onPrimary: '#00391A',
  primaryContainer: '#1E5C39',
  onPrimaryContainer: '#C9F2D8',
  background: '#0F1411',
  surface: '#1A211C',
  surfaceVariant: '#2A332C',
  onSurface: '#E6ECE6',
  onSurfaceVariant: '#B4C0B6',
  outline: '#445048',
  mastery50: '#F2CC33',
  sceneHillFar: '#141D18',
  sceneHillMid: '#18241D',
  sceneHillNear: '#1D2C23',
  sceneOrb: '#DCE3F5',
  sceneStar: '#FFFFFF',
};

export const THEMES: Record<'light' | 'dark', Theme> = { light: { ...light, dark: false }, dark: { ...dark, dark: true } };

export type Scheme = 'system' | 'light' | 'dark';
/** Lets a screen (or the dev theme switch) force a scheme; 'system' follows the device. */
export const SchemeContext = createContext<Scheme>('system');

export function useTheme(): Theme {
  const forced = useContext(SchemeContext);
  const system = useColorScheme();
  return THEMES[forced === 'system' ? (system === 'dark' ? 'dark' : 'light') : forced];
}
