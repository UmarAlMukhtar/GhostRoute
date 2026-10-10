import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseMapData } from '../../src/lib/map/data';
import {
  filterPlaces,
  validatePlaces,
  coordinatePlace,
} from '../../src/lib/map/places';
import {
  deleteReport,
  validateReport,
  REPORT_KEY,
} from '../../src/lib/incidents/reports';
const read = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const data = parseMapData(
  read('public/data/ernakulam/graph.json'),
  read('public/data/ernakulam/roads.geojson'),
  read('public/data/ernakulam/demo-paths.json'),
);
const places = validatePlaces(read('data/places/ernakulam.json'), data);
it('routes real OSM search results across the expanded region', () => {
  const names = [
    'Edappally Market',
    'Vyttila Mobility Hub',
    'Kakkanad Water Metro',
    'Fort Kochi Police Station',
    'Aluva',
  ];
  const selections = names.map((name) => {
    const result = filterPlaces(places, name);
    expect(result.length, name).toBeGreaterThan(0);
    return result[0];
  });
  for (const destination of selections.slice(1)) {
    const route = data.router.findRoute({
      originNodeId: selections[0].nodeId,
      destinationNodeId: destination.nodeId,
    });
    expect(route.status, destination.name).toBe('found');
    if (route.status === 'found') {
      expect(route.distanceMeters).toBeGreaterThan(1000);
      expect(route.geometry?.coordinates.length).toBeGreaterThan(2);
    }
  }
});
it('parses latitude,longitude and preserves outside-network failure', () => {
  expect(coordinatePlace('9.9713489, 76.28014', data)?.nodeId).toBe(
    '271145615',
  );
  expect(coordinatePlace('0, 0', data)?.nodeId).toBe('');
  expect(coordinatePlace('not coordinates', data)).toBeNull();
});
it('deletes only a browser-created report and preserves the archive on persistence failure', () => {
  const report = validateReport(
    {
      source: 'local-report',
      id: 'mine',
      type: 'Fire',
      coordinate: data.places[0].coordinate,
      description: 'Local browser observation',
      severity: 'Low',
      submittedAt: '2026-10-11T00:00:00Z',
      status: 'Unverified',
      seeded: false,
    },
    data.bounds,
    new Set(),
  );
  const seed = { ...report, id: 'example', seeded: true };
  let archive = '';
  const storage = {
    setItem(key: string, value: string) {
      expect(key).toBe(REPORT_KEY);
      archive = value;
    },
  };
  expect(() => deleteReport(storage, [report, seed], seed.id)).toThrow(
    /Only reports/,
  );
  expect(() => deleteReport(storage, [report], 'unknown')).toThrow(
    /Only reports/,
  );
  expect(() =>
    deleteReport(
      {
        setItem() {
          throw new Error('Storage denied');
        },
      },
      [report],
      report.id,
    ),
  ).toThrow(/Storage denied/);
  expect(deleteReport(storage, [report, seed], report.id)).toEqual([seed]);
  expect(JSON.parse(archive)).toEqual([seed]);
});
