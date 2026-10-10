import { cooperatively, synchronously } from '../geo/cooperative.ts';
import type {
  GeoPoint,
  RoadGraph,
  RoadEdge,
  RoadNode,
  RouteRequest,
  RouteResult,
  RoutingOptions,
  RoutingProfile,
  RequestFailure,
  SnapOptions,
  SnapResult,
} from '../geo/types.ts';
import { point } from '../geo/validate.ts';
import { distanceMeters } from '../geo/distance.ts';
import { componentSteps } from '../geo/connectivity.ts';
import { MinHeap } from './min-heap.ts';

/** Access was filtered by walking-v1 during ingestion; no inferred safety/accessibility costs. */
export const DISTANCE_PROFILE: Readonly<RoutingProfile> = Object.freeze({
  id: 'walking-demo',
  cost: 'distance',
});

/** Accept a RoadGraph already validated at the JSON boundary; take a private snapshot once. */
export function createRouter(input: RoadGraph) {
  return synchronously(routerSteps(input));
}

export function createRouterAsync(input: RoadGraph) {
  return cooperatively(routerSteps(input));
}

function* routerSteps(input: RoadGraph) {
  let batch = 0;
  const graph: RoadGraph = {
    version: input.version,
    nodes: {},
    edges: {},
    outgoing: {},
  };
  for (const [id, node] of Object.entries(input.nodes)) {
    graph.nodes[id] = { id: node.id, coordinate: [...node.coordinate] };
    graph.outgoing[id] = [...input.outgoing[id]];
    if (++batch % 512 === 0) yield;
  }
  for (const [id, edge] of Object.entries(input.edges)) {
    graph.edges[id] = {
      ...edge,
      geometry: {
        type: edge.geometry.type,
        coordinates: edge.geometry.coordinates.map((p) => [...p]),
      },
    };
    if (++batch % 512 === 0) yield;
  }
  const nodeIds = Object.keys(graph.nodes).sort();
  if (!nodeIds.length) throw new Error('Routing graph: empty nodes');
  const cells = new Map<string, string[]>();
  const cellKey = (x: number, y: number) =>
    `${Math.floor(x / 0.002)}:${Math.floor(y / 0.002)}`;
  for (const id of nodeIds) {
    const [x, y] = graph.nodes[id].coordinate;
    const key = cellKey(x, y),
      ids = cells.get(key) ?? [];
    ids.push(id);
    cells.set(key, ids);
    if (++batch % 512 === 0) yield;
  }
  const outgoing = new Map(nodeIds.map((id) => [id, [] as string[]]));
  const incoming = new Map(nodeIds.map((id) => [id, [] as string[]]));
  const segments = new Set<string>();
  for (const [id, edge] of Object.entries(graph.edges)) {
    if (!Number.isFinite(edge.lengthMeters) || edge.lengthMeters <= 0)
      throw new Error(`Routing edge ${id}: weight must be finite and positive`);
    if (edge.id !== id || !outgoing.has(edge.from) || !incoming.has(edge.to))
      throw new Error(`Routing edge ${id}: invalid ID or endpoint`);
    outgoing.get(edge.from)!.push(id);
    incoming.get(edge.to)!.push(id);
    segments.add(edge.segmentId);
    if (++batch % 512 === 0) yield;
  }
  for (const ids of outgoing.values()) ids.sort();
  const largestComponent = new Set((yield* componentSteps(graph))[0]);
  const cloneNode = (id: string): RoadNode => ({
    id,
    coordinate: [...graph.nodes[id].coordinate],
  });

  function validateOptions(options: RoutingOptions): RequestFailure | null {
    if (!options || typeof options !== 'object')
      return { status: 'invalid-request', reason: 'Expected routing options' };
    const profile =
      options.profile === undefined ? DISTANCE_PROFILE : options.profile;
    if (
      !profile ||
      typeof profile !== 'object' ||
      profile.id !== DISTANCE_PROFILE.id ||
      profile.cost !== 'distance'
    )
      return {
        status: 'invalid-request',
        reason:
          'Unsupported routing profile; only walking-demo distance is available',
      };
    for (const [name, blocked, valid] of [
      [
        'blockedNodeIds',
        options.blockedNodeIds,
        (id: string) => outgoing.has(id),
      ],
      [
        'blockedEdgeIds',
        options.blockedEdgeIds,
        (id: string) => Object.hasOwn(graph.edges, id),
      ],
      [
        'blockedSegmentIds',
        options.blockedSegmentIds,
        (id: string) => segments.has(id),
      ],
    ] as const) {
      if (blocked === undefined) continue;
      if (!(blocked instanceof Set))
        return { status: 'invalid-request', reason: `${name} must be a Set` };
      for (const id of blocked)
        if (typeof id !== 'string' || !valid(id))
          return {
            status: 'invalid-request',
            reason: `${name}: unknown ID ${String(id)}`,
          };
    }
    return null;
  }
  function available(edge: RoadEdge, options: RoutingOptions): boolean {
    return (
      !options.blockedEdgeIds?.has(edge.id) &&
      !options.blockedSegmentIds?.has(edge.segmentId) &&
      !options.blockedNodeIds?.has(edge.from) &&
      !options.blockedNodeIds?.has(edge.to)
    );
  }

  function findRoute(request: RouteRequest): RouteResult {
    if (!request || typeof request !== 'object')
      return { status: 'invalid-request', reason: 'Expected route request' };
    const { originNodeId: origin, destinationNodeId: destination } = request;
    if (typeof origin !== 'string' || !outgoing.has(origin))
      return { status: 'invalid-origin', nodeId: String(origin) };
    if (typeof destination !== 'string' || !outgoing.has(destination))
      return { status: 'invalid-destination', nodeId: String(destination) };
    const invalid = validateOptions(request);
    if (invalid) return invalid;
    if (request.blockedNodeIds?.has(origin))
      return { status: 'origin-blocked', nodeId: origin };
    if (request.blockedNodeIds?.has(destination))
      return { status: 'destination-blocked', nodeId: destination };
    const queue = new MinHeap(),
      distances = new Map([[origin, 0]]),
      previous = new Map<string, string>(),
      settled = new Set<string>();
    queue.decrease(origin, 0);
    for (let current = queue.pop(); current; current = queue.pop()) {
      settled.add(current.nodeId);
      if (current.nodeId === destination) {
        const edgeIds: string[] = [],
          routeNodes = [destination];
        for (let node = destination; node !== origin;) {
          const id = previous.get(node)!;
          edgeIds.push(id);
          node = graph.edges[id].from;
          routeNodes.push(node);
        }
        edgeIds.reverse();
        routeNodes.reverse();
        const coordinates = edgeIds.flatMap((id, i) =>
          graph.edges[id].geometry.coordinates
            .slice(i === 0 ? 0 : 1)
            .map((p) => [...p]),
        );
        return {
          status: 'found',
          origin: cloneNode(origin),
          destination: cloneNode(destination),
          nodeIds: routeNodes,
          edgeIds,
          segmentIds: edgeIds.map((id) => graph.edges[id].segmentId),
          distanceMeters: current.distance,
          geometry: edgeIds.length ? { type: 'LineString', coordinates } : null,
          metadata: {
            graphVersion: graph.version,
            algorithm: 'dijkstra',
            profileId: DISTANCE_PROFILE.id,
            settledNodeCount: settled.size,
          },
        };
      }
      for (const id of outgoing.get(current.nodeId)!) {
        const edge = graph.edges[id];
        if (settled.has(edge.to) || !available(edge, request)) continue;
        const nextDistance = current.distance + edge.lengthMeters;
        if (!Number.isFinite(nextDistance))
          throw new Error('Routing distance overflow; invalid graph weights');
        if (nextDistance < (distances.get(edge.to) ?? Infinity)) {
          distances.set(edge.to, nextDistance);
          previous.set(edge.to, id);
          queue.decrease(edge.to, nextDistance);
        }
      }
    }
    return { status: 'no-route' };
  }

  function snap(coordinate: unknown, options: SnapOptions = {}): SnapResult {
    const invalid = validateOptions(options);
    if (invalid) return invalid;
    let inputPoint: GeoPoint;
    try {
      // Materialize array holes so the geographic validator checks them too.
      inputPoint = point(
        Array.isArray(coordinate) ? [...coordinate] : coordinate,
        'snap',
      );
    } catch {
      return {
        status: 'invalid-coordinate',
        reason: 'Expected finite WGS84 [longitude, latitude]',
      };
    }
    const maxDistanceMeters =
      options.maxDistanceMeters === undefined ? 100 : options.maxDistanceMeters;
    if (
      !Number.isFinite(maxDistanceMeters) ||
      maxDistanceMeters < 0 ||
      (options.role !== undefined &&
        !['origin', 'destination'].includes(options.role)) ||
      (options.largestComponentOnly !== undefined &&
        typeof options.largestComponentOnly !== 'boolean')
    )
      return {
        status: 'invalid-request',
        reason: 'Invalid snapping radius, role or component option',
      };
    let nearest: string | undefined,
      nearestDistance = Infinity;
    const latitudeRadius = maxDistanceMeters / 110000;
    const longitudeRadius =
      latitudeRadius /
      Math.max(0.01, Math.cos((inputPoint[1] * Math.PI) / 180));
    const candidates: string[] = [];
    const minX = Math.floor((inputPoint[0] - longitudeRadius) / 0.002),
      maxX = Math.floor((inputPoint[0] + longitudeRadius) / 0.002);
    const minY = Math.floor((inputPoint[1] - latitudeRadius) / 0.002),
      maxY = Math.floor((inputPoint[1] + latitudeRadius) / 0.002);
    if ((maxX - minX + 1) * (maxY - minY + 1) <= 10000)
      for (let x = minX; x <= maxX; x++)
        for (let y = minY; y <= maxY; y++)
          candidates.push(...(cells.get(`${x}:${y}`) ?? []));
    // Outside the indexed radius, retain the exact nearest-distance failure contract.
    const nearby = candidates.length ? candidates.sort() : nodeIds;
    function inspect(ids: readonly string[]) {
      for (const id of ids) {
        if (
          options.blockedNodeIds?.has(id) ||
          (options.largestComponentOnly && !largestComponent.has(id))
        )
          continue;
        const incident =
          options.role === 'destination'
            ? incoming.get(id)!
            : outgoing.get(id)!;
        if (!incident.some((edgeId) => available(graph.edges[edgeId], options)))
          continue;
        const distance = distanceMeters(inputPoint, graph.nodes[id].coordinate);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = id;
        }
      }
    }
    inspect(nearby);
    if (!nearest || nearestDistance > maxDistanceMeters) inspect(nodeIds);
    if (!nearest) return { status: 'no-eligible-node' };
    if (nearestDistance > maxDistanceMeters)
      return {
        status: 'snap-distance-exceeded',
        nearestDistanceMeters: nearestDistance,
        maxDistanceMeters,
      };
    return {
      status: 'snapped',
      node: cloneNode(nearest),
      distanceMeters: nearestDistance,
      graphVersion: graph.version,
    };
  }
  return { findRoute, snap };
}

/** One-off convenience; reuse createRouter(graph) for repeated closure updates. */
export function shortestPath(
  graph: RoadGraph,
  request: RouteRequest,
): RouteResult {
  return createRouter(graph).findRoute(request);
}
