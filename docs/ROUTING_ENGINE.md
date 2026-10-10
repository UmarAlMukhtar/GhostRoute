# Routing engine

ROUTE-01 implements pure TypeScript routing and node snapping. No backend, React, Next.js, map renderer, network call or new dependency is required. Public API: [`src/lib/routing/shortest-path.ts`](../src/lib/routing/shortest-path.ts); contracts remain in [`src/lib/geo/types.ts`](../src/lib/geo/types.ts).

## Load once, calculate repeatedly

```ts
import { validateGraph } from '@/lib/geo/validate';
import { createRouter } from '@/lib/routing/shortest-path';

const response = await fetch('/data/ernakulam/graph.json');
if (!response.ok) throw new Error(`Road dataset HTTP ${response.status}`);
const input: unknown = await response.json();
const graph = validateGraph(input);
const router = createRouter(graph);

const request = {
  originNodeId: '271145615',
  destinationNodeId: '1906667447',
};
const baseline = router.findRoute(request);
const closures = { blockedSegmentIds: new Set(['768625211:4']) };
const updated = router.findRoute({ ...request, ...closures });
const reset = router.findRoute(request);
```

Validate unknown JSON with the existing geographic validator **before** initialization. `createRouter(graph: RoadGraph)` takes a private snapshot, verifies positive finite weights/endpoints, and builds sorted outgoing/incoming adjacency, known segment IDs and the largest original weak component. It is not a replacement for the JSON/geographic validator. The typed mathematical test fixture deliberately has invented weights; it is not valid OSM ingestion data.

Create one router per dataset version, not per render or closure change. No routing method mutates the supplied graph, closure sets or previous results. Returned nodes/geometry are independent copies. `shortestPath(graph, request)` is a one-off convenience that initializes each call; prefer the router for repeated updates. Initialization failures throw useful data errors; render a dataset-error state instead of pretending a route exists.

## Requests and results

`RouteRequest` requires origin/destination node IDs. Profile and closure sets are optional. Closures accept JavaScript `Set<string>` values through `ReadonlySet<string>` contracts:

- `blockedNodeIds`: exclude the nodes and every incident traversal.
- `blockedEdgeIds`: exclude only those directed edges.
- `blockedSegmentIds`: exclude every directed edge of those physical roads, with an O(1) membership check per edge. No expansion or graph mutation is needed.

Unknown closure IDs, non-Set values and unsupported/malformed profiles return `invalid-request`. Unknown endpoints return `invalid-origin` or `invalid-destination`. Failure precedence is origin validity, destination validity, options, origin blockage, destination blockage, then traversal. Both endpoints blocked returns `origin-blocked` first.

| Status                                  | Meaning                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `found`                                 | Ordered nodes, directed edges, physical segments, distance and graph-edge geometry |
| `invalid-origin`, `invalid-destination` | Endpoint ID is absent/invalid                                                      |
| `origin-blocked`, `destination-blocked` | Selected endpoint belongs to blocked nodes                                         |
| `no-route`                              | No directed path under these closures; may be a disconnected component             |
| `invalid-request`                       | Unsupported profile, closure IDs/types or snapping options                         |
| `invalid-coordinate`                    | Snapping input is not a finite WGS84 longitude/latitude pair                       |
| `snap-distance-exceeded`                | Nearest eligible node lies beyond the allowed radius                               |
| `no-eligible-node`                      | Snapping found no candidate with an available incident traversal                   |

Node-based `findRoute` returns routing statuses. `snap` returns `snapped` or snapping failures; those failures are also included in `RouteResult` so consumers can propagate a failed selection directly without inventing a route.

Successful routes include `origin`, `destination`, `nodeIds`, `edgeIds`, `segmentIds` (ordered, one per traversed edge), `distanceMeters`, `geometry`, and metadata: graph version, algorithm, profile ID and settled-node count. Distances sum existing edge weights, with no display rounding, ETA or safety score. Geometry concatenates full directed edge shapes, omitting only duplicated junction coordinates. For identical unblocked endpoints: one node, zero distance, empty edge/segment arrays, **null geometry**; a one-coordinate LineString would be invalid GeoJSON. Failures never contain a fallback line.

