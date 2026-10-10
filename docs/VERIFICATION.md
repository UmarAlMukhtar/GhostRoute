# Verification record

## MAP-02 — Interactive Ernakulam route explorer

Verified 2026-10-10T23:13:00+05:30, starting from clean `ae2d726` on `codex-foundation`. The real graph, geographic/routing modules, organizer instructions, submission file and workflows are unchanged. No push, deployment, remote issue or settings change.

| Check                                             | Actual result                                                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                       | PASS, no errors or warnings. Generated licensed worker assets are excluded.                                                 |
| `pnpm typecheck`                                  | PASS, Next type generation and strict TypeScript.                                                                           |
| `pnpm test`                                       | PASS, **106 tests across 9 files**, including existing routing/closure regressions and actual graph-to-UI data integration. |
| `pnpm build`                                      | PASS, optimized production static page. Also executed by `pnpm test:e2e`.                                                   |
| `pnpm test:e2e`                                   | PASS, **16 tests**: 8 journeys each in desktop and touch-capable mobile Chromium.                                           |
| `pnpm format`                                     | PASS, maintained files formatted; organizer RULES and generated assets excluded.                                            |
| `pnpm data:prepare` + asset diff                  | PASS, source and generated runtime assets byte-for-byte unchanged. 1,719 nodes, 3,712 directed edges, 1,856 segments.       |
| Template/source preservation + `git diff --check` | PASS. README event section preserved; changes to inherited ignore/log files are additive.                                   |

The commands used the already available pnpm 11.25.0 via a process-local PATH to the bundled runtime; no shell configuration was changed. Installation used the existing pnpm store. Build/browser commands needed the host permission for local worker/server ports already recorded in earlier milestones.

### Browser and visual evidence

