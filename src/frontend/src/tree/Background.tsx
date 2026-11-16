import { Circle, Group, LinearGradient, Oval, Path, RadialGradient, Rect, Skia, vec, type Transforms3d } from '@shopify/react-native-skia';
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
  cloud: string;
  flowers: string[];
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
    cloud: 'rgba(255,244,232,0.85)',
    flowers: ['#FFFFFF', '#FFD86B', '#F7A8C4'],
  },
  day: {
    sky: ['#3B8BD6', '#86C2EE', '#DCF0FB'],
    hills: ['#A3CBB5', '#74B182', '#4F985B'],
    ground: ['#5CA849', '#3A7630'],
    grass: '#479A3B',
    orb: '#FFFBE0',
    orbAt: [0.74, 0.12],
    veil: 'rgba(0,0,0,0)',
    cloud: 'rgba(255,255,255,0.9)',
    flowers: ['#FFFFFF', '#FFE066', '#F59AC0'],
  },
  evening: {
    sky: ['#2A2A62', '#C2567C', '#F8A65C'],
    hills: ['#77608C', '#544874', '#37335E'],
    ground: ['#3F6040', '#24412C'],
    grass: '#35573A',
    orb: '#FFC27A',
    orbAt: [0.8, 0.46],
    veil: 'rgba(60,24,70,0.2)',
    cloud: 'rgba(255,190,170,0.5)',
    flowers: ['#D9C7E8', '#E8B36A', '#C77FA6'],
  },
  night: {
    sky: ['#040A22', '#0E1D48', '#26376A'],
    hills: ['#1C2B50', '#152240', '#0E1931'],
    ground: ['#18372C', '#0C2019'],
    grass: '#143126',
    orb: '#E9EEFF',
    orbAt: [0.72, 0.14],
    veil: 'rgba(4,8,36,0.45)',
    cloud: 'rgba(120,140,200,0.22)',
    flowers: ['#6F7FB0', '#7C7A9C', '#5C6C9C'],
  },
};

const mix = (a: string, b: string, t: number) => {
  const ca = Skia.Color(a);
  const cb = Skia.Color(b);
  return Float32Array.of(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t, 1);
};

/** Smooth rolling silhouette in screen space, three times wider than the canvas so parallax never shows an edge. */
function hill(w: number, h: number, base: number, amp: number, seed: number) {
  const r = mulberry32(seed);
  const l1 = 520 + r() * 380;
  const l2 = 170 + r() * 130;
  const p1 = r() * 6;
  const p2 = r() * 6;
  const b = Skia.PathBuilder.Make();
  b.moveTo(-w, h * 3);
  for (let x = -w; x <= 2 * w; x += 6) {
    b.lineTo(x, base - amp * (0.58 + 0.42 * Math.sin((x / l1) * 6.283 + p1) + 0.13 * Math.sin((x / l2) * 6.283 + p2)));
  }
  b.lineTo(2 * w, h * 3);
  b.close();
  return b.build();
}

/** A band of puffy clouds, `period` wide, so two copies side by side scroll seamlessly. */
function clouds(period: number, top: number, bottom: number, count: number, seed: number) {
  const r = mulberry32(seed);
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < count; i++) {
    const cx = ((i + 0.2 + r() * 0.6) / count) * period;
    const cy = top + r() * (bottom - top);
    const s = 16 + r() * 16;
    b.addOval({ x: cx - s * 2.6, y: cy - s * 0.35, width: s * 5.2, height: s * 0.95 });
    b.addCircle(cx - s * 1.1, cy - s * 0.35, s * 0.8);
    b.addCircle(cx, cy - s * 0.7, s * 1.1);
    b.addCircle(cx + s * 1.2, cy - s * 0.3, s * 0.75);
  }
  return b.build();
}

interface Props {
  w: number;
  h: number;
  /** Screen y of the ground line at zoom 1. */
  horizon: number;
  time: TimeOfDay;
  /** Parallax transforms for the three hill planes, far → near. */
  parallax: SharedValue<Transforms3d>[];
  /** Cloud drift transforms for the far and the near cloud band; each band repeats every `period` px. */
  drift: SharedValue<Transforms3d>[];
  period: number;
}

