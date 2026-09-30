/** SM-2 helpers shared by the tree and the rest of the app. */
export type Zone = "mastered" | "review" | "weak" | "gap";

/** Maps SM-2 ease factor (1.3 … 2.5+) to 0–100 %. Formula from docs/08. */
export const masteryFromEase = (ef: number) => Math.max(0, Math.min(100, Math.round((ef - 1.3) / 1.2 * 100)));

export const zoneOf = (m: number): Zone => (m >= 85 ? "mastered" : m >= 60 ? "review" : m >= 35 ? "weak" : "gap");

export const ZONE_COLOR: Record<Zone, string> = { mastered: "#86B86B", review: "#E9B44C", weak: "#E4803F", gap: "#DA5552" };

/** SM-2 ease update. q: 0–5 answer quality. */
export const nextEase = (ef: number, q: number) => Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
