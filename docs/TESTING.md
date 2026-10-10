# Testing strategy

## Current foundation versus product acceptance

Phase 0 runs one Vitest smoke test asserting that the static page explicitly identifies unimplemented features and the safety limitation. Playwright checks the production page at desktop and 360 px viewport widths, visible status/disclaimer, no horizontal overflow and no uncaught page errors. The browser smoke does not prove routing, flood behavior or full accessibility. MAP-01 now tests geographic validity offline; ROUTE-01 implements the routing/snapping/heap suites below. Flood, integration and browser journey suites remain future work.

## Commands and environment

Use `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e` and `pnpm format:check`. `typecheck` first runs `next typegen` so it works before a build. Unit discovery is limited to `tests/unit/**/*.test.ts`; Playwright lives in `tests/e2e/`. `test:e2e` builds once and launches a production server at 127.0.0.1:3100; CI builds earlier and then runs `pnpm exec playwright test` to avoid a second build. A busy port must fail rather than testing someone else's server.

Install Chromium with `pnpm exec playwright install chromium`. CI Ubuntu uses `--with-deps`. Fedora is outside Playwright's standard Linux support matrix; if a missing shared-library error occurs, record it and install the matching native library through the user's normal system workflow. Do not claim browser verification if launch failed. No system package installation is required by the repository itself.

## Deterministic graph fixture specification

Implemented `tests/fixtures/graph.ts` in ROUTE-01/QA-01 using the contracts from ARCHITECTURE. This is a **synthetic mathematical fixture**, not OSM or evidence about actual Ernakulam roads. Coordinates below are synthetic near the test region; weights are chosen test inputs, not measured geographic distances. Use graph version `synthetic-routing-v1`, stable IDs and `osmWayId: 'synthetic'` in this test only. Give every edge its own segment ID, geometry in traversal order and sorted adjacency. Production data must have geodesically measured weights.

| Node | Synthetic `[longitude, latitude]` |
| ---- | --------------------------------- |
| A    | `[76.290, 9.980]`                 |
| B    | `[76.291, 9.980]`                 |
| C    | `[76.291, 9.981]`                 |
| D    | `[76.292, 9.980]`                 |
| E    | `[76.294, 9.983]` (isolated)      |

| Directed edge ID | From → To | Weight |
| ---------------- | --------- | ------ |
| ab               | A → B     | 100 m  |
| bd               | B → D     | 100 m  |
| ac               | A → C     | 150 m  |
| cd               | C → D     | 150 m  |

Expected A→D results: clear = `[ab, bd]`, node IDs `[A,B,D]`, 200 m; blocked `bd` = `[ac,cd]`, `[A,C,D]`, 300 m; blocked `bd` and `cd` = unreachable. A→E and D→A are unreachable (directed graph). A→A is found with 0 m, no edges and null line geometry unless A is flooded, when it is origin-blocked. Input arrays/records must remain unchanged.

Critical acceptance behavior, implemented in `tests/unit/routing.test.ts`:

```ts
const original = shortestPath(graph, request('A', 'D', []));
const rerouted = shortestPath(graph, request('A', 'D', ['bd']));
expect(original).toMatchObject({
  status: 'found',
  edgeIds: ['ab', 'bd'],
  distanceMeters: 200,
});
expect(rerouted).toMatchObject({
  status: 'found',
  edgeIds: ['ac', 'cd'],
  distanceMeters: 300,
});
```

`request` above illustrates the request shape; actual tests use createRouter with optional closure sets and the default walking profile. Also assert edge continuity, graph membership, no blocked edge/node, geometry endpoints and sum of all chosen weights. These assertions guard against merely drawing a different line.

## Unit test matrix

| Area          | Required cases                                                                                                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shortest path | Known fixture, positive weighted detour, direction, cycles, isolated node, same endpoint                                                                                                                                                             |
| Ties          | Set all four fixture weights to 100; stable ID ordering consistently chooses A–B–D                                                                                                                                                                   |
| Validation    | Missing/duplicate node or edge ID, dangling endpoints, NaN/infinite/negative/zero weights, swapped/out-of-range/nonfinite coordinates, adjacency disagreement, empty dataset, scenario/graph version mismatch, invalid step and missing shelter node |
| Request       | Unknown origin/destination/blocked IDs, unsupported profile, flooded endpoint                                                                                                                                                                        |
| Edge blocking | One edge excluded, both directional copies of a physical segment excluded, all alternatives blocked, immutable baseline graph                                                                                                                        |
| Geometry      | Crossing with both endpoints outside; fully contained line; boundary tangent/touch; disjoint line; polygon hole; invalid/self-intersecting/unclosed ring                                                                                             |
| Replay/reset  | Same graph/scenario/step gives identical blocked sets and route IDs; step 0 after step 1 restores original result                                                                                                                                    |
| Snapping      | At/below/above 100 m radius, stable nearest-node ties, no eligible node, no physical connector claim                                                                                                                                                 |

