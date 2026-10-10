# Change log

## GitHub preview evidence — 2026-10-11T02:07:25+05:30

Recorded the actual Ready Vercel preview, successful commit status and bot comment for documentation PR #8 in DEPLOYMENT/VERIFICATION. Checked links and whitespace; external-fork authorization remains unverified. Codex assistance, human review pending.

## Vercel production deployment — 2026-10-11T02:05:50+05:30

- Changed: imported official GitHub `main` into the existing Hobby project `ghostroute`; documented public production URL, exact initial source SHA, GitHub production/preview workflow, environment requirements, caching and troubleshooting in README/DEPLOYMENT/SUBMISSION. Added hosted desktop/mobile screenshots; organizer requirements and participant submission fields are preserved.
- Why: provide a publicly accessible demo and automatic builds for approved official-repository merges.
- Checks: fresh official fetch confirms `main` contains the complete application with identical tree to the completed development branch. Lint/types, 174 tests and production build passed; failed local Turbopack cache was cleared before the passing build. Vercel's exact pinned pnpm build passed. Six real public desktop/mobile browser journeys passed, including local deletion persistence, multiple hazards, rerouting, themes and `/demo`. All four hosted datasets match source bytes; worker JavaScript and direct `/demo` HTTP 200, CDN HIT/ETag checks passed. High-confidence tracked credential-pattern scan had no candidates.
- Limits: local reports are browser/origin scoped; frozen OSM and simulations do not establish safe routes. ~9.48 MB compressed / 68.13 MB decoded initial dataset cost remains; physical phone testing and human rehearsal pending. Fork previews may require owner authorization and retain existing access protection. No Google Form submission, paid resources, repository permission changes or protection weakening.

## Collaboration publishing readiness — 2026-10-11T01:27:15+05:30

- Changed: README/CONTRIBUTING now clone `codex-foundation`, pin Node 22.13+ (22 line) or 24 and pnpm 11.25.0, explain public clone/write permissions, human `feature/<task>` branches and reviewer/CI gates for stable `main`. Updated contributor guide and linked remaining human-review issues #1/#2.
- Why: Make teammate onboarding reach the implemented app while preserving organizer files, history and stable main.
- Checks: Fresh independent clone from local Git history; real frozen-lockfile install downloaded 437 packages into a new temporary store with Node 22.23.1/pnpm 11.25.0. Lint/types, 174 unit tests, production build and format check passed. Fresh-clone production browser rerun passed all 42 tests (21 desktop, 21 mobile) in 3.5 minutes. Tracked/history credential-pattern scan found no candidates; runtime assets/source/lock are tracked, generated/private paths excluded; RULES remains byte-identical to initial template. Local changed-doc links and diff whitespace passed.
- Limits: Hosted CI, publishing SHA and PR will be checked after authorized non-force push. Human accessibility review/timed rehearsal, deployment and venue submission remain separate. No repository settings changed.

## Expanded workflows and final verification — 2026-10-11T01:19:34+05:30

Separated navigation, simulation and reports; added `/demo`, Light/Dark/System, confirmed browser-local report deletion and full regression/visual evidence. Validation: 174 unit tests, 42 production browser tests, lint/types/build/format and byte-identical regeneration passed. Larger initial asset/memory costs and physical phone validation remain documented; human review pending. Local commits only.

## Navigation, themes and local report management — 2026-10-11T01:06:18+05:30

Implemented separate left navigation/right workflows, `/demo`, persisted Light/Dark/System and confirmed local report deletion. Corrected actual browser drawer overlap, off-screen map overflow and dark contrast; preserve independent navigation/simulation reset. Validation: 174 unit tests, all 21 final desktop browser cases, lint/types/build/format and deterministic data regeneration passed. Final mobile suite/evidence is still running. Human review pending; no push or deployment.

## Kochi geographic expansion and search — 2026-10-11T00:48:58+05:30

- Changed: Acquired 44 bounded real OSM responses, merged source/provenance, preserved access/topology, retained full geometry with shape-node compaction, regenerated graph/roads/fixtures and a 12,409-name local index. Added snapping grid, directed index validation, debounce/ranking and coordinate search; updated data/architecture/README/ADR and regression tests.
- Why: Support real navigation across central Kochi, Edappally, Vyttila, Kakkanad, Fort Kochi and Aluva rather than enlarge an empty visual boundary.
- Checks: Production build and 174 unit tests passed; Hospital Road retains 944.333 m baseline and 980.790 m single-segment detour. Final browser verification remains in progress and will be recorded separately.
- Limits: ~65 MB raw runtime graph/road JSON; frozen OSM access assumes missing permissions, approximate node snapping, incomplete gazetteer and retained disconnected components. Human geographic/implementation review pending. Local work only, no push or deploy.

## Final demo and submission readiness — 2026-10-10T23:45:20+05:30

- Changed: Added presenter-controlled Demo Mode with real calculated metrics, restart/exit/manual handoff and regional reset; improved mobile guide spacing and keyboard access. Prepared Vercel config/runbook, pitch, submission narrative and named team draft; corrected stale foundation-only status; documented priorities and publication stop conditions.
- Why: Make the verified flood-and-reroute workflow dependable for a three-minute presentation and prepare a concrete deployment/submission handoff without publishing.
- Validation: Existing SIM-01/INT-01 audit passed all 20 original production browser journeys. Expanded tests cover full guide, keyboard, delayed assets, production workers, rapid switching, repeated reset, resizing and refresh. Final checks, screenshots and measured timings are recorded in VERIFICATION. Pinned deployment install command passed; data regeneration unchanged. Mobile reset clipping found by screenshot/bounds review was corrected.
- Limitations: Local production proof is not a hosted build or human timed rehearsal. Participant handles/contributions, venue submission method and Vercel account/project approval remain outstanding. No push, deployment, remote settings change or submission; human review pending.

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

## Interactive hazards and local reports — 2026-10-11T00:07:14+05:30

- Extended the existing graph/router/map with editable flood, landslide and fire zones, physical roadblocks, combined closures and automatic comparisons. Retained all preset demos.
- Added Navigate/Simulate/Reports/Demo workspaces, coordinate entry, draggable/swappable endpoints, explicit geolocation, separate unverified report markers/filtering and guarded exploratory routing.
- Reports persist only in this browser. Supabase is unconfigured; shared API/RLS/moderation requirements are documented, not falsely presented as working. No photo uploads or geocoder.
- Verified lint/types, 153 unit tests, production build, 32 desktop/mobile browser tests, formatting, unchanged geographic regeneration, actual screenshots and measured impact/routing performance (VERIFICATION).
- Preserved organizer instructions/workflows, source geography and routing algorithm. Local commit only; human review pending. No push, deployment, remote settings or external resources.

## Dataset extent and offline search — 2026-10-11T00:26:02+05:30

- Added exact graph extent as a dashed teal map boundary/fill, label, legend and View Demo Area control.
- Replaced primary fixture selectors with offline searchable start/destination fields, seven sourced/validated popular places, keyboard/touch selection, clear/swap/reset and automatic real routing. Preserved fixture shortcuts and arbitrary map/coordinate input.
- Added OSM source evidence, ODbL attribution, catalog validation command, tests, documentation and real browser screenshots. No new dependencies or geographic/routing-engine modifications.
- Validated 169 unit tests, 36 production browser journeys, lint/types/build/format, seven place fixtures and unchanged road regeneration. Fixed mobile focus/reset and overlay stacking issues discovered in the browser. See VERIFICATION for scope and limits.
- Local commit only; no push or deployment. Human review pending.
