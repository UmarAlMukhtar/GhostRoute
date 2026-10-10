import { describe, expect, it } from 'vitest';
import {
  createRouter,
  shortestPath,
} from '../../src/lib/routing/shortest-path.ts';
import { routingGraph } from '../fixtures/graph.ts';

const request = { originNodeId: 'A', destinationNodeId: 'D' };

describe('shortest-distance routing', () => {
  it('finds the 200 m weighted path and a 300 m detour after closing bd', () => {
    const router = createRouter(routingGraph());
    expect(router.findRoute(request)).toMatchObject({
      status: 'found',
      nodeIds: ['A', 'B', 'D'],
      edgeIds: ['ab', 'bd'],
      segmentIds: ['ab', 'bd'],
      distanceMeters: 200,
    });
    expect(
      router.findRoute({ ...request, blockedEdgeIds: new Set(['bd']) }),
    ).toMatchObject({
      status: 'found',
      edgeIds: ['ac', 'cd'],
      distanceMeters: 300,
    });
    expect(shortestPath(routingGraph(), request)).toMatchObject({
      status: 'found',
      distanceMeters: 200,
    });
  });
  it('honors directed edges and disconnected components', () => {
    const router = createRouter(routingGraph());
    expect(
      router.findRoute({ originNodeId: 'D', destinationNodeId: 'A' }).status,
    ).toBe('no-route');
    expect(
      router.findRoute({ originNodeId: 'A', destinationNodeId: 'E' }).status,
    ).toBe('no-route');
  });
  it('settles the destination only when its cheapest path is known, including decreases', () => {
    const graph = routingGraph();
    graph.edges.ac.lengthMeters = 20;
    graph.edges.cd.lengthMeters = 1000;
    graph.edges.ab.lengthMeters = 30;
    graph.edges.bd.lengthMeters = 1;
    expect(createRouter(graph).findRoute(request)).toMatchObject({
      status: 'found',
      distanceMeters: 31,
      edgeIds: ['ab', 'bd'],
    });
  });
  it('resolves exact equal costs by node ID, then outgoing edge ID, independently of insertion order', () => {
    const graph = routingGraph();
    graph.edges.ac.lengthMeters = graph.edges.cd.lengthMeters = 100;
    const shuffled = structuredClone(graph);
    shuffled.edges = Object.fromEntries(
      Object.entries(shuffled.edges).reverse(),
    );
    shuffled.outgoing.A.reverse();
    for (const g of [graph, shuffled])
      expect(createRouter(g).findRoute(request)).toMatchObject({
        status: 'found',
        edgeIds: ['ab', 'bd'],
        distanceMeters: 200,
      });
  });
  it('returns a zero-length point result without an invalid LineString', () => {
    expect(
      createRouter(routingGraph()).findRoute({
        originNodeId: 'E',
        destinationNodeId: 'E',
      }),
    ).toMatchObject({
      status: 'found',
      nodeIds: ['E'],
      edgeIds: [],
      segmentIds: [],
      distanceMeters: 0,
      geometry: null,
    });
  });
  it.each([
    [{ originNodeId: 'missing', destinationNodeId: 'D' }, 'invalid-origin'],
    [
      { originNodeId: 'A', destinationNodeId: 'missing' },
      'invalid-destination',
    ],
    [{ ...request, blockedNodeIds: new Set(['A']) }, 'origin-blocked'],
    [{ ...request, blockedNodeIds: new Set(['D']) }, 'destination-blocked'],
    [
      {
        originNodeId: 'A',
        destinationNodeId: 'A',
        blockedNodeIds: new Set(['A']),
      },
      'origin-blocked',
    ],
  ])('distinguishes endpoint failures', (input, status) => {
    expect(createRouter(routingGraph()).findRoute(input).status).toBe(status);
  });
  it('blocks intermediate nodes and simultaneous edge/segment closures', () => {
    const router = createRouter(routingGraph());
    expect(
      router.findRoute({ ...request, blockedNodeIds: new Set(['B']) }),
    ).toMatchObject({ status: 'found', edgeIds: ['ac', 'cd'] });
    expect(
      router.findRoute({
        ...request,
        blockedEdgeIds: new Set(['bd']),
        blockedSegmentIds: new Set(['cd']),
      }).status,
    ).toBe('no-route');
    expect(
      router.findRoute({ ...request, blockedNodeIds: new Set(['B', 'C']) })
        .status,
    ).toBe('no-route');
  });
  it.each(['blockedNodeIds', 'blockedEdgeIds', 'blockedSegmentIds'] as const)(
    'rejects unknown %s',
    (key) => {
      expect(
        createRouter(routingGraph()).findRoute({
          ...request,
          [key]: new Set(['missing']),
        }).status,
      ).toBe('invalid-request');
    },
  );
  it('does not mutate graph, request sets or earlier results during repeated recalculation', () => {
    const graph = routingGraph(),
      original = structuredClone(graph),
      blocked = new Set(['bd']);
    const router = createRouter(graph),
      baseline = router.findRoute(request);
    for (let i = 0; i < 20; i++) {
      router.findRoute({ ...request, blockedEdgeIds: blocked });
      expect(router.findRoute(request)).toEqual(baseline);
    }
    expect(graph).toEqual(original);
    expect([...blocked]).toEqual(['bd']);
    if (baseline.status === 'found') {
      baseline.origin.coordinate[0] = 0;
      baseline.geometry!.coordinates[0][0] = 0;
    }
    expect(router.findRoute(request)).toMatchObject({
      origin: original.nodes.A,
      distanceMeters: 200,
    });
  });
  it('joins full edge shapes in traversal order, removing only duplicated junction points', () => {
    const graph = routingGraph();
    graph.edges.ab.geometry.coordinates.splice(1, 0, [76.2905, 9.9802]);
    const route = createRouter(graph).findRoute(request);
    expect(route).toMatchObject({
      status: 'found',
      origin: graph.nodes.A,
      destination: graph.nodes.D,
      geometry: {
        type: 'LineString',
        coordinates: [
          [76.29, 9.98],
          [76.2905, 9.9802],
          [76.291, 9.98],
          [76.292, 9.98],
        ],
      },
      metadata: {
        graphVersion: graph.version,
        algorithm: 'dijkstra',
        profileId: 'walking-demo',
      },
    });
  });
  it.each([0, -1, Infinity, NaN])(
    'rejects invalid graph weights at initialization: %s',
    (weight) => {
      const graph = routingGraph();
      graph.edges.ab.lengthMeters = weight;
      expect(() => createRouter(graph)).toThrow(/weight/);
    },
  );
});

