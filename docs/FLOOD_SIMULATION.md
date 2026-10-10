# Deterministic flood simulation

SIM-01 and INT-01 use the existing Ernakulam graph and Dijkstra router. No disaster feed, hydrological model, depth, road safety score or verified emergency destination is provided. Flood polygons are illustrative. Routes are not certified safe for emergency use.

## Public interfaces and data flow

```ts
import { createFloodEngine } from '../src/lib/simulation/flood';
import { scenarios } from '../src/lib/simulation/scenarios';
import { reroute, compareRoutes } from '../src/lib/simulation/session';

// Reuse MAP-02's already validated graph and retained router.
const engine = createFloodEngine(graph);
const baseline = router.findRoute({ originNodeId, destinationNodeId });
const flood = engine.evaluate(scenarios[0].steps[1]);
const current = reroute(router, baseline, flood);
const comparison = compareRoutes(baseline, current);
```

`evaluate(unknown)` returns `FloodResult`: a `ready` snapshot with blocked segment, directed-edge and node sets, hazard and blocked-road GeoJSON, and deterministic metadata; or `invalid` with a useful reason. Invalid geometry never produces a successful route. Empty zones mean no closures. `DisasterZone.geometry` accepts Polygon or MultiPolygon; each zone must have a unique ID, `kind: 'flood'` and `simulated: true`.

Initialization copies one geometry per physical segment and indexes its bounds and associated directed IDs once. Bounding boxes only reject disjoint candidates. [Turf booleanIntersects](https://turfjs.org/docs/api/booleanIntersects) checks complete geographic LineStrings, including partial intersections, boundary contact and containment. Flooded nodes use boundary-inclusive point-in-polygon. Blocking a physical segment excludes every associated direction using the existing routing API. Graph, dataset and baseline stay unchanged.

Validation rebuilds WGS84 coordinate arrays, requires closed nondegenerate rings, and combines [Turf booleanValid](https://turfjs.org/docs/api/booleanValid), kinks detection and explicit hole containment/overlap checks. Holes exclude their interiors; touching a hole boundary still blocks. Conservative validation rejects touching/overlapping MultiPolygon components and touching/nested holes; use separate zones for overlapping extents. This is a bounded regional 2D model; antimeridian/global polygons and elevation-aware flood behavior are unsupported.

## Scenarios and actual outcomes

Version: `ernakulam-walking-v1-c5690329d952ed13`. Preset origin `271145615` = `[76.28014, 9.9713489]`; destination `1906667447` = `[76.2860629, 9.9684255]`. Baseline: **944.333 m**, 21 segments.

| Scenario / stage | Bounds (west, south, east, north)   | Blocked segments / directed edges / nodes | Current route                    |
| ---------------- | ----------------------------------- | ----------------------------------------- | -------------------------------- |
| Hospital / 1     | 76.280142, 9.9712, 76.2809, 9.97165 | 5 / 10 / 3                                | 1,411.110 m                      |
| Expanding / 1    | Same as Hospital                    | 5 / 10 / 3                                | 1,411.110 m                      |
| Expanding / 2    | 76.280142, 9.9708, 76.282, 9.972    | 9 / 18 / 5                                | 1,411.110 m                      |
| Expanding / 3    | 76.280142, 9.9702, 76.2835, 9.9725  | 27 / 54 / 18                              | 1,731.155 m                      |
| Unavailable / 1  | 76.2852, 9.9677, 76.2869, 9.9691    | 21 / 42 / 14                              | Destination blocked; no distance |

Stage 0 is clear for every scenario. Stage 2 blocks more roads without changing the best detour; a larger hazard does not necessarily increase distance at every step. The Hospital detour adds 466.777 m (49.4%); expanding stage 3 adds 786.822 m (83.3%). The unavailable scenario also returns `no-route` if only its segment closures are supplied, independently confirming disconnected access.

The fixture's intended segment `768625211:4` is only 0.548 m long. The west boundary is deliberately between its endpoints to intersect it without flooding the origin. This submeter boundary is a deterministic test construction, **not a claim of flood-position accuracy**. All roads remain real OSM geometry; only flood extents are generated illustrations. The previous 980.790 m routing-only result blocks one segment; the polygon blocks five, so its measured route differs.

## UI integration and state

`Dashboard` retains the existing selection reducer and adds the small `simulationReducer` for scenario ID, stage and whether a simulation has been started. Baseline and current routes are memoized derived values; stage changes retain the baseline, endpoint changes recompute both, and reset clears closures while preserving endpoints and their baseline. Full Reset clears both reducers. Selecting a different scenario during an active run starts its first stage. No timers, random expansion, asynchronous routing responses or duplicate routing algorithm are used.

Intersection memoization depends only on the engine, scenario and stage. Endpoint changes do not repeat intersection. The graph is validated by the existing loader, not by render or routing calls. Synchronous intersection and rerouting are bounded to 1,856 physical segments; measured results are in VERIFICATION. Move to a worker if expanded datasets cause measured UI delays.

MapLibre sources update in place: cyan/amber hazard, red dashed actual blocked roads, blue dashed historical route, green available route with white casing. Camera fits both route geometries. Unavailable results clear green geometry immediately; historical blue remains labeled. The same controls occupy a separate desktop panel at 1200 px and above and the existing scrollable mobile/narrow-screen sheet below that width. Reduced-motion preferences govern camera transitions.

## Verification and future integration

`pnpm test` covers geometry, malformed inputs, holes/MultiPolygon, deduplication, both directions, deterministic nested stages, baseline immutability, endpoint changes, reset, typed failures and real scenario distances. `pnpm test:e2e` renders real MapLibre and routes with local OSM data on desktop/mobile, with public tile traffic blocked. `node --experimental-strip-types scripts/benchmark-simulation.ts` measures initialization, intersection and rerouting (5 warmups, 30 samples).

Future live feeds require independent provenance, timestamps, uncertainty, freshness, access review and operational validation. They must not silently replace these explicitly simulated fixtures or convert “available in this model” into a certified-safe claim. No live-data integration is implemented.
