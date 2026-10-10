import expandedFixture from '../../public/data/ernakulam/demo-paths.json';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createFloodEngine } from '../../src/lib/simulation/flood';
import { scenarios } from '../../src/lib/simulation/scenarios';
import {
  compareRoutes,
  initialSimulation,
  reroute,
  simulationReducer,
} from '../../src/lib/simulation/session';
import { validateGraph } from '../../src/lib/geo/validate';
import { createRouter } from '../../src/lib/routing/shortest-path';
import type { DisasterZone, RoadGraph } from '../../src/lib/geo/types';
const zone = (coordinates: number[][][]): DisasterZone => ({
  id: 'test',
  kind: 'flood',
  simulated: true,
  geometry: { type: 'Polygon', coordinates },
});
const square = zone([
  [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
    [0, 0],
  ],
]);
function graphForLine(coordinates: [number, number][]): RoadGraph {
  return {
    version: 'test',
    nodes: {
      a: { id: 'a', coordinate: coordinates[0] },
      b: { id: 'b', coordinate: coordinates.at(-1)! },
    },
    outgoing: { a: ['ab'], b: ['ba'] },
    edges: {
      ab: {
        id: 'ab',
        segmentId: 'road',
        from: 'a',
        to: 'b',
        lengthMeters: 100,
        geometry: { type: 'LineString', coordinates },
        osmWayId: '1',
      },
      ba: {
        id: 'ba',
        segmentId: 'road',
        from: 'b',
        to: 'a',
        lengthMeters: 100,
        geometry: { type: 'LineString', coordinates: coordinates.toReversed() },
        osmWayId: '1',
      },
    },
  };
}
const graph = validateGraph(
  JSON.parse(readFileSync('public/data/ernakulam/graph.json', 'utf8')),
);
const router = createRouter(graph),
  engine = createFloodEngine(graph);