it('treats a physical segment closure differently from one directed-edge closure', () => {
  const graph = routingGraph();
  graph.edges.ba = {
    ...graph.edges.ab,
    id: 'ba',
    from: 'B',
    to: 'A',
    geometry: {
      type: 'LineString',
      coordinates: [...graph.edges.ab.geometry.coordinates].reverse(),
    },
  };
  graph.outgoing.B.push('ba');
  const router = createRouter(graph),
    reverse = { originNodeId: 'B', destinationNodeId: 'A' };
  expect(
    router.findRoute({ ...reverse, blockedEdgeIds: new Set(['ab']) }),
  ).toMatchObject({ status: 'found', edgeIds: ['ba'] });
  expect(
    router.findRoute({ ...reverse, blockedSegmentIds: new Set(['ab']) }).status,
  ).toBe('no-route');
  expect(
    router.findRoute({
      originNodeId: 'A',
      destinationNodeId: 'B',
      blockedSegmentIds: new Set(['ab']),
    }).status,
  ).toBe('no-route');
});
it('uses stable edge IDs for equal-cost parallel edges', () => {
  const graph = routingGraph();
  graph.edges.aa = { ...graph.edges.ab, id: 'aa', segmentId: 'aa' };
  graph.outgoing.A.push('aa');
  expect(createRouter(graph).findRoute(request)).toMatchObject({
    status: 'found',
    edgeIds: ['aa', 'bd'],
  });
});
it('rejects unsupported profiles and malformed requests rather than claiming a route', () => {
  const router = createRouter(routingGraph());
  expect(
    router.findRoute({
      ...request,
      // @ts-expect-error Deliberate unsupported runtime profile.
      profile: { id: 'wheelchair', cost: 'distance' },
    }).status,
  ).toBe('invalid-request');
  // @ts-expect-error Deliberate malformed runtime closure set.
  expect(router.findRoute({ ...request, blockedEdgeIds: ['bd'] }).status).toBe(
    'invalid-request',
  );
  // @ts-expect-error Deliberate malformed runtime request.
  expect(router.findRoute(null).status).toBe('invalid-request');
});
it('takes a private graph snapshot and rejects invalid weighted endpoints', () => {
  const graph = routingGraph(),
    router = createRouter(graph);
  graph.edges.ab.lengthMeters = 999;
  graph.nodes.A.coordinate[0] = 0;
  expect(router.findRoute(request)).toMatchObject({
    distanceMeters: 200,
    origin: { coordinate: [76.29, 9.98] },
  });
  graph.edges.ab.to = 'missing';
  expect(() => createRouter(graph)).toThrow(/endpoint/);
});

it('rejects an explicitly malformed null profile rather than using the default', () => {
  expect(
    // @ts-expect-error Deliberately malformed runtime profile.
    createRouter(routingGraph()).findRoute({ ...request, profile: null })
      .status,
  ).toBe('invalid-request');
});
