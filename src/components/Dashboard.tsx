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
import PlaceSearch from './PlaceSearch';
import { HazardControls, ReportControls, hazardNames } from './ExploreControls';
import {
  hazardInputs,
  withinCoverage,
  type HazardKind,
  type SimulatedHazard,
} from '../lib/simulation/hazards';
import {
  filterReports,
  loadReports,
  saveReport,
  validateReport,
  deleteReport,
  REPORT_KEY,
  type IncidentReport,
  type ReportFilters,
} from '../lib/incidents/reports';

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
  compareRoutes,
} from '../lib/simulation/session';
import type { MapOverlays } from '../lib/map/style';
import Link from 'next/link';
import { loadMapData, loadSearchPlaces, type MapData } from '../lib/map/data';
import {
  formatDistance,
  initialSelection,
  routeMessage,
  selectCoordinate,
  selectionReducer,
  type Role,
} from '../lib/map/selection';
import type { SearchPlace } from '../lib/map/places';
import type { GeoPoint } from '../lib/geo/types';

export default function Dashboard({ demo = false }: { demo?: boolean }) {
  const locationRequest = useRef(0);
  const [data, setData] = useState<MapData | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchReset, setSearchReset] = useState(0);
  const [focusPlace, setFocusPlace] = useState<{
    coordinate: GeoPoint;
    sequence: number;
  }>();
  const [catalog, setCatalog] = useState<{
    places: SearchPlace[];
    error: string;
    loading: boolean;
  }>({ places: [], error: '', loading: true });
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
  const [tab, setTab] = useState<'Navigate' | 'Simulate' | 'Reports' | 'Demo'>(
    'Navigate',
  );
  const [mode, setMode] = useState<'normal' | 'simulation'>('normal');
  const [hazards, setHazards] = useState<SimulatedHazard[]>([]);
  const [coordinateRole, setCoordinateRole] = useState<Role>('origin');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [selectedHazard, setSelectedHazard] = useState<string | null>(null);
  const [intent, setIntent] = useState<
    { kind: HazardKind; radius: number; id?: string } | 'report' | null
  >(null);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [reportsReady, setReportsReady] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportLocation, setReportLocation] = useState<{
    coordinate: GeoPoint;
    segmentId?: string;
  } | null>(null);
  const submittedLocation = useRef<typeof reportLocation>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    type: '',
    status: '',
    severity: '',
    activity: 'active',
  });
  const visibleReports = useMemo(
    () => filterReports(reports, filters),
    [reports, filters],
  );
  const segments = useMemo(
    () =>
      new Set(data?.roads.features.map((f) => f.properties.segmentId) ?? []),
    [data],
  );
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        let saved = loadReports(localStorage, data.bounds, segments);
        if (localStorage.getItem(REPORT_KEY) === null) {
          saved = [
            validateReport(
              {
                source: 'local-report',
                id: 'illustrative-seed',
                type: 'Other obstruction',
                coordinate: data.places[0].coordinate,
                description:
                  'Example report for learning the interface. This is not an observed incident.',
                severity: 'Unspecified',
                submittedAt: '2026-10-10T00:00:00Z',
                status: 'Unverified',
                seeded: true,
              },
              data.bounds,
              segments,
            ),
          ];
          localStorage.setItem(REPORT_KEY, JSON.stringify(saved));
        }
        setReports(saved);
        setReportsReady(true);
      } catch {
        setReportError(
          'Local reports could not be read or saved. Existing storage was preserved. Check browser storage settings; reporting is disabled until the archive is readable.',
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [data, segments]);
  function changeTab(value: typeof tab) {
    setSearching(false);
    setTab(value);
    setIntent(null);
    setSheetOpen(true);
    setDemoStep(null);
    dispatchSelection({ type: 'active', role: null });
  }
  function selectReport(id: string) {
    changeTab('Reports');
    setSelectedReport(id);
    requestAnimationFrame(() =>
      document
        .getElementById(`report-${id}`)
        ?.scrollIntoView({ block: 'nearest' }),
    );
  }
  function placeHazard(kind: HazardKind, radius: number, id?: string) {
    setIntent({ kind, radius, id });
    setMode('simulation');
    setDemoStep(null);
    dispatchSimulation({ type: 'clear' });
    dispatchSelection({ type: 'active', role: null });
    setSheetOpen(false);
  }
  function updateHazards(value: SimulatedHazard[]) {
    setHazards(value);
    setMode('simulation');
    dispatchSimulation({ type: 'clear' });
  }
  function submitReport(
    type: IncidentReport['type'],
    description: string,
    severity: IncidentReport['severity'],
  ) {
    if (
      !data ||
      !reportLocation ||
      !reportsReady ||
      submittedLocation.current === reportLocation
    )
      return false;
    // Storage is synchronous; guard repeated events without pretending it is async.
    submittedLocation.current = reportLocation;
    try {
      const report = validateReport(
        {
          source: 'local-report',
          id: crypto.randomUUID(),
          type,
          description,
          severity,
          ...reportLocation,
          submittedAt: new Date().toISOString(),
          status: 'Unverified',
          seeded: false,
        },
        data.bounds,
        segments,
      );
      setReports(
        saveReport(
          localStorage,
          loadReports(localStorage, data.bounds, segments),
          report,
        ),
      );
      setSelectedReport(report.id);
      setReportError('');
      setReportLocation(null);
      return true;
    } catch (error) {
      submittedLocation.current = null;
      setReportError(
        error instanceof Error ? error.message : 'Could not save report',
      );
      return false;
    }
  }
  function removeReport(id: string) {
    if (!data || !reportsReady) return false;
    try {
      setReports(
        deleteReport(
          localStorage,
          loadReports(localStorage, data.bounds, segments),
          id,
        ),
      );
      setSelectedReport(null);
      setReportError('');
      return true;
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : 'Could not delete report',
      );
      return false;
    }
  }
  function reposition(role: Role, coordinate: GeoPoint) {
    if (data) {
      dispatch(selectCoordinate(data, coordinate, role));
      setSheetOpen(true);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      dispatch({
        type: 'error',
        message: 'This browser does not provide geolocation.',
      });
      return;
    }
    const request = ++locationRequest.current;
    dispatch({ type: 'error', message: 'Waiting for location permission…' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (data && request === locationRequest.current)
          dispatch(
            selectCoordinate(
              data,
              [position.coords.longitude, position.coords.latitude],
              'origin',
            ),
          );
      },
      () =>
        request === locationRequest.current &&
        dispatch({
          type: 'error',
          message:
            'Location unavailable or permission denied. Select a point on the map instead.',
        }),
      { timeout: 10000, maximumAge: 0 },
    );
  }
  const panel = useRef<HTMLElement>(null);
  function dispatch(action: SelectionAction) {
    if (action.type === 'reset') {
      setSearchReset((value) => value + 1);
      setSearching(false);
    }
    if (action.type !== 'error') locationRequest.current++;
    setDemoStep(null);
    dispatchSelection(action);
  }
  function simulate(action: SimulationAction) {
    setDemoStep(null);
    dispatchSimulation(action);
  }
  function showDemoStep(index: number) {
    locationRequest.current++;
    if (!data) return;
    const step = demoSteps[index];
    setTab('Demo');
    setMode('normal');
    setIntent(null);
    setDemoStep(index);
    setSheetOpen(true);
    dispatchSimulation({ type: 'clear' });
    if (index === 0) {
      setSearchReset((value) => value + 1);
      setSearching(false);
      dispatchSelection({ type: 'reset' });
    } else {
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
        if (cancelled) return;
        setData(value);
        loadSearchPlaces(value)
          .then((places) => {
            if (!cancelled) setCatalog({ places, error: '', loading: false });
          })
          .catch(() => {
            if (!cancelled)
              setCatalog({
                places: [],
                loading: false,
                error:
                  'Local place index unavailable. Use coordinates or map selection; reload to retry.',
              });
          });
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
  function pick(coordinate: GeoPoint, segmentId?: string) {
    if (!data) return;
    if (intent) {
      if (!withinCoverage(coordinate, data.bounds)) {
        dispatch({
          type: 'error',
          message:
            'Choose a location inside the supported central Ernakulam road network.',
        });
        setSheetOpen(true);
        return;
      }
      if (intent === 'report') {
        setReportLocation({ coordinate, segmentId });
        setIntent(null);
        setSheetOpen(true);
        return;
      }
      if (intent.kind === 'roadblock' && !segmentId) {
        dispatch({
          type: 'error',
          message:
            'Click directly on a visible road to choose a physical segment.',
        });
        setSheetOpen(true);
        return;
      }
      const hazard: SimulatedHazard = {
        source: 'simulation',
        id: intent.id ?? crypto.randomUUID(),
        kind: intent.kind,
        center: coordinate,
        radiusMeters: intent.radius,
        enabled: intent.id
          ? (hazards.find((h) => h.id === intent.id)?.enabled ?? true)
          : true,
        segmentId: intent.kind === 'roadblock' ? segmentId : undefined,
      };
      setHazards((previous) =>
        intent.id
          ? previous.map((h) => (h.id === intent.id ? hazard : h))
          : previous.length < 20
            ? [...previous, hazard]
            : previous,
      );
      setSelectedHazard(hazard.id);
      setIntent(null);
      setSheetOpen(true);
      dispatchSelection({ type: 'error', message: '' });
      return;
    }
    if (!state.active) return;
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
    setIntent(null);
    dispatch({ type: 'active', role });
    setSheetOpen(false);
  }
  const engine = useMemo(
    () => (data ? createFloodEngine(data.graph) : null),
    [data],
  );
  const individualImpacts = useMemo(
    () =>
      engine
        ? hazards.map((hazard) => {
            const input = hazardInputs([hazard]);
            return engine.evaluate(input.zones, input.segments);
          })
        : [],
    [engine, hazards],
  );
  const flood = useMemo(() => {
    const scenario = scenarios.find((s) => s.id === simulation.scenarioId)!;
    if (!engine || !data) return null;
    if (mode === 'simulation') {
      const input = hazardInputs(hazards);
      return engine.evaluate(input.zones, input.segments);
    }
    return scenario.graphVersion === data.graph.version
      ? engine.evaluate(scenario.steps[simulation.stage])
      : {
          status: 'invalid' as const,
          reason: 'Scenario does not match this dataset version.',
        };
  }, [engine, data, simulation.scenarioId, simulation.stage, mode, hazards]);
  const impactActive = mode !== 'normal' || simulation.stage > 0;
  const baseline = useMemo(
    () =>
      data && state.origin && state.destination
        ? data.router.findRoute({
            originNodeId: state.origin.nodeId,
            destinationNodeId: state.destination.nodeId,
          })
        : state.result,
    [data, state.origin, state.destination, state.result],
  );
  const current = useMemo(
    () =>
      impactActive && data && flood
        ? reroute(data.router, baseline, flood)
        : baseline,
    [impactActive, data, flood, baseline],
  );
  const overlays = useMemo<MapOverlays | undefined>(
    () =>
      impactActive && flood?.status === 'ready'
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
    [impactActive, flood, current],
  );
  const affectingHazards =
    baseline?.status === 'found'
      ? hazards.flatMap((hazard, index) => {
          const impact = individualImpacts[index];
          return impact?.status === 'ready' &&
            (baseline.segmentIds.some((id) =>
              impact.blockedSegmentIds.has(id),
            ) ||
              baseline.nodeIds.some((id) => impact.blockedNodeIds.has(id)))
            ? [`${hazardNames[hazard.kind]} ${index + 1}`]
            : [];
        })
      : [];
  const comparison = compareRoutes(baseline, current);
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
      <header className={`topbar ${demo ? 'demo-topbar' : ''}`}>
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
          <nav className="page-switch" aria-label="Pages">
            <Link href="/" aria-current={!demo ? 'page' : undefined}>
              Navigation
            </Link>
            <Link href="/demo" aria-current={demo ? 'page' : undefined}>
              Demo
            </Link>
          </nav>
          {demo && (
            <button
              className="secondary"
              disabled={!data}
              onClick={() => changeTab('Demo')}
            >
              Demo scenarios
            </button>
          )}
          <button
            className="secondary"
            onClick={() =>
              changeTab(tab === 'Simulate' ? 'Navigate' : 'Simulate')
            }
            aria-expanded={tab === 'Simulate'}
          >
            Simulation
          </button>
          <button
            className="primary report-entry"
            onClick={() =>
              changeTab(tab === 'Reports' ? 'Navigate' : 'Reports')
            }
          >
            Report Incident
          </button>
          <span className="demo-status">
            <span />
            {impactActive ? 'Exploratory routing' : 'Simulation platform'}
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
            focusPlace={focusPlace}
            origin={state.origin}
            destination={state.destination}
            result={baseline}
            overlays={overlays}
            onPick={pick}
            onReposition={reposition}
            reports={visibleReports}
            onReportClick={selectReport}
            selecting={Boolean(state.active || intent)}
            sheetOpen={sheetOpen}
          />
        ) : (
          <div className="map-placeholder" role="status" aria-live="polite">
            <span
              className="loading-ring"
              aria-hidden="true"
              hidden={Boolean(loadError)}
            />
            {loadError && <Route size={32} />}
            <p>
              {loadError
                ? 'Road network unavailable'
                : 'Preparing GhostRoute map'}
            </p>
            {!loadError && (
              <span>Loading and validating the Ernakulam road network…</span>
            )}
          </div>
        )}
        <div className="map-instruction">
          <span className="instruction-dot" />
          {intent
            ? intent === 'report'
              ? 'Select the incident location · local report only'
              : `Place ${intent.kind} · click ${intent.kind === 'roadblock' ? 'a road' : 'inside the demo region'}`
            : state.active
              ? `Select your ${state.active === 'origin' ? 'starting point' : 'destination'} on the map`
              : found
                ? impactActive
                  ? 'Blue: original · Green: available · Red: blocked'
                  : 'Your route, on real roads'
                : impactActive
                  ? baseline
                    ? 'No available route · Blue shows the original path'
                    : 'Select endpoints in Navigate to compare routes'
                  : 'Explore. Select. Find your route.'}
        </div>
        <aside
          ref={panel}
          className={`route-panel ${sheetOpen ? 'expanded' : 'collapsed'} ${searching ? 'searching' : ''}`}
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
                : impactActive
                  ? baseline
                    ? 'No available route · Exploration'
                    : 'Add hazards or select endpoints'
                  : 'Plan your route'}
            </span>
            {sheetOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <div
            id="route-controls"
            tabIndex={-1}
            className={`panel-content ${demoStep !== null ? 'guided' : ''}`}
          >
            <div className="panel-heading">
              <p className="eyebrow">ERNAKULAM EXPLORER</p>
              <h2>A clearer way forward.</h2>
              <p>Explore routes through the local road network.</p>
            </div>
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
                {intent && (
                  <button className="secondary" onClick={() => setIntent(null)}>
                    Cancel map placement
                  </button>
                )}
                <div>
                  <div className="endpoint-fields">
                    {(['origin', 'destination'] as const).map((role, index) => (
                      <div
                        key={role}
                        className={`endpoint ${state.active === role ? 'active' : ''}`}
                      >
                        <span className={`endpoint-letter ${role}`}>
                          {index === 0 ? 'A' : 'B'}
                        </span>
                        <PlaceSearch
                          key={searchReset}
                          role={role}
                          selection={state[role]}
                          other={
                            state[role === 'origin' ? 'destination' : 'origin']
                          }
                          data={data}
                          places={catalog.places}
                          error={catalog.error}
                          loading={catalog.loading}
                          onAction={dispatch}
                          onOpen={setSearching}
                          onFocusPlace={(coordinate) =>
                            setFocusPlace((previous) => ({
                              coordinate,
                              sequence: (previous?.sequence ?? 0) + 1,
                            }))
                          }
                        />
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
                  <details
                    className="demo-endpoints coordinate-entry"
                    hidden={!demo}
                  >
                    <summary>Demo endpoint shortcuts</summary>
                    {(['origin', 'destination'] as const).map((role) => (
                      <label key={role}>
                        {role === 'origin'
                          ? 'Demo starting point'
                          : 'Demo destination'}
                        <select
                          aria-label={
                            role === 'origin'
                              ? 'Demo starting point'
                              : 'Demo destination'
                          }
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
                      </label>
                    ))}
                  </details>
                  <details className="coordinate-entry">
                    <summary>Enter coordinates</summary>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        reposition(coordinateRole, [
                          Number(longitude),
                          Number(latitude),
                        ]);
                      }}
                    >
                      <label>
                        Endpoint
                        <select
                          aria-label="Endpoint"
                          value={coordinateRole}
                          onChange={(e) =>
                            setCoordinateRole(e.target.value as Role)
                          }
                        >
                          <option value="origin">Starting point</option>
                          <option value="destination">Destination</option>
                        </select>
                      </label>
                      <div className="control-row">
                        <label>
                          Latitude
                          <input
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            required
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                          />
                        </label>
                        <label>
                          Longitude
                          <input
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            required
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                          />
                        </label>
                      </div>
                      <button className="secondary">Set coordinate</button>
                    </form>
                  </details>
                  <div className="control-row">
                    <button
                      className="secondary"
                      disabled={!state.origin || !state.destination}
                      onClick={() => {
                        const origin = state.origin!,
                          destination = state.destination!;
                        dispatch({
                          type: 'select',
                          role: 'origin',
                          selection: destination,
                        });
                        dispatch({
                          type: 'select',
                          role: 'destination',
                          selection: origin,
                        });
                      }}
                    >
                      Swap endpoints
                    </button>
                    <button className="secondary" onClick={locate}>
                      Use my location
                    </button>
                  </div>
                  <p className="selection-hint">
                    Search local places above, or{' '}
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
                  <div className="preset-row" hidden={!demo}>
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
                </div>
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
                      setIntent(null);
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset route
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
              Local reports are unverified; no official closure feed.
            </p>
          </div>
        </aside>
        {data && tab !== 'Navigate' && (
          <aside
            className={`side-panel ${intent ? 'placing' : ''}`}
            aria-label={
              tab === 'Reports' ? 'Reporting panel' : 'Simulation panel'
            }
          >
            <div className="dialog-header">
              <h2>
                {tab === 'Reports'
                  ? 'Incident reports'
                  : tab === 'Demo'
                    ? 'Guided demo'
                    : 'Simulation'}
              </h2>
              <button
                className="icon-button"
                aria-label="Close side panel"
                onClick={() => changeTab('Navigate')}
              >
                <X size={20} />
              </button>
            </div>
            {demoStep !== null && (
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
            )}
            {tab === 'Simulate' && (
              <HazardControls
                hazards={hazards}
                setHazards={updateHazards}
                place={placeHazard}
                selected={selectedHazard}
                select={setSelectedHazard}
              />
            )}
            <div hidden={tab !== 'Reports'}>
              <ReportControls
                reports={visibleReports}
                coordinate={reportLocation?.coordinate ?? null}
                segmentId={reportLocation?.segmentId}
                onPlace={() => {
                  setIntent('report');
                  dispatchSelection({ type: 'active', role: null });
                  setSheetOpen(false);
                }}
                onSubmit={submitReport}
                filters={filters}
                setFilters={setFilters}
                selected={selectedReport}
                select={setSelectedReport}
                error={reportError}
                ready={reportsReady}
                onDelete={removeReport}
              />
            </div>
            {tab === 'Demo' && (
              <SimulationPanel
                state={simulation}
                dispatch={(action) => {
                  setMode('normal');
                  simulate(action);
                }}
                flood={flood}
                baseline={baseline}
                current={current}
                canStart={Boolean(state.origin && state.destination)}
              />
            )}

            {mode !== 'normal' && (
              <section
                className="impact-summary"
                aria-label="Route comparison"
                aria-live="polite"
              >
                <h3>
                  {mode === 'simulation'
                    ? 'Simulated impacts'
                    : 'Exploratory report impacts'}
                </h3>
                <p>
                  <strong data-testid="custom-blocked">
                    {flood?.status === 'ready'
                      ? flood.metadata.segmentCount
                      : 0}
                  </strong>{' '}
                  blocked physical segments ·{' '}
                  {mode === 'simulation'
                    ? `${hazards.filter((h) => h.enabled).length} enabled hazards`
                    : 'unverified observations'}
                </p>
                {flood?.status === 'invalid' && (
                  <p role="alert">{flood.reason}</p>
                )}
                {mode === 'simulation' && (
                  <p>
                    Hazards affecting the original route:{' '}
                    {affectingHazards.join(', ') || 'None'}
                  </p>
                )}
                <dl>
                  <div>
                    <dt>Original</dt>
                    <dd>
                      {baseline?.status === 'found'
                        ? formatDistance(baseline.distanceMeters)
                        : 'Select endpoints'}
                    </dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>
                      {found
                        ? formatDistance(found.distanceMeters)
                        : baseline
                          ? 'Unavailable'
                          : 'Select endpoints'}
                    </dd>
                  </div>
                </dl>
                {comparison?.additionalMeters !== null && comparison && (
                  <p>
                    Additional distance:{' '}
                    {formatDistance(comparison.additionalMeters)}{' '}
                    {comparison.percentageIncrease !== null
                      ? `(${comparison.percentageIncrease.toFixed(1)}%)`
                      : ''}
                  </p>
                )}
                <p>
                  {baseline?.status === 'found' && flood?.status === 'ready'
                    ? `${baseline.segmentIds.filter((id) => flood.blockedSegmentIds.has(id)).length} segments of the original route affected`
                    : ''}
                </p>
                <p>
                  {found
                    ? 'Route available in this model'
                    : baseline
                      ? 'No available route'
                      : 'Choose endpoints in Navigate'}
                </p>
              </section>
            )}
            {tab === 'Demo' && demoStep === null && (
              <button
                className="primary"
                disabled={!data}
                onClick={() => showDemoStep(0)}
              >
                Start guided demo
              </button>
            )}
          </aside>
        )}
        <div className="map-legend" aria-label="Map legend">
          <span title="Dataset geographic extent, not guaranteed road connectivity">
            <i className="legend-coverage" />
            Demo area · extent only
          </span>
          <span>
            <i className="legend-road" />
            Local roads
          </span>
          <span>
            <i className="legend-route" />
            {impactActive ? 'Original route' : 'Calculated route'}
          </span>
          {impactActive && (
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
                Illustrative hazard
              </span>
            </>
          )}
        </div>
        <div className="coverage-label">
          <span>GhostRoute Demo Area — Ernakulam</span>
          <p>Dataset extent, not guaranteed connectivity.</p>
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
            Kochi–Ernakulam · frozen OSM snapshot
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
          The frozen dataset contains{' '}
          {data
            ? Object.keys(data.graph.nodes).length.toLocaleString()
            : 'loading'}{' '}
          nodes across Kochi–Ernakulam. Start a simulated flood after selecting
          endpoints. Use the stage arrows to expand or reverse the urban
          scenario; Reset simulation restores the original route. No live
          hazards, shelter availability or travel-time estimates are provided.
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