For geometric regression, use synthetic coordinates independent of geographic routing weights: polygon outer ring `[[0,0],[2,0],[2,2],[0,2],[0,0]]`; crossing line `[[-1,1],[3,1]]`; contained line `[[0.5,0.5],[1.5,0.5]]`; boundary line `[[-1,0],[3,0]]`; disjoint line `[[-1,3],[3,3]]`. First three block, last does not. Add a separate valid hole fixture and points in/on/outside the boundary. Production polygon validation additionally checks the chosen Ernakulam extent.

## Integration and real geography

INT-01 verifies select→baseline→step 1→updated route→reset, selection change while flood active, failed dataset load and unreachable state. No stale green line remains after failure. Changing origin/destination updates the baseline as well as current route. An origin or shelter in the polygon returns endpoint-blocked.

MAP-01 tests deterministic conversion against a small OSM-format fixture covering shared junction, nonconnected geometric crossing, foot/access restrictions, pedestrian direction, barriers and missing references. Inspect the frozen real graph and prove the selected scenario intersects a baseline edge but leaves a real alternate path. This evidence must come from graph edge IDs and geometry, not screenshots alone.

## Browser journey and accessibility

Use local graph/scenario assets and a tile-free MapLibre style. QA-02 drives labeled keyboard controls to select origin/destination, checks baseline distance/status, triggers flood, checks red blocked segments and a changed available path, then resets. Expose minimal accessible result metadata/labels needed to verify selected edge IDs without exporting a test-only routing implementation. Add unreachable and invalid-data cases. Abort external network requests in these tests; app rendering must remain usable. Test desktop and narrow/mobile viewport.

Manually check logical tab order, visible focus, native select behavior, result live region, non-color cues, contrast, 200% zoom, attribution visibility and reduced motion. Automated tools may be added when they provide useful coverage, but do not claim WCAG conformance from a smoke test. Current Phase 0 smoke page has no interactive dashboard controls to assess.

## Performance and release checks

Measure 30 route/flood updates after warmup on a recorded laptop/browser/dataset; report median and p95. Target route <100 ms and total update <300 ms p95, local initial map <3 s excluding online tiles. Include graph size and asset bytes. The requested indexed heap is implemented; measure before adding a worker or spatial index. Two three-minute rehearsals include blocked-network tiles and reset. Test a missing local dataset separately; a tile outage must not be confused with a road data outage.

CI runs format, lint, types, unit tests, production build and Chromium browser tests with frozen dependencies and no secrets. Failure artifacts retain Playwright traces. Hosted Actions success is not assumed from local checks. Final evidence and unresolved coverage go in [VERIFICATION](VERIFICATION.md).

## ROUTE-01 implemented coverage

`routing.test.ts`, `min-heap.test.ts`, `snapping.test.ts` and `real-routing.test.ts` cover weighted/directed shortest paths, decrease-key/tie ordering, identical/invalid/blocked endpoints, isolated components, all closure types together, physical versus directed blocking, immutable inputs/results, shape-point reconstruction, malformed requests/profiles and repeated reset/recalculation. Snapping tests geographic meters, longitude wrap/high latitude, inclusive radius, malformed coordinates/options, origin versus destination eligibility and largest-component restriction.

The real Hospital Road pair has a 944.333 m shortest path and a 980.790 m path after physical segment 768625211:4 is blocked. A separate test-only Bellman-Ford relaxation in integer millimeters verifies these distances and representative additional requests/closures independently of the heap. MAP-01 BFS witnesses remain unchanged; they prove connectivity, not optimal distance. Future SIM-01 must still prove polygon-to-segment blocking, and MAP-02 must prove rendered geometry.

`pnpm routes:benchmark` measures 30 samples after 5 warmups on the real graph: private router initialization; full validation + initialization; baseline; rerouting; 100 alternating requests per batch; and snapping. Timings exclude disk reads, JSON parse, network and rendering. Results and machine details are recorded in VERIFICATION, not asserted as brittle timing tests.
