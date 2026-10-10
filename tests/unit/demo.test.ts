import { expect, it } from 'vitest';
import { demoSteps } from '../../src/lib/map/demo';
import { scenarios } from '../../src/lib/simulation/scenarios';
import {
  simulationReducer,
  initialSimulation,
} from '../../src/lib/simulation/session';
it('every presenter step maps to an existing scenario stage using the same reducer', () => {
  expect(demoSteps).toHaveLength(8);
  for (const step of demoSteps) {
    const scenario = scenarios.find((s) => s.id === step.scenario)!;
    expect(scenario.steps[step.stage]).toBeDefined();
    let state = simulationReducer(initialSimulation, {
      type: 'scenario',
      id: step.scenario,
    });
    if (step.stage) state = simulationReducer(state, { type: 'start' });
    for (let i = 1; i < step.stage; i++)
      state = simulationReducer(state, { type: 'next' });
    expect(state.stage).toBe(step.stage);
  }
});
