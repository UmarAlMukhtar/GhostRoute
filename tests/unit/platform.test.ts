import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseMapData } from '../../src/lib/map/data';
import { createFloodEngine } from '../../src/lib/simulation/flood';
import {
  hazardInputs,
  hazardZone,
  withinCoverage,
  type SimulatedHazard,
} from '../../src/lib/simulation/hazards';
import { reroute } from '../../src/lib/simulation/session';
import { distanceMeters } from '../../src/lib/geo/distance';
import {
  filterReports,
  loadReports,
  reportClosures,
  saveReport,
  validateReport,
  REPORT_KEY,
} from '../../src/lib/incidents/reports';
const read = (file: string): unknown =>
  JSON.parse(readFileSync(`public/data/ernakulam/${file}`, 'utf8'));
const data = parseMapData(
  read('graph.json'),
  read('roads.geojson'),
  read('demo-paths.json'),
);
const engine = createFloodEngine(data.graph);
const segments = new Set(
  data.roads.features.map((f) => f.properties.segmentId),
);
const baseline = data.router.findRoute({
  originNodeId: data.places[0].nodeId,
  destinationNodeId: data.places[1].nodeId,
});
const hazard: SimulatedHazard = {
  source: 'simulation',
  id: 'h1',
  kind: 'flood',
  enabled: true,
  center: [76.2806, 9.9714],
  radiusMeters: 20,
};
const raw = {
  source: 'local-report',
  id: 'r1',
  type: 'Flooded road',
  coordinate: data.places[0].coordinate,
  description: 'Water observed across the road',
  severity: 'Low',
  status: 'Unverified',
  submittedAt: '2026-10-10T18:00:00Z',
  seeded: false,
  segmentId: '768625211:4',
};
const report = validateReport(raw, data.bounds, segments);
describe('interactive hazard impact on the real graph', () => {
  it.each(['flood', 'landslide', 'fire'] as const)(
    'uses geodesic geometry and shared intersection for %s',
    (kind) => {
      const zone = hazardZone({ ...hazard, kind });
      const coordinate = zone.geometry.coordinates[0][0] as [number, number];
      expect(distanceMeters(hazard.center, coordinate)).toBeCloseTo(20, 4);
      const impact = engine.evaluate([zone]);
      expect(impact.status).toBe('ready');
      if (impact.status !== 'ready') return;
      expect(impact.metadata.segmentCount).toBeGreaterThan(0);
      expect(impact.hazards.features[0].properties?.kind).toBe(kind);
      const result = reroute(data.router, baseline, impact);
      expect(result?.status).toBe('found');
      if (result?.status === 'found' && baseline.status === 'found') {
        expect(result.distanceMeters).toBeGreaterThanOrEqual(
          baseline.distanceMeters,
        );
        expect(
          result.segmentIds.some((id) => impact.blockedSegmentIds.has(id)),
        ).toBe(false);
      }
    },
  );
  it('combines multiple hazards and directed closures, edits, disables, removes and resets without graph mutation', () => {
    const before = JSON.stringify(data.graph);
    const a = {
      ...hazard,
      kind: 'roadblock' as const,
      segmentId: '768625211:4',
    };
    const b = { ...hazard, id: 'fire', kind: 'fire' as const };
    const inputs = hazardInputs([
      a,
      b,
      { ...b, id: 'disabled', enabled: false },
    ]);
    const impact = engine.evaluate(inputs.zones, inputs.segments);
    expect(impact.status).toBe('ready');
    if (impact.status !== 'ready') return;
    expect(impact.blockedSegmentIds.has(a.segmentId)).toBe(true);
    for (const edge of Object.values(data.graph.edges).filter(
      (e) => e.segmentId === a.segmentId,
    ))
      expect(impact.blockedEdgeIds.has(edge.id)).toBe(true);
    for (let i = 0; i < 5; i++)
      expect(engine.evaluate(inputs.zones, inputs.segments)).toEqual(impact);
    const edited = engine.evaluate([hazardZone({ ...b, radiusMeters: 100 })]);
    if (edited.status === 'ready')
      expect(edited.metadata.segmentCount).toBeGreaterThan(
        impact.metadata.segmentCount,
      );
    const removed = hazardInputs([a]);
    const alternate = reroute(
      data.router,
      baseline,
      engine.evaluate(removed.zones, removed.segments),
    );
    expect(alternate?.status).toBe('found');
    if (alternate?.status === 'found')
      expect(alternate.distanceMeters).toBeCloseTo(980.79, 3);
    expect(reroute(data.router, baseline, engine.evaluate([]))).toEqual(
      baseline,
    );
    expect(JSON.stringify(data.graph)).toBe(before);
  });
  it('handles an exclusion zone around the destination and rejects invalid input', () => {
    expect(
      reroute(
        data.router,
        baseline,
        engine.evaluate([
          hazardZone({ ...hazard, center: data.places[1].coordinate }),
        ]),
      )?.status,
    ).toBe('destination-blocked');
    expect(engine.evaluate([], new Set(['missing']))).toMatchObject({
      status: 'invalid',
    });
    expect(() => hazardZone({ ...hazard, radiusMeters: NaN })).toThrow(
      /Radius/,
    );
    expect(() => hazardZone({ ...hazard, center: [NaN, 0] })).toThrow();
    expect(withinCoverage([0, 0], data.bounds)).toBe(false);
  });
});
describe('untrusted local reports', () => {
  it('persists and reloads, independent of hazard reset', () => {
    let value: string | null = null;
    const storage = {
      getItem: () => value,
      setItem: (key: string, v: string) => {
        expect(key).toBe(REPORT_KEY);
        value = v;
      },
    };
    saveReport(storage, [], report);
    expect(loadReports(storage, data.bounds, segments)).toEqual([report]);
    hazardInputs([]);
    expect(loadReports(storage, data.bounds, segments)).toEqual([report]);
  });
  it('does not trust self-declared verification; exploratory mode is explicit and seeds are excluded', () => {
    const forged = validateReport(
      { ...raw, status: 'Verified' },
      data.bounds,
      segments,
    );
    expect(forged.status).toBe('Unverified');
    expect(reportClosures([forged], false).size).toBe(0);
    expect(reportClosures([forged], true)).toEqual(new Set(['768625211:4']));
    expect(
      reportClosures(
        [
          { ...forged, seeded: true },
          { ...forged, status: 'Resolved' },
          { ...forged, status: 'Rejected' },
        ],
        true,
      ).size,
    ).toBe(0);
  });
  it.each([
    { description: 'a' },
    { coordinate: [0, 0] },
    { type: 'invented' },
    { status: 'trusted' },
    { segmentId: 'missing' },
    { submittedAt: 'bad' },
    { severity: 'extreme' },
    { source: 'simulation' },
  ])('rejects malformed reports %j', (change) =>
    expect(() =>
      validateReport({ ...raw, ...change }, data.bounds, segments),
    ).toThrow(),
  );
  it('filters without changing routing semantics', () => {
    const resolved = { ...report, id: 'resolved', status: 'Resolved' as const };
    expect(
      filterReports([report, resolved], {
        type: 'Flooded road',
        status: '',
        severity: 'Low',
        activity: 'active',
      }),
    ).toEqual([report]);
    expect(
      filterReports([report, resolved], {
        type: '',
        status: '',
        severity: '',
        activity: 'resolved',
      }),
    ).toEqual([resolved]);
    expect(
      filterReports([report], {
        type: 'Fire',
        status: '',
        severity: '',
        activity: 'all',
      }),
    ).toEqual([]);
  });
  it('rejects corrupt archives, duplicates, rate limits and surfaces storage failure', () => {
    expect(() =>
      loadReports({ getItem: () => '{' }, data.bounds, segments),
    ).toThrow();
    expect(() =>
      loadReports(
        { getItem: () => JSON.stringify([raw, raw]) },
        data.bounds,
        segments,
      ),
    ).toThrow(/Duplicate/);
    const now = Date.now();
    const recent = [0, 1, 2].map((i) => ({
      ...report,
      id: String(i),
      submittedAt: new Date(now).toISOString(),
    }));
    expect(() =>
      saveReport({ setItem: () => {} }, recent, report, now),
    ).toThrow(/three/);
    expect(() =>
      saveReport(
        {
          setItem: () => {
            throw new Error('quota');
          },
        },
        [],
        report,
      ),
    ).toThrow('quota');
  });
});
