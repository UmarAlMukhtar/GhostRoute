import { expect, it } from 'vitest';
import { createRouter } from '../../src/lib/routing/shortest-path.ts';
import { distanceMeters } from '../../src/lib/geo/distance.ts';
import { routingGraph } from '../fixtures/graph.ts';

it('snaps with geographic meters and includes the maximum distance boundary', () => {
  const graph = routingGraph(),
    router = createRouter(graph);
  const input: [number, number] = [76.2899, 9.98];
  const distance = distanceMeters(input, graph.nodes.A.coordinate);
  expect(router.snap(input, { maxDistanceMeters: distance })).toMatchObject({
    status: 'snapped',
    node: graph.nodes.A,
    distanceMeters: distance,
  });
  expect(
    router.snap(input, { maxDistanceMeters: distance - 0.001 }).status,
  ).toBe('snap-distance-exceeded');
  expect(
    router.snap(graph.nodes.A.coordinate, { maxDistanceMeters: 0 }).status,
  ).toBe('snapped');
  expect(router.snap([0, 0]).status).toBe('snap-distance-exceeded');
});
it.each([
  [181, 0],
  [0, 91],
  [NaN, 0],
  [Infinity, 0],
  [0],
  [0, 0, 0],
  null,
  'invalid',
])('rejects invalid coordinates %j', (input) => {
  expect(createRouter(routingGraph()).snap(input).status).toBe(
    'invalid-coordinate',
  );
});
it.each([-1, NaN, Infinity])(
  'rejects invalid snapping radius %s',
  (maxDistanceMeters) => {
    expect(
      createRouter(routingGraph()).snap([76.29, 9.98], { maxDistanceMeters })
        .status,
    ).toBe('invalid-request');
  },
);
it('uses incoming edges for destination candidates and outgoing edges for origin candidates', () => {
  const graph = routingGraph(),
    router = createRouter(graph);
  expect(
    router.snap(graph.nodes.D.coordinate, {
      role: 'origin',
      maxDistanceMeters: 0,
    }).status,
  ).toBe('snap-distance-exceeded');
  expect(
    router.snap(graph.nodes.D.coordinate, {
      role: 'destination',
      maxDistanceMeters: 0,
    }),
  ).toMatchObject({ status: 'snapped', node: graph.nodes.D });
  expect(
    router.snap(graph.nodes.A.coordinate, {
      blockedNodeIds: new Set(['A', 'B', 'C', 'D']),
    }).status,
  ).toBe('no-eligible-node');
  expect(
    router.snap(graph.nodes.A.coordinate, {
      blockedEdgeIds: new Set(['ab']),
      blockedSegmentIds: new Set(['ac']),
      maxDistanceMeters: 0,
    }).status,
  ).toBe('snap-distance-exceeded');
});
it('resolves coincident-node snapping ties by stable node ID', () => {
  const graph = routingGraph();
  graph.nodes.B.coordinate = [...graph.nodes.A.coordinate];
  expect(createRouter(graph).snap(graph.nodes.A.coordinate)).toMatchObject({
    status: 'snapped',
    node: { id: 'A' },
  });
});

it('optionally restricts snaps to the original largest component', () => {
  const graph = routingGraph();
  graph.nodes.F = { id: 'F', coordinate: [76.295, 9.983] };
  graph.outgoing.F = [];
  graph.edges.ef = {
    id: 'ef',
    from: 'E',
    to: 'F',
    segmentId: 'ef',
    osmWayId: 'synthetic',
    lengthMeters: 100,
    geometry: {
      type: 'LineString',
      coordinates: [graph.nodes.E.coordinate, graph.nodes.F.coordinate],
    },
  };
  graph.outgoing.E = ['ef'];
  const router = createRouter(graph);
  expect(router.snap(graph.nodes.E.coordinate)).toMatchObject({
    status: 'snapped',
    node: { id: 'E' },
  });
  expect(
    router.snap(graph.nodes.E.coordinate, { largestComponentOnly: true })
      .status,
  ).toBe('snap-distance-exceeded');
  const largerRadius = router.snap(graph.nodes.E.coordinate, {
    largestComponentOnly: true,
    maxDistanceMeters: 1000,
  });
  expect(largerRadius.status).toBe('snapped');
  if (largerRadius.status === 'snapped')
    expect(['A', 'B', 'C', 'D']).toContain(largerRadius.node.id);
});
it('uses longitude wrap and latitude in geographic snapping distance', () => {
  const graph = routingGraph();
  graph.nodes.A.coordinate = [179.999, 80];
  graph.nodes.B.coordinate = [-179.99, 80];
  graph.nodes.C.coordinate = [-179.999, 80.01];
  expect(
    createRouter(graph).snap([-179.999, 80], { maxDistanceMeters: 100 }),
  ).toMatchObject({ status: 'snapped', node: { id: 'A' } });
});

it('rejects sparse coordinate arrays instead of treating them as an empty network', () => {
  expect(createRouter(routingGraph()).snap(new Array(2)).status).toBe(
    'invalid-coordinate',
  );
});
