# Change log

## SIM-01 + INT-01 — 2026-10-10T23:33:01+05:30

- Changed: Added deterministic Turf polygon/MultiPolygon intersections, immutable segment/node closures, three illustrative Ernakulam scenarios, automatic existing-router recalculation, route comparisons, responsive simulation controls and in-place map overlays. Added geometry/integration/browser tests, benchmark script and ADR-009; updated architecture, design, tasks, testing and demo documentation.
- Why: Complete the central real-road flood-and-detour demonstration without live feeds, backend services or replacing geographic/routing modules.
- Validation: 135 unit tests, lint and types pass; production browser verification and exact performance/scenario outcomes are recorded in docs/VERIFICATION.md. Offline data regeneration remained byte-identical. Actual desktop/mobile screenshots inspected; corrected control overlap, camera coverage and the destination hazard's visibility.
- Limitations: Illustrative 2D flooding may block bridges conservatively; geography and emergency access are not verified current conditions. Browser checks use optional-tile failure deliberately. Human review, target-device rehearsal and deployment remain pending. No push or remote changes.

## MAP-02 — 2026-10-10T23:13:00+05:30

- Changed: Replaced the smoke page with the responsive MapLibre route explorer, local validated asset loader, retained Dijkstra integration, snapped/preset endpoints, route information, reset/help, offline-road fallback and future overlay boundaries. Added MapLibre/Lucide and locally served worker preparation; preserved geographic data and routing modules.
- Why: Make the actual Ernakulam graph and routes usable in the browser before adding flood simulation.
- Validation: Lint/types/build/format passed; 106 Vitest tests and 16 production Chromium desktop/mobile journeys passed. Offline data regeneration is unchanged. Actual desktop/mobile screenshots and Strict Mode loading were inspected. See docs/VERIFICATION.md for corrected failures and file inventory.
- Limitations: Remote tiles deliberately blocked in automated checks; physical devices and assistive technologies not certified. Flood simulation and automatic rerouting remain next. Human review pending; local commit only, no push or deployment.

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

## 2026-10-10T22:49:08+05:30 — ROUTE-01 deterministic shortest-path engine

- Changed: Added indexed binary-heap Dijkstra, private reusable graph initialization, typed route/snapping results, node/edge/segment closures, default walking-distance profile, geographic snapping and benchmark command. Added synthetic/real routing and heap/snapping tests, integration docs and ADR-008; corrected foundation status text.
- Why: Supply true shortest routes and predictable closure recalculation for MAP-02 and SIM-01, without a backend or invented safety/accessibility data.
- Validation: Lint, strict types, 94 unit tests, production build, format/check and 2 desktop/mobile Chromium smoke tests passed. Data regeneration unchanged. Independent Bellman-Ford agrees with real 944.333 m baseline and 980.790 m closed-road route. Actual initialization/routing/snapping timings and environment are recorded in VERIFICATION.
- Limitations: Node benchmarks exclude UI/flood latency; snapping is to existing nodes, not verified entrances. No map/flood implementation, dependency additions, push or remote mutations. Human review pending.

## 2026-10-10T22:30:30+05:30 — MAP-01 real Ernakulam road data

- Changed: Added reusable geographic/routing contracts, OSM acquisition and deterministic offline conversion, graph/GeoJSON validation, component/path witnesses, frozen normalized source and local assets with ODbL attribution. Updated data/architecture/task/verification docs, README and minimal tooling; only dependency added is GeoJSON types.
- Why: Supply a real, reproducible road network for Dijkstra and flood blocking without inventing connections or relying on runtime OSM services.
- Validation: Lint, strict types, 47 tests, production build, formatting, byte-identical repeat conversion, Markdown links and template-preservation checks passed. Graph: 1,719 nodes / 3,712 edges / 12 components; 1.88 MB graph + GeoJSON; real alternate path validated. Build required clearing a sandbox-error cache and rerunning with local-port permission. See VERIFICATION.
- Limitations: No shortest-path engine, map UI or flood implementation. Walking defaults are not verified access/safety; 12 disconnected components retained. No browser rerun, hosted checks, push or remote mutations; human review pending.

## 2026-10-10T21:46:05+05:30 — GhostRoute Phase 0 foundation

- Changed: Audited all eight inherited files; added PRD, architecture/contracts, seven ADRs, data/design/testing/demo plans, roadmap/task catalog and contributor infrastructure; added a minimal Next.js tooling page, strict TypeScript, pnpm, Tailwind, lint/format/test/build/CI configuration and protection against framework-generated AGENTS edits. Filled known submission facts and preserved unknown human-owned fields.
- Why: Establish a small, reproducible collaborative foundation without implementing the navigation product or losing organizer requirements.
- Validation: Repository/history/content inspection and preservation review passed. After Wi-Fi recovery and dependency-policy fixes: frozen install, lint, strict types, 1 unit test, production build, 2 Chromium tests, formatting and dev HTTP smoke passed. Disabled Next automatic AGENTS edits; repeated checks passed. See [VERIFICATION](docs/VERIFICATION.md) for evidence and limits.
- Verification completed: 2026-10-10T22:12:35+05:30; human review remains pending.
- Limitations: Navigation, road acquisition and simulation are planned; no push, remote issue, settings change, deployment or submission. Organizer text license and private reporting contact remain unresolved; human review pending.

## Template setup — 10 October 2026

- Changed: Added the event README, rules, agent guide, change log, AI usage record, submission checklist, Git ignore rules, and pull request checklist.
- Why: Give participants a consistent starting point for event rules, basic coding patterns, documented changes, and regular commits.
- Validation: Checked local Markdown links, event detail consistency, required documents, and diff whitespace before publishing.
- Limitations: Documentation scaffolding only; no participant project, application, or working demo is included. GitHub publication and template status are verified separately after creation.
