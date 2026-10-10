# Contributor task catalog

All tasks below are **unassigned and not implemented**, except the Phase 0 foundation described in README. These are local definitions; no GitHub issues, labels or assignments have been created. Estimates are hands-on contributor time, not sequential wall-clock totals. Work follows [ROADMAP](ROADMAP.md); parallel ownership is described there. Small beginner tasks fit inside phase budgets, not in addition to eight hours. Read the relevant ADR and coordinate shared files before starting.

## UI and design

### UI-01 — Map-first controls and responsive panels

- **Description:** Build labeled origin/destination, route information and trigger/reset panels with loading/invalid/unreachable states. Use native controls or add only the shadcn component actually needed.
- **Priority:** P0
- **Dependencies:** MAP-01 contracts; UI shell can start before data delivery
- **Estimated effort:** 45 min
- **Relevant modules:** src/components/RoutePanel.tsx; SimulationPanel.tsx; src/app/page.tsx
- **Acceptance criteria:** Keyboard selection and trigger/reset work; controls fit 360 px; simulation disclaimer always visible; buttons reflect valid state.
- **Suggested GitHub labels:** `ui, accessibility, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### UI-02 — Accessible legend and status copy

- **Description:** Implement labeled blue baseline, green updated, red blocked and amber hazard legend with patterns and explicit simulated status.
- **Priority:** P0
- **Dependencies:** UI-01, MAP-02
- **Estimated effort:** 20 min
- **Relevant modules:** src/components/RoutePanel.tsx; MapView.tsx
- **Acceptance criteria:** Colors have text/pattern equivalents; historical path is never labeled safe; attribution is unobscured at mobile and 200% zoom.
- **Suggested GitHub labels:** `ui, good first issue, P0` (suggestions only)
- **First-time contributor suitability:** Yes; bounded and reviewable with maintainer guidance.

### UI-03 — Reduced-motion behavior

- **Description:** If animations are introduced, disable movement under prefers-reduced-motion while preserving immediate state updates.
- **Priority:** P1
- **Dependencies:** INT-01; animation work exists
- **Estimated effort:** 15 min
- **Relevant modules:** src/app/globals.css; src/components/MapView.tsx
- **Acceptance criteria:** Reduced-motion emulation shows the same result with no camera/flood animation; normal mode remains usable.
- **Suggested GitHub labels:** `ui, accessibility, good first issue, P1` (suggestions only)
- **First-time contributor suitability:** Yes; bounded and reviewable with maintainer guidance.

## Maps and geographic data

### MAP-01 — Freeze and validate Ernakulam road data

- **Description:** Create shared contracts, query/source manifest and deterministic converter using DATA_STRATEGY. Review connectivity and select real baseline/alternative paths.
- **Priority:** P0
- **Dependencies:** Phase 0 docs/tooling
- **Estimated effort:** 75 min
- **Relevant modules:** src/lib/geo/types.ts; validate.ts; scripts/prepare-roads.ts; data/source/; public/data/ernakulam/
- **Acceptance criteria:** Same source converts identically twice; valid node references/weights/access/directions; source/date/hash/license recorded; <=5,000 nodes, <=12,000 directed edges and <=3 MB runtime assets or documented reduced extent; no invented connectivity.
- **Suggested GitHub labels:** `maps, data, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### MAP-02 — Render local roads with MapLibre

- **Description:** Add MapLibre only now, client-only map setup, local road layers, cleanup, source attribution and optional basemap after terms review.
- **Priority:** P0
- **Dependencies:** MAP-01 (contract first, assets before acceptance)
- **Estimated effort:** 45 min
- **Relevant modules:** src/components/MapView.tsx; public/data/ernakulam/
- **Acceptance criteria:** Real local road geometry displays; map pans/zooms; tile-free style works without network; unmount cleans up; load/WebGL errors are explicit.
- **Suggested GitHub labels:** `maps, ui, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### MAP-03 — Dataset provenance review

- **Description:** Verify manifest fields, source links, license notices and UI dataset date against the actual frozen extract.
- **Priority:** P0
- **Dependencies:** MAP-01, MAP-02
- **Estimated effort:** 20 min
- **Relevant modules:** data/source/manifest.json; docs/DATA_STRATEGY.md; MapView.tsx
- **Acceptance criteria:** Hash matches raw source; bounds/query/date are actual; attribution visible; no source or currency claim exceeds evidence.
- **Suggested GitHub labels:** `documentation, maps, good first issue, P0` (suggestions only)
- **First-time contributor suitability:** Yes; bounded and reviewable with maintainer guidance.

## Routing algorithms

### ROUTE-01 — Implement deterministic Dijkstra

- **Description:** Start with TESTING synthetic fixture; implement the shortestPath signature in ARCHITECTURE, validate request, track predecessors and sum positive weights.
- **Priority:** P0
- **Dependencies:** MAP-01 shared types; real assets needed for final integration
- **Estimated effort:** 60 min
- **Relevant modules:** src/lib/routing/shortest-path.ts; tests/unit/routing.test.ts
- **Acceptance criteria:** Baseline 200 m, blocked B-D detour 300 m, blocked arrivals unreachable; invalid IDs, directed edges, ties and origin=destination covered; result excludes blocked edges/nodes.
- **Suggested GitHub labels:** `routing, tests, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### ROUTE-02 — Origin snapping and route geometry