/** Sky gradient by time of day, sun/moon with glow, stars, drifting clouds and 3 hazy hill planes. */
export function Sky({ w, h, horizon, time, parallax, drift, period }: Props) {
  const p = PALETTE[time];
  const hills = useMemo(
    () => [hill(w, h, horizon - h * 0.06, h * 0.21, 11), hill(w, h, horizon - h * 0.025, h * 0.135, 23), hill(w, h, horizon + h * 0.012, h * 0.075, 37)],
    [w, h, horizon],
  );
  const bands = useMemo(
    () => [clouds(period, horizon * 0.1, horizon * 0.3, 4, 3), clouds(period, horizon * 0.22, horizon * 0.5, 3, 8)],
    [period, horizon],
  );
  const stars = useMemo(() => {
    const r = mulberry32(5);
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < 90; i++) b.addCircle(r() * w, r() * horizon * 0.85, 0.5 + r() * 1.2);
    return b.build();
  }, [w, horizon]);
  const haze = p.sky[2];
  const ox = w * p.orbAt[0];
  const oy = horizon * p.orbAt[1] * 1.6;
  const orb = Math.min(w, h) * 0.05;
  return (
    <>
      <Rect x={0} y={0} width={w} height={h}>
        <LinearGradient start={vec(0, 0)} end={vec(0, horizon)} colors={p.sky} />
      </Rect>
      {time === 'night' && <Path path={stars} color="rgba(255,255,255,0.85)" />}
      <Circle cx={ox} cy={oy} r={orb * 7}>
        <RadialGradient c={vec(ox, oy)} r={orb * 7} colors={[mix(p.orb, haze, 0.1), 'rgba(255,255,255,0)']} positions={[0, 1]} />
      </Circle>
      <Circle cx={ox} cy={oy} r={orb * 1.7} color={p.orb} opacity={0.28} />
      <Circle cx={ox} cy={oy} r={orb} color={p.orb} />
      {bands.map((path, i) => (
        <Group key={i} transform={drift[i]} opacity={i === 0 ? 0.7 : 1}>
          <Path path={path} color={p.cloud} />
          <Path path={path} color={p.cloud} transform={[{ translateX: -period }]} />
        </Group>
      ))}
      {hills.map((path, i) => (
        <Group key={i} transform={parallax[i]}>
          <Path path={path}>
            {/* aerial perspective: far planes dissolve into the sky colour towards their base */}
            <LinearGradient
              start={vec(0, horizon - h * (0.27 - i * 0.08))}
              end={vec(0, horizon + h * 0.04)}
              colors={[mix(p.hills[i], haze, 0.1), mix(p.hills[i], haze, 0.55 - i * 0.18)]}
            />
          </Path>
        </Group>
      ))}
    </>
  );
}

/** Ground, tree shadow, grass and flowers in world space (they move and zoom together with the tree). */
export function Ground({ time, front }: { time: TimeOfDay; front?: boolean }) {
  const p = PALETTE[time];
  const grass = useMemo(() => {
    const r = mulberry32(front ? 91 : 17);
    const b = Skia.PathBuilder.Make();
    for (let x = -900; x < 1900; x += front ? 11 : 7) {
      const bx = x + r() * 8;
      const hgt = (front ? 14 : 10) + r() * (front ? 24 : 14);
      const lean = (r() - 0.5) * 14;
      const y = GROUND_Y + (front ? 14 + r() * 60 : 3);
      b.moveTo(bx - 2.8, y);
      b.quadTo(bx - 1 + lean * 0.3, y - hgt * 0.6, bx + lean, y - hgt);
      b.quadTo(bx + 1 + lean * 0.3, y - hgt * 0.6, bx + 2.8, y);
      b.close();
    }
    return b.build();
  }, [front]);
  const flowers = useMemo(() => {
    const r = mulberry32(64);
    const paths = [Skia.PathBuilder.Make(), Skia.PathBuilder.Make(), Skia.PathBuilder.Make()];
    for (let i = 0; i < 70; i++) {
      const x = -500 + r() * 2000;
      const y = GROUND_Y + 6 + r() * 78;
      const s = 2.2 + r() * 2.2;
      const b = paths[i % 3];
      for (let k = 0; k < 5; k++) b.addCircle(x + Math.cos(k * 1.257) * s, y + Math.sin(k * 1.257) * s, s * 0.72);
    }
    return paths.map((b) => b.build());
  }, []);
  if (front) {
    return (
      <>
        <Path path={grass} color={p.grass} />
        {flowers.map((path, i) => (
          <Path key={i} path={path} color={p.flowers[i]} />
        ))}
      </>
    );
  }
  return (
    <>
      <Path path={grass} color={p.ground[0]} />
      <Rect x={-6000} y={GROUND_Y} width={13000} height={7000}>
        <LinearGradient start={vec(0, GROUND_Y)} end={vec(0, GROUND_Y + 260)} colors={p.ground} />
      </Rect>
      <Oval x={320} y={GROUND_Y - 6} width={360} height={34} color="rgba(0,0,0,0.2)" />
    </>
  );
}
