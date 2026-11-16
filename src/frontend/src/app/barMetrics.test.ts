import { THEMES } from '../theme';
import { barContrast, contrast } from './barMetrics';

describe('translucent tab bar', () => {
  it('computes WCAG contrast', () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
    expect(contrast([255, 255, 255], [255, 255, 255])).toBe(1);
  });

  // icons and labels on the translucent bar use on-surface; the scene behind can be anything from night to clouds
  it.each(['light', 'dark'] as const)('keeps icons and labels at 4.5:1 over any scene (%s theme)', (scheme) => {
    const t = THEMES[scheme];
    for (const backdrop of [[0, 0, 0], [255, 255, 255], [92, 168, 73], [59, 139, 214], [248, 166, 92]]) {
      expect(barContrast(t.onSurface, t.surface, backdrop)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