- **Description:** Map click selects a node within 100 m; show snap distance and support equivalent keyboard presets. Render only graph-edge geometry.
- **Priority:** P0
- **Dependencies:** MAP-01, MAP-02, ROUTE-01
- **Estimated effort:** 30 min
- **Relevant modules:** src/lib/geo/selection.ts; src/components/MapView.tsx; tests/unit/selection.test.ts
- **Acceptance criteria:** Outside radius fails visibly; deterministic nearest-node ties; presets work without clicking; no invented connector or straight-line fallback.
- **Suggested GitHub labels:** `routing, maps, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

## Disaster simulation

### SIM-01 — Fixed flood and intersection blockages

- **Description:** Add minimal Turf modules, validate one synthetic polygon, derive blocked physical segments and flooded nodes using whole-geometry intersection.
- **Priority:** P0
- **Dependencies:** MAP-01 contracts; real assets before scenario acceptance
- **Estimated effort:** 45 min
- **Relevant modules:** src/lib/simulation/flood.ts; public/data/ernakulam/scenario.json; tests/unit/flood.test.ts
- **Acceptance criteria:** Crossing/contained/touching lines block in both directions; disjoint/hole cases correct; invalid rings rejected; graph remains unchanged; one real baseline edge blocked with detour available.
- **Suggested GitHub labels:** `simulation, geometry, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### INT-01 — Automatic reroute and reset integration

- **Description:** Use reducer selections/step and derived baseline/current routes. Trigger, reset and selection changes update the correct results atomically.
- **Priority:** P0
- **Dependencies:** ROUTE-01, ROUTE-02, SIM-01, UI-01, MAP-02, SHELTER-01
- **Estimated effort:** 60 min
- **Relevant modules:** src/lib/simulation/state.ts; src/app/page.tsx; tests/unit/simulation.test.ts
- **Acceptance criteria:** Trigger changes actual path without blocked edges; baseline retained as historical; reset restores identical baseline; active-flood selection change recalculates both; unreachable/endpoint-blocked visible.
- **Suggested GitHub labels:** `integration, simulation, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

## Accessibility and shelters

### SHELTER-01 — Create honest demo destinations

- **Description:** Place at least two synthetic destinations directly on reviewed graph nodes; expose labeled selection and unknown availability.
- **Priority:** P0
- **Dependencies:** MAP-01
- **Estimated effort:** 20 min
- **Relevant modules:** public/data/ernakulam/shelters.json; src/components/RoutePanel.tsx
- **Acceptance criteria:** No real facility is claimed as an approved shelter; all nodes valid; synthetic/unknown metadata visible; flooded endpoints unavailable.
- **Suggested GitHub labels:** `data, accessibility, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### A11Y-01 — Keyboard and mobile review

- **Description:** Follow the journey with keyboard and 200% zoom; inspect focus order, status announcements, labels, attribution and touch sizes; fix localized defects.
- **Priority:** P0
- **Dependencies:** INT-01, UI-02
- **Estimated effort:** 25 min
- **Relevant modules:** src/components/; tests/e2e/journey.spec.ts; docs/TESTING.md
- **Acceptance criteria:** All controls operable without map click; no focus trap; result live region announces once; no horizontal overflow at 360 px; record manual results.
- **Suggested GitHub labels:** `accessibility, good first issue, P0` (suggestions only)
- **First-time contributor suitability:** Yes; bounded and reviewable with maintainer guidance.

### SHELTER-02 — Research accessible shelter evidence

