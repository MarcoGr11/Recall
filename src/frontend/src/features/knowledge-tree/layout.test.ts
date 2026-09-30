import { describe, expect, it } from "@jest/globals";
import { computeTreeLayout, TreeLayout, TreeMeta } from "./layout";
import metaJson from "./tree-meta.json";

const meta = metaJson as unknown as TreeMeta;

const layoutFor = (n: number): TreeLayout =>
  computeTreeLayout(
    Array.from({ length: n }, (_, i) => ({ id: `c${i}`, topicCount: 1 + ((i * 3) % 8) })),
    5,
    meta,
  );

const numbersIn = (v: unknown): number[] =>
  typeof v === "number" ? [v]
  : typeof v === "string" ? (v.match(/-?[\d.]+(e-?\d+)?|NaN|Infinity/g) ?? []).map(Number)
  : v && typeof v === "object" ? Object.values(v).flatMap(numbersIn)
  : [];

describe.each(Array.from({ length: 10 }, (_, i) => i + 1))("computeTreeLayout with %i course(s)", n => {
  const layout = layoutFor(n);

  it("produces only finite numbers (incl. transform strings)", () => {
    const nums = numbersIn(layout);
    expect(nums.length).toBeGreaterThan(0);
    expect(nums.filter(x => !Number.isFinite(x))).toEqual([]);
  });

  it("gives each branch exactly topicCount leaf slots", () => {
    expect(layout.branches).toHaveLength(n);
    layout.branches.forEach((b, i) => expect(b.leafSlots).toHaveLength(1 + ((i * 3) % 8)));
  });

  it("alternates branches left / right", () => {
    layout.branches.forEach((b, i) => {
      expect(b.side).toBe(i % 2 === 0 ? -1 : 1);
      if (i > 0) expect(b.side).toBe(-layout.branches[i - 1].side as -1 | 1);
    });
  });

  it("keeps every leaf slot inside the viewBox", () => {
    const { x, y, width, height } = layout.viewBox;
    const slots = [...layout.branches.flatMap(b => b.leafSlots), ...layout.trunkLeafSlots];
    slots.forEach(s => {
      expect(s.x).toBeGreaterThanOrEqual(x);
      expect(s.x).toBeLessThanOrEqual(x + width);
      expect(s.y).toBeGreaterThanOrEqual(y);
      expect(s.y).toBeLessThanOrEqual(y + height);
    });
  });
});
