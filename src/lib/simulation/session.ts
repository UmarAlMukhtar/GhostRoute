import type { RouteResult } from '../geo/types.ts';
import type { createRouter } from '../routing/shortest-path.ts';
import type { FloodResult } from './flood.ts';
import { scenarios } from './scenarios.ts';
export const initialSimulation = {
  scenarioId: 'hospital',
  stage: 0,
  enabled: false,
};
export type SimulationState = typeof initialSimulation;
export type SimulationAction =
  | { type: 'scenario'; id: string }
  | { type: 'start' | 'next' | 'previous' | 'reset' | 'clear' };
export function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  const scenario = scenarios.find((s) => s.id === state.scenarioId)!;
  switch (action.type) {
    case 'clear':
      return initialSimulation;
    case 'scenario':
      return scenarios.some((s) => s.id === action.id)
        ? { ...state, scenarioId: action.id, stage: state.stage ? 1 : 0 }
        : state;
    case 'start':
      return { ...state, enabled: true, stage: 1 };
    case 'next':
      return {
        ...state,
        stage: Math.min(scenario.steps.length - 1, state.stage + 1),
        enabled: true,
      };
    case 'previous':
      return { ...state, stage: Math.max(1, state.stage - 1) };
    case 'reset':
      return { ...state, stage: 0 };
  }
}
export function reroute(
  router: ReturnType<typeof createRouter>,
  baseline: RouteResult | null,
  flood: FloodResult,
): RouteResult | null {
  if (!baseline || baseline.status !== 'found') return baseline;
  if (flood.status === 'invalid')
    return { status: 'invalid-request', reason: flood.reason };
  return router.findRoute({
    originNodeId: baseline.origin.id,
    destinationNodeId: baseline.destination.id,
    blockedNodeIds: flood.blockedNodeIds,
    blockedSegmentIds: flood.blockedSegmentIds,
  });
}
export function compareRoutes(
  baseline: RouteResult | null,
  current: RouteResult | null,
) {
  if (baseline?.status !== 'found' || current?.status !== 'found') return null;
  const additionalMeters = current.distanceMeters - baseline.distanceMeters;
  return {
    originalMeters: baseline.distanceMeters,
    updatedMeters: current.distanceMeters,
    additionalMeters,
    percentageIncrease: baseline.distanceMeters
      ? (additionalMeters / baseline.distanceMeters) * 100
      : null,
  };
}