- **Description:** Document authoritative source and missing wheelchair/access/capacity fields before proposing real or accessible routing.
- **Priority:** P1
- **Dependencies:** SHELTER-01
- **Estimated effort:** 30 min
- **Relevant modules:** docs/DATA_STRATEGY.md
- **Acceptance criteria:** Each claim has a source/date; unknown stays unknown; no feature calls a destination accessible without evidence.
- **Suggested GitHub labels:** `research, documentation, P1` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

## Testing

### QA-01 — Fixture and routing edge cases

- **Description:** Turn TESTING specification into a typed synthetic fixture and regression tests alongside ROUTE-01; do not implement a second production router.
- **Priority:** P0
- **Dependencies:** MAP-01 contracts; coordinate with ROUTE-01 owner
- **Estimated effort:** 25 min
- **Relevant modules:** tests/fixtures/graph.ts; tests/unit/routing.test.ts
- **Acceptance criteria:** Known edge IDs/weights and expected paths match spec; direction, ties, invalid weights and disconnected cases fail meaningfully if broken.
- **Suggested GitHub labels:** `tests, routing, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### QA-02 — Local end-to-end journey and timing

- **Description:** Use the reviewed real dataset and tile-free map; drive select→baseline→flood→reroute→reset, plus unreachable and bad-data states; record performance on demo laptop.
- **Priority:** P0
- **Dependencies:** INT-01
- **Estimated effort:** 45 min
- **Relevant modules:** tests/e2e/journey.spec.ts; docs/VERIFICATION.md
- **Acceptance criteria:** Browser validates changed route and no blocked result edges; network-independent graph; p95 from 30 runs recorded against PRD targets; no synthetic-polyline substitution.
- **Suggested GitHub labels:** `tests, e2e, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

## Documentation and DevOps

### DOC-01 — Reproduce onboarding from a fresh clone

- **Description:** Follow README with clean dependencies; report missing steps and correct documentation without adding unneeded tooling.
- **Priority:** P0
- **Dependencies:** Phase 0 foundation
- **Estimated effort:** 20 min
- **Relevant modules:** README.md; docs/CONTRIBUTOR_GUIDE.md; docs/VERIFICATION.md
- **Acceptance criteria:** Actual install/dev/test commands and versions documented; smoke page is identified accurately; no secret needed.
- **Suggested GitHub labels:** `documentation, good first issue, P0` (suggestions only)
- **First-time contributor suitability:** Yes; bounded and reviewable with maintainer guidance.

### DOC-02 — Update three-minute presenter notes

- **Description:** Rehearse the exact built behavior, name the dataset/scenario used and remove claims for incomplete features.
- **Priority:** P0
- **Dependencies:** INT-01
- **Estimated effort:** 20 min
- **Relevant modules:** docs/DEMO_PLAN.md; SUBMISSION.md
- **Acceptance criteria:** Three minutes or less; fallback accurate; synthetic labels and algorithm explanation included; participant/deployment unknowns not invented.
- **Suggested GitHub labels:** `documentation, good first issue, P0` (suggestions only)
- **First-time contributor suitability:** Yes; bounded and reviewable with maintainer guidance.

### OPS-01 — Verify CI and production setup

- **Description:** Run local checks; once a push is authorized, inspect hosted Actions and deployment configuration without changing organizer workflows.
- **Priority:** P0
- **Dependencies:** Phase 0; remote steps require authorization
- **Estimated effort:** 20 min
- **Relevant modules:** .github/workflows/ci.yml; docs/VERIFICATION.md
- **Acceptance criteria:** Local and hosted results distinguished; frozen lockfile; no mandatory API key; no organizer workflow removed; no unsolicited remote changes.
- **Suggested GitHub labels:** `devops, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.

### OPS-02 — Rehearsal and submission preparation

- **Description:** Run two demos including tile failure; align final build, logs and submission details. Deployment and pushing are separate authorized actions.
- **Priority:** P0
- **Dependencies:** QA-02, A11Y-01, DOC-02
- **Estimated effort:** 30 min
- **Relevant modules:** docs/DEMO_PLAN.md; SUBMISSION.md; CHANGELOG.md; AI_USAGE.md
- **Acceptance criteria:** Actual build/demo correspond to recorded implementation SHA; team confirms identities and checklist; no false submission/deployment claim.
- **Suggested GitHub labels:** `devops, documentation, P0` (suggestions only)
- **First-time contributor suitability:** Not a first task; requires domain/integration context.