## Algorithm and determinism

Dijkstra uses an indexed binary min-heap with decrease-key: at most one queued entry per node. Priority is distance then code-unit node-ID ordering; outgoing edges are sorted by code-unit edge ID. Equal-distance relaxation preserves the first predecessor. It stops only when the destination is popped at minimum distance. Positive weights are mandatory; negative, zero and nonfinite weights are rejected at initialization. Distance overflow throws a graph error rather than returning a successful route.

Traversal is O((V + E) log V), plus closure-ID validation O(C) and geometry output size. Per-request queue/distances/predecessors use O(V) memory. The private graph, adjacency and component index are built once; no incremental routing or worker is required. Exact numeric ties use JavaScript number comparison, without an epsilon that could select a longer path. Equivalent graph insertion orders and repeated requests yield the same result, including metadata. Decimal meter sums can have tiny floating-point tails; round only when displaying.

## Walking profile

`DISTANCE_PROFILE` is the default `{ id: 'walking-demo', cost: 'distance' }`. It uses the walking access rules already applied by MAP-01. Missing accessibility, surface quality or disaster safety attributes are never inferred. The profile contract and explicit support check are the extension point: adding another profile requires validated supporting data, eligibility/cost semantics, tests and an ADR. Wheelchair routing is intentionally unsupported; this graph includes steps.

## Coordinate snapping

```ts
const origin = router.snap([76.28014, 9.9713489], {
  maxDistanceMeters: 100,
  largestComponentOnly: true,
  role: 'origin',
  ...closures,
});
const destination = router.snap([76.2860629, 9.9684255], {
  role: 'destination',
  largestComponentOnly: true,
  ...closures,
});
if (origin.status === 'snapped' && destination.status === 'snapped') {
  const route = router.findRoute({
    originNodeId: origin.node.id,
    destinationNodeId: destination.node.id,
    ...closures,
  });
  // Render geometry only when route.status === 'found' and geometry is not null.
  console.log(route);
}
```

Haversine distance handles longitude wrapping and latitude. Default maximum is 100 m, inclusive; zero is allowed, negative/nonfinite values are invalid. Ties use stable node IDs. Origin candidates need an available outgoing edge; destination candidates need an available incoming edge. Blocked nodes and incident blocked traversals are excluded. The optional largest-component filter uses the **original weak component**, not dynamically recomputed flood connectivity. It does not promise directed reachability; routing still decides that. Isolated nodes can support a valid zero-length node-to-itself route but are not snap candidates.

This O(V + E) scan is appropriate for 1,719 nodes. Snapping to a shape node is an MVP approximation, not the nearest accessible road entrance or a verified physical approach. Do not draw a straight connector across buildings/water or infer safety from snap distance. No edge splitting or proximity-based topology changes occur.

## Real fixture and performance

For MAP-01's Hospital Road endpoints, Dijkstra finds **944.333 m** clear and **980.790 m** after blocking physical segment `768625211:4`, an increase of **36.457 m**. The clear route contains that segment; the updated route excludes both directions. Unit tests independently verify optimal distances with test-only Bellman-Ford in integer millimeters. The original BFS witness file remains unchanged and must not be used as shortest-distance expectations.

Run `pnpm routes:benchmark` for 30 measured samples after five warmups. It reports router initialization, geographic validation plus initialization, baseline, closure rerouting, 100 alternating requests per sample and snapping. See [VERIFICATION](VERIFICATION.md) for the actual machine, timing boundaries and observed results. Node timings do not establish browser rendering/flood-to-map latency.

## MAP-02 / SIM-01 integration

MAP-02 should validate/load the local graph once, retain the router per dataset version, expose snap distance/status, and put found non-null geometry into route GeoJSON sources. Render separate baseline/current layers and clear the current line on failure. Keep a marker for a zero-distance result. Report graph errors separately from missing map tiles.

SIM-01 should pass the computed physical segment and node sets into a new route request, keeping baseline data and geometry intact. Do not rebuild the router on every closure change. Preset node IDs remain usable without snapping. No map, flood polygon, shelter approval or real-world safety verification is implemented by this routing task.
