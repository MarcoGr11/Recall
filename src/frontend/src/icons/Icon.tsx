import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme';
import { ICONS, type IconDef, type IconName } from './paths';

export { ICONS, type IconName };

interface Props {
  name: IconName;
  size?: number;
  /** Outline colour, on-surface by default. */
  color?: string;
  /** Accent fill colour (drawn at 30 %), primary by default. */
  accent?: string;
  /** Overrides the default accessibilityLabel. */
  label?: string;
  /** Hide from screen readers when the parent control already names the action. */
  decorative?: boolean;
}

export function Icon({ name, size = 24, color, accent, label, decorative }: Props) {
  const theme = useTheme();
  const def: IconDef = ICONS[name];
  // the wrapper carries the accessibility props: react-native-svg forwards unknown ones to the DOM on web
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : (label ?? def.label)}
      aria-hidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {def.a && <Path d={def.a} fill={accent ?? theme.primary} fillOpacity={0.3} />}
        <Path d={def.s} fill="none" stroke={color ?? theme.onSurface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}
