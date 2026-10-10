import expandedFixture from '../../public/data/ernakulam/demo-paths.json';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import catalog from '../../data/places/ernakulam.json';
import evidence from '../../data/places/osm-evidence.json';
import { parseMapData } from '../../src/lib/map/data';
import {
  validatePlaces,
  filterPlaces,
  choosePlace,
} from '../../src/lib/map/places';
import { coverageGeometry } from '../../src/lib/map/coverage';
import {
  initialSelection,
  selectionReducer,
} from '../../src/lib/map/selection';
const read = (file: string): unknown =>
  JSON.parse(readFileSync(`public/data/ernakulam/${file}`, 'utf8'));
const data = parseMapData(
  read('graph.json'),
  read('roads.geojson'),
  read('demo-paths.json'),
);
const places = validatePlaces(catalog, data);
describe('verified offline place catalog', () => {
  it('preserves OSM point coordinates and evidence of named site/road membership', () => {
    expect(places.length).toBeGreaterThan(10000);
    for (const p of catalog.places.filter((p) => p.popular)) {
      const node = evidence.elements.find(
        (e) => e.type === 'node' && String(e.id) === p.sourceNodeId,
      )!;
      expect(p.coordinate).toEqual([node.lon, node.lat]);
      if (p.sourceWayId) {
        const way = evidence.elements.find(
          (e) => e.type === 'way' && String(e.id) === p.sourceWayId,
        )!;
        expect(way.nodes).toContain(Number(p.sourceNodeId));
        expect(way.tags?.name).toBeTruthy();
      } else expect(node.tags?.name).toBeTruthy();
    }
  });
  it('routes every pair through the real graph without silently choosing disconnected nodes', () => {
    for (const a of places.filter((p) => p.popular))
      for (const b of places.filter((p) => p.popular)) {
        const action = choosePlace(data, b, 'destination', {
          nodeId: a.nodeId,
          coordinate: data.graph.nodes[a.nodeId].coordinate,
          label: a.name,
        });
        expect(action.type).toBe('select');
        expect(
          data.router.findRoute({
            originNodeId: a.nodeId,
            destinationNodeId: b.nodeId,
          }).status,
        ).toBe('found');
      }
  });
  it('shows all defaults and filters aliases, punctuation, category and locality', () => {
    expect(filterPlaces(places, '')).toEqual(places.filter((p) => p.popular));
    expect(filterPlaces(places, 'maharajas')[0].name).toContain('Maharaja');
    expect(filterPlaces(places, "Maharaja's")[0].name).toContain('Maharaja');
    expect(
      filterPlaces(places, 'M G Road').some((p) => p.id === 'mg-road'),
    ).toBe(true);
    expect(
      filterPlaces(places, 'ERS').some((p) => p.id === 'south-station'),
    ).toBe(true);
    expect(
      filterPlaces(places, 'Broadway Market').some((p) => p.id === 'broadway'),
    ).toBe(true);
    expect(filterPlaces(places, 'not in catalog')).toEqual([]);
  });
  it.each([
    { coordinate: [0, 0] },
    { coordinate: [NaN, 0] },
    { nodeId: 'missing' },
    { snapMeters: 999 },
    { category: 'fiction' },
  ])('rejects invalid or mismatched places %j', (change) =>
    expect(() =>
      validatePlaces(
        { ...catalog, places: [{ ...catalog.places[0], ...change }] },
        data,
      ),
    ).toThrow(),
  );
  it('rejects duplicate IDs, wrong versions and disconnected catalog entries', () => {
    expect(() =>
      validatePlaces(
        { ...catalog, places: [catalog.places[0], catalog.places[0]] },
        data,
      ),
    ).toThrow(/Duplicate/);
    expect(() =>
      validatePlaces({ ...catalog, graphVersion: 'wrong' }, data),
    ).toThrow(/dataset/);
    const node = data.graph.nodes['277325109'];
    expect(() =>
      validatePlaces(
        {
          ...catalog,
          places: [
            {
              ...catalog.places[0],
              coordinate: node.coordinate,
              nodeId: node.id,
              snapMeters: 0,
            },
          ],
        },
        data,
      ),
    ).toThrow(/disconnected/);
  });
  it('refuses a disconnected counterpart or stale place without changing selection', () => {
    const node = data.graph.nodes[expandedFixture.disconnectedNodeId];
    expect(
      choosePlace(data, places[0], 'destination', {
        nodeId: node.id,
        coordinate: node.coordinate,
        label: 'Disconnected',
      }),
    ).toMatchObject({
      type: 'error',
      message: expect.stringContaining('cannot connect'),
    });
    expect(
      choosePlace(data, { ...places[0], nodeId: 'missing' }, 'origin', null)
        .type,
    ).toBe('error');
  });
  it('clears only the requested endpoint and its old route', () => {
    const selected = selectionReducer(initialSelection, {
      type: 'preset',
      places: data.places,
    });
    const cleared = selectionReducer(
      { ...selected, result: { status: 'no-route' } },
      { type: 'clear', role: 'origin' },
    );
    expect(cleared.origin).toBeNull();
    expect(cleared.destination).toBe(selected.destination);
    expect(cleared.result).toBeNull();
  });
});
describe('dataset extent overlay', () => {
  it('uses exact bounds for a closed line and subtle fill geometry', () => {
    const coverage = coverageGeometry(data.bounds);
    expect(coverage.outline.geometry.type).toBe('LineString');
    expect(coverage.area.geometry.coordinates[0]).toEqual(
      coverage.outline.geometry.coordinates,
    );
    const [west, south, east, north] = data.bounds;
    expect(coverage.outline.geometry.coordinates).toEqual([
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ]);
  });
  it.each(
    [[1, 2, 0, 3], [NaN, 0, 2, 3], [0, 0, 2, 100], []].map((bounds) => ({
      bounds,
    })),
  )('rejects invalid bounds %j', ({ bounds }) =>
    expect(() => coverageGeometry(bounds)).toThrow(),
  );
});
