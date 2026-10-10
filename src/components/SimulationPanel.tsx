import {
  Waves,
  Play,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import type { Dispatch } from 'react';
import type { RouteResult } from '../lib/geo/types';
import { formatDistance, routeMessage } from '../lib/map/selection';
import type { FloodResult } from '../lib/simulation/flood';
import { scenarios } from '../lib/simulation/scenarios';
import {
  compareRoutes,
  type SimulationAction,
  type SimulationState,
} from '../lib/simulation/session';
export default function SimulationPanel({
  state,
  dispatch,
  flood,
  baseline,
  current,
  canStart,
}: {
  state: SimulationState;
  dispatch: Dispatch<SimulationAction>;
  flood: FloodResult | null;
  baseline: RouteResult | null;
  current: RouteResult | null;
  canStart: boolean;
}) {
  const scenario = scenarios.find((s) => s.id === state.scenarioId)!;
  const comparison = compareRoutes(baseline, current);
  const active = state.stage > 0;
  return (
    <section
      className="simulation-panel"
      aria-label="Flood simulation controls"
    >
      <div className="simulation-heading">
        <Waves size={20} />
        <h3>Test the unexpected</h3>
        <span>SIMULATED</span>
      </div>
      <label htmlFor="flood-scenario">Flood scenario</label>
      <select
        id="flood-scenario"
        value={state.scenarioId}
        onChange={(e) => dispatch({ type: 'scenario', id: e.target.value })}
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <p className="scenario-description">{scenario.description}</p>
      {!active ? (
        <button
          className="simulation-start"
          disabled={!canStart}
          onClick={() => dispatch({ type: 'start' })}
        >
          <Play size={15} />
          Start simulation
        </button>
      ) : (
        <>
          <div className="stage-controls">
            <button
              aria-label="Previous stage"
              disabled={state.stage <= 1}
              onClick={() => dispatch({ type: 'previous' })}
            >
              <ChevronLeft size={18} />
            </button>
            <span role="status">
              Stage {state.stage} of {scenario.steps.length - 1}
            </span>
            <button
              aria-label="Next stage"
              disabled={state.stage >= scenario.steps.length - 1}
              onClick={() => dispatch({ type: 'next' })}
            >
              <ChevronRight size={18} />
            </button>
            <button
              aria-label="Reset simulation"
              onClick={() => dispatch({ type: 'reset' })}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <progress
            aria-label="Simulation progress"
            value={state.stage}
            max={scenario.steps.length - 1}
          />
        </>
      )}
      {!canStart && (
        <p className="selection-hint">Select both endpoints to begin.</p>
      )}
      {active && (
        <div
          className="simulation-outcome"
          aria-live="polite"
          aria-atomic="true"
        >
          {flood?.status === 'invalid' ? (
            <p role="alert">Simulation unavailable: {flood.reason}</p>
          ) : (
            <>
              <div className="flood-count">
                <span className="blocked-dot" />
                <strong data-testid="blocked-count">
                  {flood?.metadata.segmentCount ?? 0}
                </strong>{' '}
                road segments blocked
              </div>
              <p
                className={`simulation-availability ${current?.status === 'found' ? '' : 'unavailable'}`}
                data-testid="simulation-availability"
              >
                {current?.status === 'found'
                  ? comparison?.additionalMeters === 0
                    ? 'Route unchanged in this simulation'
                    : 'Available route recalculated'
                  : 'No available route'}
              </p>
              {current && current.status !== 'found' && (
                <p className="scenario-description">
                  {routeMessage(current)} The blue line is the original route,
                  not an available alternative.
                </p>
              )}
              <dl className="route-comparison">
                <div>
                  <dt>Original</dt>
                  <dd data-testid="original-distance">
                    {baseline?.status === 'found'
                      ? formatDistance(baseline.distanceMeters)
                      : 'Unavailable'}
                  </dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd data-testid="updated-distance">
                    {current?.status === 'found'
                      ? formatDistance(current.distanceMeters)
                      : 'Unavailable'}
                  </dd>
                </div>
              </dl>
              {comparison && (
                <p className="distance-change" data-testid="distance-change">
                  +{formatDistance(comparison.additionalMeters)}
                  {comparison.percentageIncrease !== null
                    ? ` · +${comparison.percentageIncrease.toFixed(1)}%`
                    : ''}{' '}
                  compared with the original route
                </p>
              )}
            </>
          )}
        </div>
      )}
      <p className="simulation-disclaimer">
        Simulation only. Flood zones are illustrative and do not represent
        verified live conditions. Routes are not certified safe for emergency
        use.
      </p>
    </section>
  );
}
