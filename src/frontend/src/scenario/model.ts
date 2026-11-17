/**
 * Branching decision scenario: steps with choices, each choice leads to another step or to an ending.
 * Same shape the generation worker is expected to produce (and the teacher to approve) before students see it.
 */
export interface Choice {
  id: string;
  label: string;
  /** Id of the next step or of an ending. */
  next: string;
  /** What happened because of this choice; shown right after it. */
  consequence: string;
  /** The choice an experienced engineer would make here. */
  best?: boolean;
  /** Why this choice is (not) the best one; shown in the debrief. */
  why?: string;
}

export interface Step {
  id: string;
  situation: string;
  choices: Choice[];
}

export interface Ending {
  id: string;
  title: string;
}

export interface Scenario {
  id: string;
  topicId: string;
  title: string;
  minutes: number;
  start: string;
  steps: Record<string, Step>;
  endings: Record<string, Ending>;
}

/** One answered step of a run. */
export interface Pick {
  step: string;
  choice: string;
}

export const choiceOf = (s: Scenario, p: Pick): Choice => s.steps[p.step].choices.find((c) => c.id === p.choice)!;

/** Where the run stands after these picks: the next step, or the ending it reached. */
export function position(s: Scenario, picks: Pick[]): { step: Step } | { ending: Ending } {
  const id = picks.length ? choiceOf(s, picks[picks.length - 1]).next : s.start;
  return s.steps[id] ? { step: s.steps[id] } : { ending: s.endings[id] };
}

/** Longest number of steps from the start to any ending; the "N з M" counter uses it. */
export function depth(s: Scenario, from = s.start): number {
  const step = s.steps[from];
  return step ? 1 + Math.max(...step.choices.map((c) => depth(s, c.next))) : 0;
}

export interface Debrief {
  ending: Ending;
  optimal: number;
  total: number;
  path: { step: Step; choice: Choice; best: Choice }[];
}

export function debrief(s: Scenario, picks: Pick[]): Debrief {
  const end = position(s, picks);
  if (!('ending' in end)) throw new Error('scenario is not finished');
  const path = picks.map((p) => {
    const step = s.steps[p.step];
    return { step, choice: choiceOf(s, p), best: step.choices.find((c) => c.best)! };
  });
  return { ending: end.ending, optimal: path.filter((x) => x.choice.best).length, total: path.length, path };
}

/**
 * Structural problems that would break a run; empty when the scenario is playable.
 * The same rules apply to AI drafts before moderation.
 */
export function validate(s: Scenario): string[] {
  const errors: string[] = [];
  const exists = (id: string) => id in s.steps || id in s.endings;
  if (!s.steps[s.start]) errors.push(`start "${s.start}" is not a step`);
  for (const step of Object.values(s.steps)) {
    if (step.choices.length < 2) errors.push(`step "${step.id}" needs at least 2 choices`);
    if (step.choices.filter((c) => c.best).length !== 1) errors.push(`step "${step.id}" needs exactly one best choice`);
    for (const c of step.choices) if (!exists(c.next)) errors.push(`choice "${c.id}" leads to unknown "${c.next}"`);
  }
  if (errors.length) return errors;
  // every step reachable from the start, and no loops (a run must always end)
  const state = new Map<string, 'open' | 'done'>();
  const walk = (id: string) => {
    if (!s.steps[id] || state.get(id) === 'done') return;
    if (state.get(id) === 'open') return void errors.push(`loop through "${id}"`);
    state.set(id, 'open');
    for (const c of s.steps[id].choices) walk(c.next);
    state.set(id, 'done');
  };
  walk(s.start);
  for (const id of Object.keys(s.steps)) if (!state.has(id)) errors.push(`step "${id}" is unreachable`);
  return errors;
}
