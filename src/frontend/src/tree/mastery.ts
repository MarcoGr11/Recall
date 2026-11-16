import type { Topic } from './types';

/** Below this mastery the leaf falls off and only a bud stays. */
export const FALL_THRESHOLD = 0.2;
/** A topic not reviewed for longer than this starts turning yellow. */
export const STALE_DAYS = 14;
const DAY = 86_400_000;

const STOPS = [
  [0.52, 0.2, 0.12], // red-brown
  [0.95, 0.8, 0.2], // yellow
  [0.13, 0.62, 0.2], // rich green
];

/** mastery 0..1 → [r, g, b] in 0..1, smooth across red-brown → yellow → green. */
export function masteryColor(mastery: number): [number, number, number] {
  'worklet';
  const m = Math.min(1, Math.max(0, mastery)) * 2;
  const a = m < 1 ? STOPS[0] : STOPS[1];
  const b = m < 1 ? STOPS[1] : STOPS[2];
  const t = m < 1 ? m : m - 1;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Mastery as shown on the tree: green leaves fade to yellow when the topic is not reviewed. */
export function vitality(topic: Topic, nowMs: number): number {
  if (!topic.lastReviewedAt || topic.mastery <= 0.5) return topic.mastery;
  const days = (nowMs - Date.parse(topic.lastReviewedAt)) / DAY;
  const fade = Math.min(1, Math.max(0, (days - STALE_DAYS) / STALE_DAYS));
  return topic.mastery + (0.5 - topic.mastery) * fade;
}

export function isDue(topic: Topic, nowMs: number): boolean {
  return !!topic.dueAt && Date.parse(topic.dueAt) <= nowMs;
}
