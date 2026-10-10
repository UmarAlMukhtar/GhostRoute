import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import type { RoadClosures } from '../../src/lib/geo/types.ts';
import { validateGraph } from '../../src/lib/geo/validate.ts';
import { createRouter } from '../../src/lib/routing/shortest-path.ts';
import fixture from '../../public/data/ernakulam/demo-paths.json';

const graph = validateGraph(
  JSON.parse(readFileSync('public/data/ernakulam/graph.json', 'utf8')),
);
const router = createRouter(graph);
const request = {
  originNodeId: fixture.origin.nodeId,
  destinationNodeId: fixture.destination.nodeId,
};

// Independent Bellman-Ford oracle in integer millimeters; test-only, no heap or path reconstruction.
function referenceDistance(
  origin: string,
  destination: string,
  blocked: RoadClosures = {},
): number {
  const distances = new Map([[origin, 0]]);
  for (let pass = 1; pass < Object.keys(graph.nodes).length; pass++) {
    let changed = false;
    for (const edge of Object.values(graph.edges)) {
      if (
        blocked.blockedSegmentIds?.has(edge.segmentId) ||
        blocked.blockedEdgeIds?.has(edge.id) ||
        blocked.blockedNodeIds?.has(edge.from) ||
        blocked.blockedNodeIds?.has(edge.to)
      )
        continue;
      const candidate =
        (distances.get(edge.from) ?? Infinity) +
        Math.round(edge.lengthMeters * 1000);
      if (candidate < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidate);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return (distances.get(destination) ?? Infinity) / 1000;
}

it('proves the real Hospital Road shortest-distance detour against an independent solver', () => {
  const closure = { blockedSegmentIds: new Set([fixture.blockedSegmentId]) };
  const baseline = router.findRoute(request),
    alternate = router.findRoute({ ...request, ...closure });
  expect(baseline.status).toBe('found');
  expect(alternate.status).toBe('found');
  if (baseline.status !== 'found' || alternate.status !== 'found')
    throw new Error('Expected real routes');
  expect(baseline.distanceMeters).toBeCloseTo(944.333, 3);
  expect(alternate.distanceMeters).toBeCloseTo(980.79, 3);
  expect(baseline.distanceMeters).toBeCloseTo(
    referenceDistance(request.originNodeId, request.destinationNodeId),
    6,
  );
  expect(alternate.distanceMeters).toBeCloseTo(
    referenceDistance(request.originNodeId, request.destinationNodeId, closure),
    6,
  );
  expect(alternate.distanceMeters - baseline.distanceMeters).toBeCloseTo(
    36.457,
    3,
  );
  expect(baseline.segmentIds).toContain(fixture.blockedSegmentId);
  expect(alternate.segmentIds).not.toContain(fixture.blockedSegmentId);
  expect(
    alternate.edgeIds.some((id) => fixture.blockedEdgeIds.includes(id)),
  ).toBe(false);
  for (const route of [baseline, alternate]) {
    let current = request.originNodeId,
      distance = 0;
    for (const id of route.edgeIds) {
      const e = graph.edges[id];
      expect(e.from).toBe(current);
      current = e.to;
      distance += e.lengthMeters;
    }
    expect(current).toBe(request.destinationNodeId);
    expect(distance).toBeCloseTo(route.distanceMeters, 9);
    expect(route.geometry!.coordinates[0]).toEqual(fixture.origin.coordinate);
    expect(route.geometry!.coordinates.at(-1)).toEqual(
      fixture.destination.coordinate,
    );
    expect(route.nodeIds).toEqual([
      request.originNodeId,
      ...route.edgeIds.map((id) => graph.edges[id].to),
    ]);
  }
  const reverse = router.findRoute({
    originNodeId: request.destinationNodeId,
    destinationNodeId: request.originNodeId,
    ...closure,
  });
  expect(reverse).toMatchObject({ status: 'found' });
  if (reverse.status === 'found')
    expect(reverse.segmentIds).not.toContain(fixture.blockedSegmentId);
  expect(router.findRoute(request)).toEqual(baseline);
});
it('matches independent shortest distances across representative real requests and closures', () => {
  const pairs = [
    [request.destinationNodeId, request.originNodeId],
    [request.originNodeId, fixture.disconnectedNodeId],
    [request.originNodeId, Object.keys(graph.nodes).sort()[400]],
  ];
  const closed = {
    blockedEdgeIds: new Set(fixture.baseline.edgeIds.slice(4, 7)),
    blockedNodeIds: new Set([graph.edges[fixture.baseline.edgeIds[8]].from]),
  };
  for (const [originNodeId, destinationNodeId] of pairs) {
    const expected = referenceDistance(originNodeId, destinationNodeId, closed),
      actual = router.findRoute({ originNodeId, destinationNodeId, ...closed });
    if (expected === Infinity) expect(actual.status).toBe('no-route');
    else {
      expect(actual.status).toBe('found');
      if (actual.status === 'found')
        expect(actual.distanceMeters).toBeCloseTo(expected, 6);
    }
  }
});
it('snaps the real fixture endpoints and rejects a distant point', () => {
  expect(
    router.snap(fixture.origin.coordinate, { largestComponentOnly: true }),
  ).toMatchObject({
    status: 'snapped',
    node: { id: fixture.origin.nodeId },
    distanceMeters: 0,
  });
  expect(
    router.snap(fixture.destination.coordinate, {
      role: 'destination',
      largestComponentOnly: true,
    }),
  ).toMatchObject({
    status: 'snapped',
    node: { id: fixture.destination.nodeId },
    distanceMeters: 0,
  });
  expect(router.snap([76, 10]).status).toBe('snap-distance-exceeded');
});
