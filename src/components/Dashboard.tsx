'use client';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCcw,
  Route,
  ShieldAlert,
  X,
} from 'lucide-react';
import MapView from './MapView';
import SimulationPanel from './SimulationPanel';
import DemoGuide from './DemoGuide';
import { demoSteps } from '../lib/map/demo';
import type { SimulationAction } from '../lib/simulation/session';
import type { SelectionAction } from '../lib/map/selection';
import { createFloodEngine } from '../lib/simulation/flood';
import { scenarios } from '../lib/simulation/scenarios';
import {
  initialSimulation,
  simulationReducer,
  reroute,
} from '../lib/simulation/session';
import type { MapOverlays } from '../lib/map/style';
import Link from 'next/link';
import { loadMapData, type MapData } from '../lib/map/data';
import {
  formatDistance,
  initialSelection,
  routeMessage,
  selectCoordinate,
  selectionReducer,
  type Role,
} from '../lib/map/selection';
import type { GeoPoint } from '../lib/geo/types';

export default function Dashboard() {
  const [data, setData] = useState<MapData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [state, dispatchSelection] = useReducer(
    selectionReducer,
    initialSelection,
  );
  const [simulation, dispatchSimulation] = useReducer(
    simulationReducer,
    initialSimulation,
  );
  const [sheetOpen, setSheetOpen] = useState(true);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const panel = useRef<HTMLElement>(null);
  function dispatch(action: SelectionAction) {
    setDemoStep(null);
    dispatchSelection(action);
  }
  function simulate(action: SimulationAction) {
    setDemoStep(null);
    dispatchSimulation(action);
  }
  function showDemoStep(index: number) {
    if (!data) return;
    const step = demoSteps[index];
    setDemoStep(index);
    setSheetOpen(true);
    dispatchSimulation({ type: 'clear' });
    if (index === 0) dispatchSelection({ type: 'reset' });
    else {
      dispatchSelection({ type: 'preset', places: data.places });
      dispatchSelection({
        type: 'result',
        result: data.router.findRoute({
          originNodeId: data.places[0].nodeId,
          destinationNodeId: data.places[1].nodeId,
        }),
      });
      dispatchSimulation({ type: 'scenario', id: step.scenario });
      if (step.stage) dispatchSimulation({ type: 'start' });
      for (let stage = 1; stage < step.stage; stage++)
        dispatchSimulation({ type: 'next' });
    }
    requestAnimationFrame(() =>
      panel.current?.scrollTo({ top: 0, behavior: 'instant' }),
    );
  }
  const help = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let cancelled = false;
    loadMapData()
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch(() => {
        if (!cancelled)
          setLoadError(
            'The local road dataset could not be loaded or validated. Check the connection to this app and retry.',
          );
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);
  function pick(coordinate: GeoPoint) {
    if (!data || !state.active) return;
    const action = selectCoordinate(data, coordinate, state.active);
    dispatch(action);
    if (
      action.type === 'error' ||
      (action.type === 'select' &&
        (state.active === 'destination' || state.destination))
    )
      setSheetOpen(true);
  }
  function selectOnMap(role: Role) {
    dispatch({ type: 'active', role });
    setSheetOpen(false);
  }
  const engine = useMemo(
    () => (data ? createFloodEngine(data.graph) : null),
    [data],
  );
  const flood = useMemo(() => {
    const scenario = scenarios.find((s) => s.id === simulation.scenarioId)!;
    if (!engine || !data) return null;
    return scenario.graphVersion === data.graph.version
      ? engine.evaluate(scenario.steps[simulation.stage])
      : {
          status: 'invalid' as const,
          reason: 'Scenario does not match this dataset version.',
        };
  }, [engine, data, simulation.scenarioId, simulation.stage]);
  const baseline = useMemo(
    () =>
      simulation.enabled && data && state.origin && state.destination
        ? data.router.findRoute({
            originNodeId: state.origin.nodeId,
            destinationNodeId: state.destination.nodeId,
          })
        : state.result,
    [simulation.enabled, data, state.origin, state.destination, state.result],
  );
  const current = useMemo(
    () =>
      simulation.stage && data && flood
        ? reroute(data.router, baseline, flood)
        : baseline,
    [simulation.stage, data, flood, baseline],
  );
  const overlays = useMemo<MapOverlays | undefined>(
    () =>
      simulation.stage && flood?.status === 'ready'
        ? {
            hazards: flood.hazards,
            blockedRoads: flood.blockedRoads,
            alternative: {
              type: 'FeatureCollection',
              features:
                current?.status === 'found' && current.geometry
                  ? [
                      {
                        type: 'Feature',
                        properties: {},
                        geometry: current.geometry,
                      },
                    ]
                  : [],
            },
          }
        : undefined,
    [simulation.stage, flood, current],
  );
  const found = current?.status === 'found' ? current : null;
  return (
    <main className="dashboard">
      <a
        className="skip-link"
        href="#route-controls"
        onClick={() => setSheetOpen(true)}
      >
        Skip to routing controls
      </a>
      <header className="topbar">
        <Link href="/" className="brand" aria-label="GhostRoute home">
          <span className="brand-icon">
            <Route size={25} strokeWidth={2.5} />
          </span>
          <h1>
            GhostRoute<span className="brand-period">.</span>
          </h1>
        </Link>
        <div className="region">
          <MapPin size={15} />
          <span>Ernakulam, Kerala</span>
          <span className="region-tag">DEMO REGION</span>
        </div>
        <div className="header-actions">
          <button
            className="demo-entry"
            disabled={!data}
            aria-pressed={demoStep !== null}
            onClick={() => showDemoStep(0)}
          >
            Demo Mode
          </button>
          <span className="demo-status">
            <span />
            {simulation.stage ? 'Simulated flood active' : 'Simulation demo'}
          </span>
          <button
            className="icon-button help-button"
            aria-label="About GhostRoute"
            onClick={() => help.current?.showModal()}
          >
            <CircleHelp size={20} />
          </button>
        </div>
      </header>
      <section className="workspace" aria-label="Route planner">
        {data ? (
          <MapView
            data={data}
            overview={demoStep === 0}
            origin={state.origin}
            destination={state.destination}
            result={baseline}
            overlays={overlays}
            onPick={pick}
            selecting={Boolean(state.active)}
            sheetOpen={sheetOpen}
          />
        ) : (
          <div className="map-placeholder">
            <Route size={40} />
            <p>
              {loadError
                ? 'Road network unavailable'
                : 'Preparing the Ernakulam road network…'}
            </p>
          </div>
        )}
        <div className="map-instruction">
          <span className="instruction-dot" />
          {state.active
            ? `Select your ${state.active === 'origin' ? 'starting point' : 'destination'} on the map`
            : found
              ? simulation.stage
                ? 'Blue: original · Green: available · Red: blocked'
                : 'Your route, on real roads'
              : simulation.stage
                ? 'No available route · Blue shows the original path'
                : 'Explore. Select. Find your route.'}
        </div>
        <aside
          ref={panel}
          className={`route-panel ${sheetOpen ? 'expanded' : 'collapsed'}`}
          aria-label="Routing controls"
        >
          <button
            className="sheet-toggle"
            aria-expanded={sheetOpen}
            aria-controls="route-controls"
            onClick={() => setSheetOpen(!sheetOpen)}
          >
            <span>
              {found
                ? `${formatDistance(found.distanceMeters)} · Route available`
                : simulation.stage
                  ? 'No available route · Simulation'
                  : 'Plan your route'}
            </span>
            {sheetOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <div
            id="route-controls"
            tabIndex={-1}
            className={`panel-content ${demoStep !== null ? 'guided' : ''}`}
          >
            {demoStep !== null ? (
              <DemoGuide
                step={demoStep}
                baseline={baseline}
                current={current}
                blockedCount={
                  flood?.status === 'ready' ? flood.metadata.segmentCount : 0
                }
                onStep={showDemoStep}
                onExit={() => setDemoStep(null)}
              />
            ) : (
              <div className="panel-heading">
                <p className="eyebrow">ERNAKULAM EXPLORER</p>
                <h2>A clearer way forward.</h2>
                <p>Explore routes through the local road network.</p>
              </div>
            )}
            {loadError ? (
              <div className="notice error" role="alert">
                {loadError}
                <button
                  className="secondary"
                  onClick={() => {
                    setLoadError('');
                    setAttempt(attempt + 1);
                  }}
                >
                  Retry data loading
                </button>
              </div>
            ) : !data ? (
              <p role="status" className="notice">
                Loading and validating local roads…
              </p>
            ) : (
              <>
                <div className="endpoint-fields">
                  {(['origin', 'destination'] as const).map((role, index) => (
                    <div
                      key={role}
                      className={`endpoint ${state.active === role ? 'active' : ''}`}
                    >
                      <span className={`endpoint-letter ${role}`}>
                        {index === 0 ? 'A' : 'B'}
                      </span>
                      <div className="endpoint-input">
                        <label htmlFor={role}>
                          {role === 'origin' ? 'Starting point' : 'Destination'}
                        </label>
                        <select
                          id={role}
                          value={state[role]?.nodeId ?? ''}
                          onChange={(e) => {
                            const place = data.places.find(
                              (p) => p.nodeId === e.target.value,
                            );
                            if (place)
                              dispatch({
                                type: 'select',
                                role,
                                selection: place,
                              });
                          }}
                        >
                          <option value="" disabled>
                            Choose a demo location
                          </option>
                          {state[role] &&
                            !data.places.some(
                              (p) => p.nodeId === state[role]?.nodeId,
                            ) && (
                              <option value={state[role]!.nodeId}>
                                {state[role]!.label}
                              </option>
                            )}
                          {data.places.map((place) => (
                            <option key={place.nodeId} value={place.nodeId}>
                              {place.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        className="pick-button"
                        aria-label={`Select ${role} on map`}
                        aria-pressed={state.active === role}
                        onClick={() => selectOnMap(role)}
                      >
                        <LocateFixed size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="selection-hint">
                  Choose locations above, or{' '}
                  <button
                    onClick={() =>
                      selectOnMap(state.origin ? 'destination' : 'origin')
                    }
                  >
                    pick on the map
                  </button>
                  .
                </p>
                <button
                  className="primary"
                  disabled={!state.origin || !state.destination}
                  onClick={() => {
                    if (state.origin && state.destination)
                      dispatch({
                        type: 'result',
                        result: data.router.findRoute({
                          originNodeId: state.origin.nodeId,
                          destinationNodeId: state.destination.nodeId,
                        }),
                      });
                  }}
                >
                  <Navigation size={17} />
                  {state.result ? 'Recalculate route' : 'Find route'}
                  <ArrowRight size={18} />
                </button>
                <div className="preset-row">
                  <button
                    className="demo-preset"
                    onClick={() =>
                      dispatch({ type: 'preset', places: data.places })
                    }
                  >
                    <Route size={16} />
                    <span>Try the Hospital Road demo</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
                <SimulationPanel
                  state={simulation}
                  dispatch={simulate}
                  flood={flood}
                  baseline={baseline}
                  current={current}
                  canStart={Boolean(state.origin && state.destination)}
                />
                <div
                  className="result-area"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {state.message && (
                    <p className="notice error" role="alert">
                      {state.message}
                    </p>
                  )}
                  {current && !found && (
                    <p className="notice error" role="alert">
                      {routeMessage(current!)}
                    </p>
                  )}
                  {found ? (
                    <div className="route-result">
                      <div className="result-header">
                        <span className="availability">
                          <span />
                          Route available
                        </span>
                        <span className="profile">
                          <Footprints size={14} />
                          Walking demo
                        </span>
                      </div>
                      <p className="distance" data-testid="route-distance">
                        {formatDistance(found.distanceMeters)}
                        <span>total distance</span>
                      </p>
                      <p className="route-detail">
                        {found.segmentIds.length} traversed road segments{' '}
                        <span>·</span> Shortest distance
                      </p>
                      <p className="route-endpoints">
                        <b>From</b> {state.origin?.label}
                        <br />
                        <b>To</b> {state.destination?.label}
                      </p>
                      {!found.geometry && (
                        <p className="selection-hint">
                          Both points are the same road node. No travel is
                          needed.
                        </p>
                      )}
                    </div>
                  ) : (
                    !current && (
                      <div className="empty-route">
                        <span className="empty-icon">
                          <Route size={22} />
                        </span>
                        <div>
                          <strong>Your route starts here</strong>
                          <p>
                            Select two points to find a path through real mapped
                            roads.
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
                {(['origin', 'destination'] as const).map(
                  (role) =>
                    state[role]?.clicked && (
                      <p className="snap-note" key={role}>
                        {role === 'origin' ? 'A' : 'B'} snapped{' '}
                        {formatDistance(state[role]!.snapMeters ?? 0)} to a road
                        node. Clicked {state[role]!.clicked![1].toFixed(5)},{' '}
                        {state[role]!.clicked![0].toFixed(5)}. Hollow dot =
                        clicked point; letter = snapped point.
                      </p>
                    ),
                )}
                <div className="panel-bottom">
                  <span>
                    <Footprints size={15} />
                    Distance-based routing
                  </span>
                  <button
                    onClick={() => {
                      dispatch({ type: 'reset' });
                      simulate({ type: 'clear' });
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="panel-note">
            <ShieldAlert size={16} />
            <p>
              Demo destinations, not verified shelters.
              <br />
              No live hazard or road-closure information.
            </p>
          </div>
        </aside>
        <div className="map-legend" aria-label="Map legend">
          <span>
            <i className="legend-road" />
            Local roads
          </span>
          <span>
            <i className="legend-route" />
            {simulation.stage ? 'Original route' : 'Calculated route'}
          </span>
          {simulation.stage > 0 && (
            <>
              <span>
                <i className="legend-alternative" />
                Available route
              </span>
              <span>
                <i className="legend-blocked" />
                Blocked roads
              </span>
              <span>
                <i className="legend-flood" />
                Simulated flood
              </span>
            </>
          )}
        </div>
        <div className="coverage-label">
          <span>01 / CENTRAL ERNAKULAM</span>
          <p>Real roads. Transparent routing.</p>
        </div>
      </section>
      <footer className="statusbar">
        <p>
          <ShieldAlert size={14} />
          <strong>Simulation only.</strong> Routes are not verified safe. Follow
          local authorities.
        </p>
        <div>
          <span className="coverage-meta">
            Central Ernakulam · OSM extract 10 Oct 2026
          </span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors
          </a>
        </div>
      </footer>
      <dialog ref={help} className="help-dialog">
        <div className="dialog-header">
          <h2>About GhostRoute</h2>
          <button
            className="icon-button"
            aria-label="Close help"
            onClick={() => help.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <p>
          Navigate to safety when ordinary routes become unsafe. This is a
          navigation simulation, not an emergency service.
        </p>
        <h3>Plan a route</h3>
        <ol>
          <li>
            Choose a starting point and destination from the menus, or select
            them on the map.
          </li>
          <li>
            Press Find route. Dijkstra calculates the shortest distance through
            the local walking road graph.
          </li>
          <li>
            Try the Hospital Road demo for a repeatable example. Reset clears
            all selections.
          </li>
        </ol>
        <p>
          Map clicks snap to a road node within 100 m. This approximation does
          not establish an accessible entrance or a safe path to that node. Some
          road components are disconnected.
        </p>
        <p>
          The frozen dataset contains 1,719 nodes and 1,856 road segments in
          central Ernakulam. Start a simulated flood after selecting endpoints.
          Use the stage arrows to expand or reverse the urban scenario; Reset
          simulation restores the original route. No live hazards, shelter
          availability or travel-time estimates are provided.
        </p>
        <p>
          Remote street tiles are optional. Local roads and routing remain
          available if tiles fail; WebGL is required to draw the map.
        </p>
        <a
          href="https://www.openstreetmap.org/fixthemap"
          target="_blank"
          rel="noreferrer"
        >
          Report an OpenStreetMap issue ↗
        </a>
      </dialog>
    </main>
  );
}