const request = { originNodeId: '271145615', destinationNodeId: '1906667447' };
const baseline = router.findRoute(request);
function evaluate(zones: unknown, source = engine) {
  const result = source.evaluate(zones);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw Error(result.reason);
  return result;
}
describe('geographic flood intersection', () => {
  it.each([
    [
      [
        [-1, 1],
        [3, 1],
      ],
      true,
    ], // Both endpoints outside; partial intersection.
    [
      [
        [0.5, 0.5],
        [1, 1],
      ],
      true,
    ],
    [
      [
        [-1, 0],
        [0, 0],
      ],
      true,
    ], // Boundary contact.
    [
      [
        [1.5, 3],
        [3, 1.5],
      ],
      false,
    ], // Overlapping bounding boxes, disjoint geometries.
  ] as const)('checks actual geometry %j', (line, blocked) => {
    const f = evaluate(
      [square],
      createFloodEngine(graphForLine(line.map((p) => [p[0], p[1]]))),
    );
    expect(f.blockedSegmentIds.has('road')).toBe(blocked);
    expect(f.blockedEdgeIds.size).toBe(blocked ? 2 : 0);
  });
  it('deduplicates segments across simultaneous zones', () => {
    const f = evaluate(
      [square, { ...square, id: 'other' }],
      createFloodEngine(
        graphForLine([
          [-1, 1],
          [3, 1],
        ]),
      ),
    );
    expect([...f.blockedSegmentIds]).toEqual(['road']);
    expect([...f.blockedEdgeIds]).toEqual(['ab', 'ba']);
  });
  it('supports holes and disjoint MultiPolygon components', () => {
    const hole = [
      [0.5, 0.5],
      [1.5, 0.5],
      [1.5, 1.5],
      [0.5, 1.5],
      [0.5, 0.5],
    ];
    const shell =
      square.geometry.type === 'Polygon' ? square.geometry.coordinates : [];
    const e = createFloodEngine(
      graphForLine([
        [0.7, 0.7],
        [1, 1],
      ]),
    );
    expect(evaluate([zone([...shell, hole])], e).blockedSegmentIds.size).toBe(
      0,
    );
    expect(
      evaluate(
        [
          {
            ...square,
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                shell,
                [
                  [
                    [5, 5],
                    [6, 5],
                    [6, 6],
                    [5, 6],
                    [5, 5],
                  ],
                ],
              ],
            },
          },
        ],
        e,
      ).blockedSegmentIds.size,
    ).toBe(1);
  });
  it.each([
    null,
    [{ ...square, simulated: false }],
    [square, square],
    [zone([])],
    [
      zone([
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ],
      ]),
    ],
    [
      zone([
        [
          [0, 0],
          [1, 1],
          [0, 1],
          [1, 0],
          [0, 0],
        ],
      ]),
    ],
    [
      zone([
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 0],
        ],
      ]),
    ],
    [
      zone([
        [
          [0, 0],
          [NaN, 0],
          [0, 1],
          [0, 0],
        ],
      ]),
    ],
    [
      zone([
        [
          [0, 0],
          [200, 0],
          [0, 1],
          [0, 0],
        ],
      ]),
    ],
    [
      zone([
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
        [
          [3, 3],
          [4, 3],
          [4, 4],
          [3, 3],
        ],
      ]),
    ],
    [{ ...square, geometry: { type: 'MultiPolygon', coordinates: [] } }],
    [{ ...square, geometry: { type: 'Point', coordinates: [0, 0] } }],
  ])('returns a useful typed error for invalid input %j', (input) => {
    const result = engine.evaluate(input);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid')
      expect(result.reason.length).toBeGreaterThan(10);
  });
  it('empty zones clear every closure', () => {
    const f = evaluate([]);
    expect(f.metadata.segmentCount).toBe(0);
    expect(f.blockedEdgeIds.size).toBe(0);
    expect(f.blockedNodeIds.size).toBe(0);
  });
});
describe('real Ernakulam simulation and rerouting', () => {
  it.each([
    [0, 1, 5, 1411.11],
    [1, 1, 5, 1411.11],
    [1, 2, 9, 1411.11],
    [1, 3, 27, 1731.155],
  ])('verifies scenario %i stage %i', (scenario, stage, count, distance) => {
    const before = JSON.stringify(graph),
      original = structuredClone(baseline);
    const f = evaluate(scenarios[scenario].steps[stage]);
    expect(f.metadata.segmentCount).toBe(count);
    expect(f.metadata.edgeCount).toBe(count * 2);
    expect(f.blockedSegmentIds.has('768625211:4')).toBe(true);
    const result = reroute(router, baseline, f);
    expect(result?.status).toBe('found');
    if (result?.status === 'found') {
      expect(result.distanceMeters).toBeCloseTo(distance, 3);
      expect(
        result.segmentIds.every((id) => !f.blockedSegmentIds.has(id)),
      ).toBe(true);
      expect(result.edgeIds.every((id) => !f.blockedEdgeIds.has(id))).toBe(
        true,
      );
      expect(result.nodeIds.every((id) => !f.blockedNodeIds.has(id))).toBe(
        true,
      );
      expect(
        result.edgeIds.reduce(
          (sum, id) => sum + graph.edges[id].lengthMeters,
          0,
        ),
      ).toBe(result.distanceMeters);
    }
    expect(baseline).toEqual(original);
    expect(JSON.stringify(graph)).toBe(before);
    const comparison = compareRoutes(baseline, result)!;
    expect(comparison.originalMeters).toBeCloseTo(944.333, 3);
    expect(comparison.additionalMeters).toBeCloseTo(distance - 944.333, 3);
    expect(comparison.percentageIncrease).toBeCloseTo(
      ((distance - 944.333) / 944.333) * 100,
      3,
    );
  });
  it('expands monotonically and replays deterministically', () => {
    let prior = new Set<string>();
    for (const zones of scenarios[1].steps) {
      const f = evaluate(zones);
      expect([...prior].every((id) => f.blockedSegmentIds.has(id))).toBe(true);
      prior = new Set(f.blockedSegmentIds);
      expect(engine.evaluate(zones)).toEqual(f);
    }
    for (const stage of [1, 3, 2, 1, 0, 3, 0]) {
      const f = evaluate(scenarios[1].steps[stage]);
      expect(reroute(router, baseline, f)).toEqual(
        reroute(router, baseline, evaluate(scenarios[1].steps[stage])),
      );
    }
  });
  it('reports a flooded destination without inventing a route', () => {
    const f = evaluate(scenarios[2].steps[1]);
    expect(f.metadata.segmentCount).toBe(21);
    const result = reroute(router, baseline, f);
    expect(result).toEqual({
      status: 'destination-blocked',
      nodeId: request.destinationNodeId,
    });
    expect(compareRoutes(baseline, result)).toBeNull();
    expect(
      router.findRoute({ ...request, blockedSegmentIds: f.blockedSegmentIds }),
    ).toEqual({ status: 'no-route' });
  });
  it('updates when endpoints change, including flooded origin and identical endpoints', () => {
    const f = evaluate(scenarios[2].steps[1]);
    expect(
      reroute(
        router,
        router.findRoute({
          originNodeId: request.destinationNodeId,
          destinationNodeId: request.originNodeId,
        }),
        f,
      )?.status,
    ).toBe('origin-blocked');
    const same = router.findRoute({
      originNodeId: request.originNodeId,
      destinationNodeId: request.originNodeId,
    });
    expect(
      compareRoutes(same, reroute(router, same, f))?.percentageIncrease,
    ).toBeNull();
    expect(
      reroute(
        router,
        router.findRoute({
          ...request,
          destinationNodeId: expandedFixture.disconnectedNodeId,
        }),
        f,
      )?.status,
    ).toBe('no-route');
  });
  it('reset restores the exact baseline; invalid flood cannot return success', () => {
    expect(reroute(router, baseline, evaluate([]))).toEqual(baseline);
    expect(
      reroute(router, baseline, { status: 'invalid', reason: 'Bad polygon' }),
    ).toEqual({ status: 'invalid-request', reason: 'Bad polygon' });
  });
  it('returned geometry cannot mutate the dataset or subsequent runs', () => {
    const first = evaluate(scenarios[0].steps[1]);
    first.blockedRoads.features[0].geometry.coordinates[0] = [0, 0];
    expect(
      evaluate(scenarios[0].steps[1]).blockedRoads.features[0].geometry
        .coordinates[0],
    ).not.toEqual([0, 0]);
  });
  it('clamps controls, switches active scenarios and resets cleanly', () => {
    let s = simulationReducer(initialSimulation, {
      type: 'scenario',
      id: 'expanding',
    });
    s = simulationReducer(s, { type: 'start' });
    expect(s.stage).toBe(1);
    s = simulationReducer(s, { type: 'previous' });
    expect(s.stage).toBe(1);
    for (let i = 0; i < 5; i++) s = simulationReducer(s, { type: 'next' });
    expect(s.stage).toBe(3);
    s = simulationReducer(s, { type: 'scenario', id: 'unavailable' });
    expect(s.stage).toBe(1);
    s = simulationReducer(s, { type: 'reset' });
    expect(s.stage).toBe(0);
    expect(s.enabled).toBe(true);
    expect(simulationReducer(s, { type: 'clear' })).toEqual(initialSimulation);
    expect(simulationReducer(s, { type: 'scenario', id: 'invalid' })).toEqual(
      s,
    );
  });
});
