import { debrief, depth, position, validate, type Scenario } from './model';
import { INCIDENT, SCENARIOS } from './mockScenarios';

describe('scenario model', () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))('demo scenario %s is playable', (_, s) => {
    expect(validate(s)).toEqual([]);
  });

  it('moves from step to step and stops at an ending', () => {
    expect(position(INCIDENT, [])).toEqual({ step: INCIDENT.steps.alert });
    expect(position(INCIDENT, [{ step: 'alert', choice: 'look' }])).toEqual({ step: INCIDENT.steps.cause });
    expect(position(INCIDENT, [{ step: 'alert', choice: 'wait' }])).toEqual({ ending: INCIDENT.endings.down });
  });

  it('counts the longest path', () => {
    expect(depth(INCIDENT)).toBe(4);
  });

  it('marks where the run went wrong', () => {
    const picks = [
      { step: 'alert', choice: 'look' },
      { step: 'cause', choice: 'rollback' },
      { step: 'restored', choice: 'notify' },
      { step: 'morning', choice: 'postmortem' },
    ];
    const d = debrief(INCIDENT, picks);
    expect(d.ending.id).toBe('fixed');
    expect([d.optimal, d.total]).toEqual([3, 4]);
    expect(d.path.filter((x) => !x.choice.best).map((x) => [x.step.id, x.best.id])).toEqual([['cause', 'save-rollback']]);
    expect(() => debrief(INCIDENT, picks.slice(0, 2))).toThrow();
  });

  it('rejects broken drafts', () => {
    const broken: Scenario = {
      ...INCIDENT,
      steps: {
        ...INCIDENT.steps,
        // loops back, has two best choices, points to nowhere
        morning: {
          id: 'morning',
          situation: '…',
          choices: [
            { id: 'a', label: 'a', next: 'alert', best: true, consequence: '' },
            { id: 'b', label: 'b', next: 'nowhere', best: true, consequence: '' },
          ],
        },
        orphan: { id: 'orphan', situation: '…', choices: INCIDENT.steps.restored.choices },
      },
    };
    expect(validate(broken)).toEqual(['step "morning" needs exactly one best choice', 'choice "b" leads to unknown "nowhere"']);
    broken.steps.morning.choices = [{ ...broken.steps.morning.choices[0] }, { id: 'b', label: 'b', next: 'fixed', consequence: '' }];
    expect(validate(broken)).toEqual(['loop through "alert"', 'step "orphan" is unreachable']);
  });
});
