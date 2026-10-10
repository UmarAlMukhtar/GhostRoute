# Verification record

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
