import { Circle, Group, LinearGradient, Path, Rect, Skia, vec, type Transforms3d } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { GROUND_Y, mulberry32 } from './generate';

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';
export const TIMES: TimeOfDay[] = ['morning', 'day', 'evening', 'night'];

export function timeOfDayAt(hour: number): TimeOfDay {
  return hour >= 5 && hour < 10 ? 'morning' : hour >= 10 && hour < 17 ? 'day' : hour >= 17 && hour < 21 ? 'evening' : 'night';
}

interface Palette {
  sky: string[];
  /** far → near */
  hills: string[];
  ground: string[];
  grass: string;
  orb: string;
  /** sun / moon position as a fraction of the canvas */
  orbAt: [number, number];
  /** tint laid over the whole scene */
  veil: string;
}

export const PALETTE: Record<TimeOfDay, Palette> = {
  morning: {
    sky: ['#7FB6E6', '#F4D3B5', '#FCEBCB'],
    hills: ['#B5CDBE', '#8DB698', '#679F6F'],
    ground: ['#63A152', '#3F7035'],
    grass: '#4F8E42',
    orb: '#FFF1BF',
    orbAt: [0.2, 0.34],
    veil: 'rgba(255,214,170,0.08)',
  },
  day: {
    sky: ['#3B8BD6', '#86C2EE', '#DCF0FB'],
    hills: ['#A3CBB5', '#74B182', '#4F985B'],
    ground: ['#5CA849', '#3A7630'],
    grass: '#479A3B',
    orb: '#FFFBE0',
    orbAt: [0.74, 0.12],
    veil: 'rgba(0,0,0,0)',
  },
  evening: {
    sky: ['#2A2A62', '#C2567C', '#F8A65C'],
    hills: ['#77608C', '#544874', '#37335E'],
    ground: ['#3F6040', '#24412C'],
    grass: '#35573A',
    orb: '#FFC27A',
    orbAt: [0.8, 0.46],
    veil: 'rgba(60,24,70,0.2)',
  },
  night: {
    sky: ['#040A22', '#0E1D48', '#26376A'],
    hills: ['#1C2B50', '#152240', '#0E1931'],
    ground: ['#18372C', '#0C2019'],
    grass: '#143126',
    orb: '#E9EEFF',
    orbAt: [0.72, 0.14],
    veil: 'rgba(4,8,36,0.45)',
  },
};

/** Rolling silhouette in screen space, three times wider than the canvas so parallax never shows an edge. */
function hill(w: number, h: number, base: number, amp: number, seed: number) {
  const r = mulberry32(seed);
  const f1 = (2 + r() * 2) / w;
  const f2 = (5 + r() * 4) / w;
  const p1 = r() * 6;
  const p2 = r() * 6;
  const pts = [{ x: -w, y: h * 3 }];
  for (let x = -w; x <= 2 * w; x += 16) {
    pts.push({ x, y: base - amp * (0.6 + 0.4 * Math.sin(x * f1 * Math.PI + p1) + 0.18 * Math.sin(x * f2 * Math.PI + p2)) });
  }
  pts.push({ x: 2 * w, y: h * 3 });
  return Skia.Path.Polygon(pts, true);
}

interface Props {
  w: number;
  h: number;
  /** Screen y of the ground line at zoom 1. */
  horizon: number;
  time: TimeOfDay;
  /** Parallax transforms for the three hill planes, far → near. */
  parallax: SharedValue<Transforms3d>[];
}

/** Sky gradient by time of day, sun/moon, stars and 3 hill planes. */
export function Sky({ w, h, horizon, time, parallax }: Props) {
  const p = PALETTE[time];
  const hills = useMemo(
    () => [hill(w, h, horizon - h * 0.05, h * 0.2, 11), hill(w, h, horizon - h * 0.02, h * 0.13, 23), hill(w, h, horizon + h * 0.01, h * 0.075, 37)],
    [w, h, horizon],
  );
  const stars = useMemo(() => {
    const r = mulberry32(5);
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < 70; i++) b.addCircle(r() * w, r() * horizon * 0.8, 0.5 + r() * 1.1);
    return b.build();
  }, [w, horizon]);
  return (
    <>
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient start={vec(0, 0)} end={vec(0, horizon)} colors={p.sky} />
      </Rect>
      {time === 'night' && <Path path={stars} color="rgba(255,255,255,0.8)" />}
      <Circle cx={w * p.orbAt[0]} cy={horizon * p.orbAt[1] * 1.6} r={Math.min(w, h) * 0.085} color={p.orb} opacity={0.22} />
      <Circle cx={w * p.orbAt[0]} cy={horizon * p.orbAt[1] * 1.6} r={Math.min(w, h) * 0.05} color={p.orb} />
      {hills.map((path, i) => (
        <Group key={i} transform={parallax[i]}>
          <Path path={path} color={p.hills[i]} />
        </Group>
      ))}
    </>
  );
}

/** Ground and grass in world space (they move and zoom together with the tree). */
export function Ground({ time, front }: { time: TimeOfDay; front?: boolean }) {
  const p = PALETTE[time];
  const grass = useMemo(() => {
    const r = mulberry32(front ? 91 : 17);
    const b = Skia.PathBuilder.Make();
    for (let x = -700; x < 1700; x += front ? 13 : 9) {
      const bx = x + r() * 8;
      const hgt = (front ? 12 : 9) + r() * (front ? 20 : 12);
      const lean = (r() - 0.5) * 12;
      const y = GROUND_Y + (front ? 16 + r() * 22 : 3);
      b.addPoly([{ x: bx - 2.6, y }, { x: bx + lean, y: y - hgt }, { x: bx + 2.6, y }], true);
    }
    return b.build();
  }, [front]);
  if (front) return <Path path={grass} color={p.grass} />;
  return (
    <>
      <Path path={grass} color={p.ground[0]} />
      <Rect x={-6000} y={GROUND_Y} width={13000} height={7000}>
        <LinearGradient start={vec(0, GROUND_Y)} end={vec(0, GROUND_Y + 260)} colors={p.ground} />
      </Rect>
    </>
  );
}
