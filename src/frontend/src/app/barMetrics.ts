import { Platform } from 'react-native';

/** Tab row height and the home-indicator inset below it. */
export const BAR_H = 64;
// ponytail: fixed bottom inset instead of react-native-safe-area-context, same as TOP_INSET on the tree screen
export const BAR_INSET = Platform.OS === 'ios' ? 24 : 0;
export const BAR_TOTAL = BAR_H + BAR_INSET;

/** Translucent bar over the tree scene: blurred scene + surface at BAR_ALPHA + a surface gradient underlay. */
export const BAR_BLUR = 20;
export const BAR_ALPHA = 0.6;
/** The underlay starts SCRIM_LEAD px above the bar and is already SCRIM_TOP opaque at its top edge. */
export const SCRIM_LEAD = 24;
export const SCRIM_TOP = 0.4;
export const SCRIM_BOTTOM = 0.55;

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
/** '#RRGGBB' → 'rgba(r,g,b,a)'. */
export const withAlpha = (hex: string, a: number) => `rgba(${channel(hex, 0)},${channel(hex, 1)},${channel(hex, 2)},${a})`;
const lin = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : Math.pow((v / 255 + 0.055) / 1.055, 2.4));
const luminance = (rgb: number[]) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);

/** WCAG contrast ratio of two opaque colours given as [r, g, b] 0..255. */
export function contrast(a: number[], b: number[]): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Worst-case contrast of bar content against the translucent bar when the scene behind it is `backdrop`:
 * the weakest spot is the top edge, where the underlay is only SCRIM_TOP opaque.
 */
export function barContrast(content: string, surface: string, backdrop: number[]): number {
  const alpha = 1 - (1 - BAR_ALPHA) * (1 - SCRIM_TOP);
  const bg = [0, 1, 2].map((i) => channel(surface, i) * alpha + backdrop[i] * (1 - alpha));
  return contrast([0, 1, 2].map((i) => channel(content, i)), bg);
}