Actual production Chromium rendering was inspected at **1440 × 900** and **360 × 800**, with mobile sheet expanded/collapsed. Tests also resize through desktop/mobile/**640 × 450** and verify endpoints remain in view and the page has no horizontal overflow. A development-server check under React Strict Mode recorded **one map canvas, three local asset requests, zero uncaught page errors**, and the real 944.3 m result. Short viewport content reflows into a vertically scrollable page; panels scroll at constrained heights.

The Hospital Road preset uses the retained real Dijkstra router: **944.333 m**, displayed **944.3 m**, **21 traversed segments**. Tests exercise named and map-click selections, show snap offsets, reject clicks farther than 100 m, handle a real disconnected node, zero-distance endpoints and subsequent recalculation, reset old geometry, retry corrupt asset loads, and retain routing when WebGL is unavailable.

Screenshots (local ignored test outputs; regenerate with the browser suite):

- `test-results/foundation-real-map-Hospit-a5c17-set-and-responsive-controls-chromium/route.png`
- `test-results/foundation-real-map-Hospit-a5c17-set-and-responsive-controls-mobile-chromium/route.png`
- `test-results/foundation-real-map-Hospit-a5c17-set-and-responsive-controls-mobile-chromium/route-collapsed.png`

Visual inspection caught a legend covering a desktop endpoint and missing mobile road rendering with large asymmetric camera padding. Increased desktop clearance and a mobile map viewport sized above the expanded sheet resolved these; later screenshots show both real roads and routes. The initial production worker failed because MapLibre 6's package-relative module URL does not survive bundling. Serving the exact installed worker/shared module locally resolved the failure. Test iteration also corrected strict TypeScript annotations, alert locators, and a test attempting to click the disabled minimum-zoom button.

### Limits and next work

All automated/visual browser checks block public OSM tile requests, in accordance with the provider's no automated tile-fetching policy. Local-road fallback was actually rendered; live provider availability/appearance is not certified. WebGL, a served app and local assets are still needed; no service worker/offline installation, physical-device testing, screen-reader audit, WCAG certification or real-world route safety validation is claimed. Default node snapping is an approximation, and the 12-component frozen graph is not complete urban coverage. No road names are drawn in the local fallback.

Next: **SIM-01 — Flood Simulation and Road Intersection Engine**, deriving physical-segment/node closures from deterministic polygons, then **INT-01 — Automatic Disaster-Aware Rerouting**. Existing empty map sources provide the visual integration boundary; no flood behavior is implemented here.

### MAP-02 file inventory

Created: `scripts/prepare-maplibre.mjs`, `src/components/Dashboard.tsx`, `src/components/MapView.tsx`, `src/lib/map/data.ts`, `src/lib/map/selection.ts`, `src/lib/map/style.ts`, `tests/unit/map.test.ts`.

Modified: `.env.example`, `.gitignore`, `.prettierignore`, `AI_USAGE.md`, `CHANGELOG.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SPEC.md`, `docs/TASKS.md`, `docs/TESTING.md`, `docs/VERIFICATION.md`, `docs/adr/002-maplibre-osm.md`, `docs/adr/README.md`, `eslint.config.mjs`, `package.json`, `playwright.config.ts`, `pnpm-lock.yaml`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `tests/e2e/foundation.spec.ts`, `tests/unit/foundation.test.ts`.

## ROUTE-01 — Dijkstra routing engine

Verified 2026-10-10T22:49:08+05:30, starting from clean `5362005` on `codex-foundation`. No push, remote issue/settings changes or new dependencies. Existing organizer instructions, workflows and MAP-01 source/runtime assets remain unchanged. Foundation page text now accurately says the engine exists; map rendering and flood simulation remain unimplemented.

### Executed results

| Check                                                                             | Result                                                                                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                                                       | PASS; no errors/warnings.                                                                                                             |
| `pnpm typecheck`                                                                  | PASS; Next type generation and strict TypeScript.                                                                                     |
| `pnpm test`                                                                       | PASS; **94 tests in 8 files**, including all 47 preexisting tests.                                                                    |
| `pnpm build`                                                                      | PASS; Next production build/static pages. Ran with the local-port permission already identified as necessary for Turbopack in MAP-01. |
| `pnpm format`                                                                     | PASS; all maintained files formatted, inherited RULES excluded.                                                                       |
| `pnpm format:check`                                                               | PASS.                                                                                                                                 |
| `pnpm data:prepare` + `git diff --exit-code -- data/source public/data/ernakulam` | PASS; regenerated data byte-for-byte unchanged from MAP-01.                                                                           |
| `pnpm exec playwright test`                                                       | PASS; 2 existing Chromium desktop/mobile tests against the production build, after status-copy correction.                            |
| `pnpm routes:benchmark`                                                           | PASS; checked fixture distances before measuring the operations below.                                                                |
| `git diff --check`, local links and template preservation                         | PASS; no organizer instruction/workflow changes or lost event content.                                                                |

The newly installed shell pnpm launcher previously timed out. This task used the already-verified bundled pnpm 11.25.0 launcher via a process-local PATH, without changing shell configuration, repository package-manager selection or lockfile. No claim is made that the user's new standalone launcher is repaired.

Initial new suites failed before the engine modules existed. Test-first regressions exposed null profiles being treated as defaults and sparse coordinate arrays being misclassified as no eligible node; both now return typed invalid results. Strict type checking caught heap index narrowing and misplaced negative-test annotations after formatting; these were corrected. The final production code passed all checks above. Playwright emitted only existing NO_COLOR/FORCE_COLOR environment warnings.

### Real shortest-path evidence

Validated graph version: `ernakulam-walking-v1-c5690329d952ed13`; 1,719 nodes / 3,712 directed edges. Origin `271145615` (Park Avenue / Hospital Road), destination `1906667447` (Jos Junction). Baseline: **944.333 m**, 21 edges. Block both directions of physical segment `768625211:4`: **980.790 m**, 34 edges, **+36.457 m**. Clear route contains the segment; blocked route excludes it, including in reverse-direction routing.

The test-only Bellman-Ford reference independently computes distances using integer millimeter weights; it agrees with heap-based Dijkstra for these and additional directed/closure/disconnected requests. Tests check continuity, summed weights, ordered node/segment IDs and full geometry. MAP-01's 1,003.818 / 1,470.595 m BFS witnesses remain unchanged and are not shortest-distance expectations.

### Measured performance

Measured `2026-10-10T17:17:51.608Z` on AMD Ryzen 7 8845HS w/ Radeon 780M Graphics; Fedora/Linux `7.2.8-200.fc44.x86_64`, `x64`, Node `v22.23.1`. **30 measured samples per operation after 5 warmups**; median and nearest-rank p95. Inputs are already parsed in memory; file read, JSON parse, network, UI rendering and flood intersection are excluded. Router initialization includes a private graph copy and adjacency/component indexes. Each routing measurement includes closure validation, shortest-path search and geometry reconstruction. The batch row is total time for **100 alternating clear/closed requests**, not one request.

| Operation                                    | Median    | p95       |
| -------------------------------------------- | --------- | --------- |
| Router initialization                        | 19.162 ms | 26.022 ms |
| Geographic validation + initialization       | 30.895 ms | 40.971 ms |
| Baseline route                               | 0.280 ms  | 0.448 ms  |
| Hospital Road reroute                        | 0.121 ms  | 0.154 ms  |
| 100 alternating route requests (whole batch) | 15.730 ms | 18.513 ms |
| Largest-component snap                       | 0.225 ms  | 0.393 ms  |

Node route p95 is below the PRD's 100 ms routing target on this machine. This is not proof of browser, mobile-device or complete flood-to-map latency. Rerun `pnpm routes:benchmark` to obtain current measurements; do not turn wall-clock values into brittle CI assertions.

### Changed files and integration boundary

New: `src/lib/routing/shortest-path.ts`, `min-heap.ts`; `scripts/benchmark-routing.ts`; `tests/fixtures/graph.ts`; routing, snapping, min-heap and real-routing test files; `docs/ROUTING_ENGINE.md`; ADR-008. Modified: shared geographic request/result contracts, package benchmark script, foundation status copy, README, architecture/data/testing/task docs, ADR-003/index, verification and event/AI logs. The graph model, dependencies, data pipeline and dataset are unchanged.

MAP-02 should load/validate once and retain `createRouter(graph)` per dataset version, use `router.snap` for role-aware selections, and render only found route geometries. SIM-01 later passes blocked nodes/segments/edges to new requests without rebuilding the router. Snapping remains a nearest-node approximation; original weak-component membership does not guarantee directed reachability after closures. No wheelchair profile, verified road safety, shelter availability, flood UI, map UI, hosted CI or deployment is claimed. Human implementation/geographic review remains pending.

---

## MAP-01 — Ernakulam geographic data foundation

Verified 2026-10-10T22:30:30+05:30, locally on `codex-foundation`, starting from clean `773c266`. No push, remote issue or settings change. MAP-02, ROUTE-01 and SIM-01 remain unimplemented.

### Dataset evidence

- Request bounds: [76.274, 9.966, 76.292, 9.984]; actual whole-way graph bounds: [76.2732579, 9.9638296, 76.2936855, 9.9897189]. Bounds selected after inspecting named roads in a broader real OSM extract.
- Frozen normalized source: 493 ways, 1,886 referenced nodes, 52,266 compressed bytes. The unfiltered response remains outside Git; response and decompressed-source hashes are recorded.
- Validated graph: **1,719 nodes, 3,712 directed edges, 1,856 physical segments**. Twelve components: 1,501 / 117 / 34 / 30 / 12 / 8 / 4 / 4 / 3 / 2 / 2 / 2 nodes. All retained segments have both directions; these components are strongly connected as well as weakly connected.
- Graph + GeoJSON: **1,875,234 bytes**. Runtime directory including metadata, fixture and attribution: **1,886,356 bytes**. Below the 3 MB budget; no duplicate physical-segment endpoint candidates.
- Exclusions: 51 restricted general-access ways/segments, 19 barrier-incident segments, 1 ambiguous pedestrian oneway way; individual identifiers/reasons in metadata.
- Fixture: origin `271145615`, destination `1906667447`; blocking both edges of `768625211:4` preserves a valid alternative. BFS witnesses: 1,003.818 m baseline, 1,470.595 m alternative, 695.005 m of alternate-only segments. These are connectivity witnesses, not shortest-route results. Tests verify every directed transition and an unreachable component.

### Executed checks

| Command/check                           | Result                                                                                                                                          |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm add -D @types/geojson@7946.0.16`  | PASS; only new dependency is a development-time type package. Existing pnpm store required sandbox permission.                                  |
| OSM acquisition                         | PASS via bounded curl request to OSM map API, then `pnpm data:acquire /tmp/ghostroute-selected.json`; normalized source and manifest generated. |
| `pnpm data:prepare`                     | PASS; offline conversion, graph/map validation, bounds/budgets/components and alternative fixture.                                              |
| Repeat conversion + `sha256sum --check` | PASS; graph, GeoJSON, fixture and metadata byte-identical across consecutive runs.                                                              |
| `pnpm lint`                             | PASS; no warnings/errors.                                                                                                                       |
| `pnpm typecheck`                        | PASS; Next type generation and strict TypeScript.                                                                                               |
| `pnpm test`                             | PASS; **47 tests in 4 files**, including the unchanged foundation smoke.                                                                        |
| `pnpm build`                            | PASS; Next production build, static `/` and not-found pages.                                                                                    |
| `pnpm format:check`                     | PASS.                                                                                                                                           |
| Local Markdown links                    | PASS; 109 local file links checked before adding this record.                                                                                   |
| `git diff --check`                      | PASS.                                                                                                                                           |
| Template preservation                   | PASS; RULES, AGENTS, workflow, PR template, SUBMISSION, LICENSE and README event section unchanged from 773c266.                                |

The first test run failed because the new geo modules did not exist, before implementation. Later tests exercise conversion/access/direction, meter calculations, malformed inputs, duplicate IDs/adjacency/features, missing references, crossing/coincident-node separation, source tags, restrictions, oversize/out-of-bounds data, checksum reproduction and alternate paths. A subprocess test verifies a wrong-region acquisition does not replace the frozen source/manifest. No online requests run in the test suite.

The first Overpass endpoint returned HTTP 406; two public mirrors returned HTTP 500. The direct OSM API curl acquisition succeeded. Sandbox DNS restrictions and pnpm-store access required scoped escalation; no TLS or registry safeguards were disabled. The first build failed when the sandbox denied Turbopack's local port binding. A retry retained the error in generated cache. An outside-sandbox port check succeeded; removing only `.next/cache/turbopack` and repeating the unchanged build then passed. No application/build configuration workaround was introduced.

### Scope and limitations

No browser/UI behavior changed, so Playwright was not rerun for MAP-01; earlier results remain below. No hosted CI, deployment, native-fetch acquisition branch, independent field survey, authoritative access verification, shelter availability or actual disaster safety was tested. OSM map API has no global snapshot timestamp; file download time and individual edit versions/timestamps are recorded without inventing one. The 12 mapped components and access exclusions may omit real routes. Steps are included; this is not a wheelchair-accessible profile.

Changed files: shared geographic contracts/distance/conversion/graph and dataset validation/connectivity modules; acquisition and conversion scripts; compressed source/manifest/readme; local graph/GeoJSON/metadata/fixture/attribution; three geo/acquisition test files; package/lock/TypeScript and ignore configuration; README, DATA_STRATEGY, ARCHITECTURE, TASKS, ADR-004, this record, CHANGELOG and AI_USAGE. Existing application UI and organizer instructions/workflows are untouched.

Next: **ROUTE-01 — Dijkstra routing engine**, then **MAP-02 — interactive map rendering**. Human source/implementation review remains pending.

---

# Phase 0 foundation verification record

This historical section covers Phase 0 only. Product graph/simulation acceptance tests are specified in TESTING but not implemented. Final code checks completed 2026-10-10T22:12:35+05:30; all results below were executed locally.

## Environment and installation investigation

Official clone baseline: `6a6217d`; branch `codex-foundation`. Shell Node is 22.23.1; the bundled pnpm 11.25.0 launcher uses Node 24.19.0. Both supported Node lines are declared; CI selects Node 22 via `.nvmrc`.

Initial `pnpm install` and subsequent retries failed or stalled on npm registry/tarball timeouts (`ERR_PNPM_META_FETCH_FAIL`, aborted downloads). Disk and memory were available. Small metadata/range requests worked; a full Next tarball probe transferred about 1 MB in 20 seconds before timeout. Reduced concurrency, longer timeout and an IPv4-first retry did not establish a successful install. One stalled retry was terminated explicitly. The user then switched to faster Wi-Fi and a fresh standard pnpm retry reused cached packages. No alternate registry, TLS bypass, manual cache injection or package-manager replacement was introduced. After the Wi-Fi switch the downloads completed. pnpm then required explicit approval for the inspected `unrs-resolver` native installer. Prettier 3.9.10 was inside the default release-age window; it was replaced with 3.9.9, and only the newly generated dependency tree/lockfile were regenerated with `pnpm clean --lockfile`. The final policy-compliant install and frozen-lockfile install both passed. `pnpm-workspace.yaml` contains three specific build permissions and no release-age exception.

## Evidence boundary

No hosted Actions, deployment, road-graph correctness, actual shelter data, map service reliability, field safety or completed product demo has been verified in this phase. Human review and submission remain pending.

## Dependency compatibility decision

ESLint 9.39.5 is the newest 9.x patch found during this run. It is deprecated upstream, but the selected Next lint stack includes React/JSX accessibility/import plugins whose declared peers do not yet include ESLint 10. Retain this compatible version for the foundation and revisit the plugin/toolchain combination after the hackathon; do not suppress peer errors or introduce a second linter configuration. TypeScript 5.9.3 is used because the selected TypeScript ESLint parser declares support below 6.1. No dependency vulnerability audit is claimed by these compatibility checks.

## Executed results

| Check                                       | Actual result                                                                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                              | PASS after network recovery and explicit native-installer configuration; 381 packages installed                                                       |
| `pnpm install --frozen-lockfile`            | PASS; up to date, no lockfile mutation                                                                                                                |
| `pnpm format`                               | PASS; formatted maintained files, excluded inherited RULES.md                                                                                         |
| `pnpm lint`                                 | PASS; zero errors/warnings after naming the PostCSS config export                                                                                     |
| `pnpm typecheck`                            | PASS; Next route type generation and strict `tsc --noEmit`                                                                                            |
| `pnpm test`                                 | PASS; 1 test in 1 file, safety/status smoke only                                                                                                      |
| `pnpm build`                                | PASS; Next 16.4 Turbopack production build, static `/` and not-found page                                                                             |
| `pnpm exec playwright install chromium`     | PASS; Chromium 156 / Playwright build 1248 installed; Fedora used the Ubuntu fallback binaries                                                        |
| `pnpm test:e2e`                             | PASS; rebuild plus 2 Chromium tests: desktop and 360 × 800 viewport                                                                                   |
| `pnpm dev --hostname 127.0.0.1 --port 3101` | PASS; HTTP 200 and expected title/disclaimer; server stopped after check                                                                              |
| Browser screenshot review                   | PASS for foundation page at 360 × 800; text and disclaimer visible without clipping; local ignored screenshot at `test-results/foundation-mobile.png` |
| `pnpm format:check`                         | PASS; final document check repeated before commit                                                                                                     |
| Local Markdown links                        | PASS; relative file destinations checked outside fenced code blocks                                                                                   |
| Required artifact/task inventory            | PASS; 19 docs including 7 ADRs + index, 4 issue templates, 19 task records, 6 beginner-friendly tasks                                                 |
| `git diff --check`                          | PASS; repeated on the staged final change                                                                                                             |

The initially failing ad hoc link check interpreted an Overpass code fragment as a link; excluding fenced code corrected the check. An inventory assertion initially expected 18 tasks; the actual catalog contains 19, with six beginner tasks. A README preservation comparison initially included table separator lengths; comparing substantive content confirmed only formatting changed in the event section. These were check-script mistakes, not omitted content. No such temporary script is part of the application.

The dev smoke revealed Next's automatic AGENTS block. `agentRules: false` now disables it. After removing only the generated block, a repeated dev startup/request showed no generated instructions, retained the original prefix and left AGENTS byte-identical across the request. Lint, types, unit tests, production build and both browser tests were rerun successfully after this configuration change.

## Preservation and consistency review

- `RULES.md` is byte-for-byte identical to `6a6217d`.
- Inherited `AGENTS.md`, `.gitignore` and PR-template content remain intact; additions follow the original content.
- Template-preparation AI log, template changelog entry and submission checklist are retained unchanged. README event/rules/usage content remains unchanged apart from table alignment.
- All eight inherited files still exist. No organizer workflow existed; one additive CI workflow was created. No preexisting application or lockfile was replaced.
- PRD, contracts, ADRs, tasks, testing, design and demo plan agree on a small walking-distance simulation with local OSM-derived roads, synthetic destinations, deterministic flood intersections and Dijkstra. All product paths/data/features are labeled planned.
- Required commands agree across package scripts, README, contributor docs and CI. CI builds once then invokes Playwright directly; the public `test:e2e` command builds for local reproducibility.
- No remote issue/settings change, push, force-push, history rewrite, hosted deployment or submission occurred. The official SSH remote remains unchanged. Local work is on `codex-foundation`.

## Known limits and remaining decisions

The smoke tests do not cover a map, graph conversion, routing, flood simulation, field safety, actual shelters or the future P0 user journey. Hosted GitHub Actions has not run because nothing was pushed. No dependency vulnerability audit, full WCAG audit, Firefox/WebKit run or real mobile-device test is claimed. Chromium executed successfully on this Fedora host, but upstream does not officially support this OS.

Final geographic extent, reviewed route/scenario nodes and online basemap provider are still proposed. Organizer-text licensing, private reporting contact, participant identities, final submitted SHA, deployment target and venue submission procedure need human/domain input. MIT covers only newly authored GhostRoute material. ESLint 9 deprecation is explained above.

## Local commit identity

The first local milestone commit attempt was rejected because Git had no author identity configured. The user supplied a name/email, which were configured only in this official checkout; global Git settings were not changed. Human code review remains pending.

## File manifest

All paths are relative to the official checkout. Generated build output, node_modules, Next environment declarations and browser screenshots are ignored.

Modified inherited files (7):

- `.github/pull_request_template.md`
- `.gitignore`
- `AGENTS.md`
- `AI_USAGE.md`
- `CHANGELOG.md`
- `README.md`
- `SUBMISSION.md`

New files (47):

- `.editorconfig`
- `.env.example`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/documentation.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/good_first_issue.md`
- `.github/workflows/ci.yml`
- `.nvmrc`
- `.prettierignore`
- `.prettierrc.json`
- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `SECURITY.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTRIBUTOR_GUIDE.md`
- `docs/DATA_STRATEGY.md`
- `docs/DEMO_PLAN.md`
- `docs/DESIGN_SPEC.md`
- `docs/PRD.md`
- `docs/ROADMAP.md`
- `docs/TASKS.md`
- `docs/TEMPLATE_AUDIT.md`
- `docs/TESTING.md`
- `docs/VERIFICATION.md`
- `docs/adr/001-frontend-first.md`
- `docs/adr/002-maplibre-osm.md`
- `docs/adr/003-routing.md`
- `docs/adr/004-geographic-data.md`
- `docs/adr/005-simulation.md`
- `docs/adr/006-testing.md`
- `docs/adr/007-state.md`
- `docs/adr/README.md`
- `eslint.config.mjs`
- `next.config.ts`
- `package.json`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `postcss.config.mjs`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `tests/e2e/foundation.spec.ts`
- `tests/unit/foundation.test.ts`
- `tsconfig.json`
- `vitest.config.ts`

## SIM-01 + INT-01 — 10 October 2026

The actual local graph is unchanged: 1,719 nodes, 3,712 directed edges, 1,856 physical segments. `pnpm data:prepare` completed; `git diff --exit-code -- public/data/ernakulam` confirmed byte-identical tracked runtime assets. Organizer rules, original README prefix, instructions and workflows were preserved.

Pure and integration tests verify Hospital Road baseline **944.333 m** and polygon detour **1,411.110 m** (5 segments/10 directions/3 nodes blocked). Expanding stages block **5 → 9 → 27** segments; distances are **1,411.110 → 1,411.110 → 1,731.155 m**. Unavailable blocks **21** segments/42 directions/14 nodes; typed `destination-blocked`, and segment-only routing independently returns `no-route`. No fabricated alternative distance is returned.

### Measured performance

Command: `node --experimental-strip-types scripts/benchmark-simulation.ts`. Node 22.23.1, Linux, AMD Ryzen 7 8845HS; 5 warmups, 30 samples, median / p95 milliseconds. These are local Node measurements, not a browser frame-time or device-wide guarantee.

| Operation                        | Median |   p95 |
| -------------------------------- | -----: | ----: |
| Flood engine initialization      |  6.612 | 8.988 |
| hospital stage 1 intersection    |  0.365 | 0.859 |
| hospital stage 1 rerouting       |  0.391 | 0.599 |
| expanding stage 1 intersection   |  0.358 | 0.609 |
| expanding stage 1 rerouting      |  0.273 | 0.369 |
| expanding stage 2 intersection   |  0.378 | 0.557 |
| expanding stage 2 rerouting      |  0.268 | 0.355 |
| expanding stage 3 intersection   |  0.251 | 0.486 |
| expanding stage 3 rerouting      |  0.400 | 0.461 |
| unavailable stage 1 intersection |  0.217 | 0.542 |
| unavailable stage 1 rerouting    |  0.002 | 0.002 |

### Browser inspection and corrections

Actually rendered production Next.js + MapLibre in Chromium, at 1440×900 desktop and 360×800 mobile, with real local datasets/router. Public OSM tiles were deliberately blocked. Captured Hospital, expanding stage 3 and unavailable screenshots under ignored `test-results/`. Inspected route contrast, cyan/amber polygons, red blocked geometry, mobile sheet, comparison values and unavailable feedback. Found and corrected a desktop zoom-control overlap; updated the existing out-of-range click test because its old click targeted the new panel. Expanded camera bounds to include flood polygons so a destination-centered hazard remains visible. Enlarged the unavailable scenario to keep its cyan extent visible around the destination marker on mobile; remeasured 21 blocked segments. No failed network request to the optional, deliberately aborted tile service is treated as an app exception.

Physical-device touch, Safari/Firefox, screen-reader certification, live tile reliability, deployment, human timed rehearsal and submission are not verified. The engine is conservative 2D geometry: bridges may be overblocked and submeter illustrative boundaries are not geographic accuracy claims. Human review remains pending.

### Final checks

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: 135 tests across 10 files passed (29 added simulation tests).
- `pnpm build`: passed as the production build invoked by `pnpm test:e2e`.
- `pnpm test:e2e`: 20 journeys passed, 10 desktop + 10 mobile, including existing MAP-02 regressions and actual flood scenarios. Final run: 14.1 seconds.
- `pnpm format`: executed successfully; final format check and diff whitespace checked before commit.
- `pnpm data:prepare`: passed; existing runtime graph/GeoJSON/metadata unchanged.
- Hospital browser journey captured no unexpected console errors or uncaught page errors. Optional remote tiles were intentionally aborted.

### SIM-01/INT-01 file inventory

- `AI_USAGE.md`
- `CHANGELOG.md`
- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DEMO_PLAN.md`
- `docs/DESIGN_SPEC.md`
- `docs/FLOOD_SIMULATION.md`
- `docs/TASKS.md`
- `docs/TESTING.md`
- `docs/VERIFICATION.md`
- `docs/adr/009-flood-integration.md`
- `docs/adr/README.md`
- `package.json`
- `pnpm-lock.yaml`
- `scripts/benchmark-simulation.ts`
- `src/app/globals.css`
- `src/components/Dashboard.tsx`
- `src/components/MapView.tsx`
- `src/components/SimulationPanel.tsx`
- `src/lib/geo/types.ts`
- `src/lib/map/style.ts`
- `src/lib/simulation/flood.ts`
- `src/lib/simulation/scenarios.ts`
- `src/lib/simulation/session.ts`
- `tests/e2e/foundation.spec.ts`
- `tests/e2e/simulation.spec.ts`
- `tests/unit/map.test.ts`
- `tests/unit/simulation.test.ts`
