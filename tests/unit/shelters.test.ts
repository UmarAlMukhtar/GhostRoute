import { describe, expect, it } from 'vitest';
import { findReachableShelters } from '../../src/lib/evacuation/shelters';
import { createRouter } from '../../src/lib/routing/shortest-path';
import { createFloodEngine } from '../../src/lib/simulation/flood';
import type { MapData } from '../../src/lib/map/data';

const graph = {
  version: 'test',
  nodes: {
    origin: { id: 'origin', coordinate: [76.2, 9.9] as [number, number] },
    maharajas: {
      id: 'maharajas',
      coordinate: [76.21, 9.9] as [number, number],
    },
    marine: { id: 'marine', coordinate: [76.22, 9.9] as [number, number] },
    highCourt: {
      id: 'highCourt',
      coordinate: [76.23, 9.9] as [number, number],
    },
  },
  edges: {
    a: {
      id: 'a',
      segmentId: 'a',
      from: 'origin',
      to: 'maharajas',
      lengthMeters: 100,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [76.2, 9.9],
          [76.21, 9.9],
        ],
      },
      osmWayId: 'a',
    },
    b: {
      id: 'b',
      segmentId: 'b',
      from: 'origin',
      to: 'marine',
      lengthMeters: 200,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [76.2, 9.9],
          [76.22, 9.9],
        ],
      },
      osmWayId: 'b',
    },
    c: {
      id: 'c',
      segmentId: 'c',
      from: 'origin',
      to: 'highCourt',
      lengthMeters: 300,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [76.2, 9.9],
          [76.23, 9.9],
        ],
      },
      osmWayId: 'c',
    },
  },
  outgoing: {
    origin: ['a', 'b', 'c'],
    maharajas: [],
    marine: [],
    highCourt: [],
  },
};

function fixture() {
  const catalog = [
    { id: 'maharajas', nodeId: 'maharajas', coordinate: [76.21, 9.9] },
    { id: 'marine-drive', nodeId: 'marine', coordinate: [76.22, 9.9] },
    { id: 'high-court', nodeId: 'highCourt', coordinate: [76.23, 9.9] },
  ].map(({ id, nodeId, coordinate }) => ({
    id,
    name: id,
    locality: 'test',
    category: 'Landmark' as const,
    coordinate: coordinate as [number, number],
    nodeId,
    snapMeters: 0,
    aliases: [],
    popular: false,
  }));
  const data: MapData = {
    graph,
    roads: { type: 'FeatureCollection', features: [] },
    router: createRouter(graph),
    engine: createFloodEngine(graph),
    bounds: [76.2, 9.9, 76.23, 9.9],
    places: [],
  };
  return { data, catalog };
}

describe('illustrative shelter finder', () => {
  it('returns only reachable demo shelters ranked by closure-aware route distance', () => {
    const { data, catalog } = fixture();
    const shelters = findReachableShelters(
      data,
      { nodeId: 'origin', coordinate: [76.2, 9.9], label: 'Home' },
      catalog,
      { blockedSegmentIds: new Set(['a']) },
    );

    expect(shelters.map((shelter) => shelter.id)).toEqual([
      'marine-drive',
      'high-court',
    ]);
    expect(shelters[0].route.distanceMeters).toBe(200);
  });
});
