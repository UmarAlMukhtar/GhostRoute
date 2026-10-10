# Change log

Record each meaningful project change during the event, newest first. Update this file in the same commit as the change. Use a real timestamp with timezone, for example `YYYY-MM-DDTHH:MM:SS+05:30`.

## Event build log

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
