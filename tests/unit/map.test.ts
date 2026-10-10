import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseMapData } from '../../src/lib/map/data';
import {
  formatDistance,
  initialSelection,
  routeMessage,
  selectCoordinate,
  selectionReducer,
} from '../../src/lib/map/selection';
import { localStyle } from '../../src/lib/map/style';
const read = (file: string): unknown =>
  JSON.parse(readFileSync(`public/data/ernakulam/${file}`, 'utf8'));
const graph = read('graph.json'),
  roads = read('roads.geojson'),
  fixture = read('demo-paths.json');
const data = parseMapData(graph, roads, fixture);
afterEach(() => vi.unstubAllGlobals());
describe('browser data boundary', () => {
  it('loads real road geometry and initializes the actual router', () => {
    expect(data.roads.features).toHaveLength(1856);
    expect(data.bounds).toEqual([76.2732579, 9.9638296, 76.2936855, 9.9897189]);
    const result = data.router.findRoute({
      originNodeId: data.places[0].nodeId,
      destinationNodeId: data.places[1].nodeId,
    });
    expect(result.status).toBe('found');
    if (result.status === 'found') {
      expect(result.distanceMeters).toBeCloseTo(944.333, 3);
      expect(result.geometry?.coordinates[0]).toEqual(
        data.places[0].coordinate,
      );
      expect(formatDistance(result.distanceMeters)).toBe('944.3 m');
    }
  });
  it.each([
    [null, roads, fixture, /graph/],
    [
      graph,
      { type: 'FeatureCollection', features: [] },
      fixture,
      /missing segments/,
    ],
    [graph, roads, { graphVersion: 'wrong' }, /version/],
  ])('rejects corrupt assets', (g, r, f, error) =>
    expect(() => parseMapData(g, r, f)).toThrow(error as RegExp),
  );
  it('rejects a road geometry that differs from the graph', () => {
    const changed = structuredClone(data.roads);
    changed.features[0].geometry.coordinates[0] = [0, 0];
    expect(() => parseMapData(graph, changed, fixture)).toThrow(
      /geometry differs/,
    );
  });
  it('shares a single in-flight loader and router across mounts', async () => {
    vi.resetModules();
    const fetcher = vi.fn(
      async (url: string) =>
        new Response(JSON.stringify(read(url.split('/').at(-1)!))),
    );
    vi.stubGlobal('fetch', fetcher);
    const { loadMapData } = await import('../../src/lib/map/data');
    const [a, b] = await Promise.all([loadMapData(), loadMapData()]);
    expect(a).toBe(b);
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(await loadMapData()).toBe(a);
  });
  it('reports HTTP failures and permits retry', async () => {
    vi.resetModules();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    const { loadMapData } = await import('../../src/lib/map/data');
    await expect(loadMapData()).rejects.toThrow(/503/);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (url: string) =>
          new Response(JSON.stringify(read(url.split('/').at(-1)!))),
      ),
    );
    expect((await loadMapData()).places).toHaveLength(2);
  });
});
describe('selection and presentation', () => {
  it('selects and snaps origin then destination, clearing an obsolete route', () => {
    const origin = selectCoordinate(data, data.places[0].coordinate, 'origin');
    const selected = selectionReducer(initialSelection, origin);
    expect(selected.origin?.nodeId).toBe(data.places[0].nodeId);
    expect(selected.active).toBe('destination');
    const complete = selectionReducer(
      selected,
      selectCoordinate(data, data.places[1].coordinate, 'destination'),
    );
    expect(complete.destination?.snapMeters).toBe(0);
    expect(complete.active).toBeNull();
    expect(
      selectionReducer({ ...complete, result: { status: 'no-route' } }, origin)
        .result,
    ).toBeNull();
  });
  it('has keyboard presets and reset', () => {
    const state = selectionReducer(initialSelection, {
      type: 'preset',
      places: data.places,
    });
    expect(state.origin).toEqual(data.places[0]);
    expect(state.destination).toEqual(data.places[1]);
    expect(selectionReducer(state, { type: 'reset' })).toEqual(
      initialSelection,
    );
  });
  it('rejects far and invalid coordinates without replacing valid selections', () => {
    const selected = selectionReducer(initialSelection, {
      type: 'preset',
      places: data.places,
    });
    const action = selectCoordinate(data, [0, 0], 'origin');
    const rejected = selectionReducer(selected, action);
    expect(rejected.message).toContain('outside the supported');
    expect(rejected.origin).toBe(selected.origin);
    expect(selectCoordinate(data, [NaN, 0], 'destination').type).toBe('error');
  });
  it('keeps unreachable outcomes explicit', () => {
    const result = data.router.findRoute({
      originNodeId: data.places[0].nodeId,
      destinationNodeId: '11189614551',
    });
    expect(routeMessage(result)).toContain('No available route');
  });
  it('builds a tile-independent style with independent route and simulation layers', () => {
    const style = localStyle(data.roads, data.bounds);
    expect(style.sources.roads.type).toBe('geojson');
    expect(style.sources).not.toHaveProperty('basemap');
    expect(style.layers.map((layer) => layer.id)).toEqual([
      'background',
      'demo-area',
      'hazards',
      'hazard-boundary',
      'road-casing',
      'roads',
      'demo-boundary',
      'route-casing',
      'route',
      'alternative-casing',
      'alternative',
      'blockedRoads',
      'reports',
    ]);
    expect(formatDistance(1234)).toBe('1.23 km');
  });
});
