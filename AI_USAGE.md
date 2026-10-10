# AI usage record

## Visible emergency-shelter guidance — 2026-10-11T04:28:00+05:30

Codex adjusted the evacuation flow after user feedback so available illustrative shelters are shown when any simulated incident is active rather than being hidden until the original destination fails. It added a purple legend key and updated the demo safety wording. TypeScript, ESLint, production build and focused shelter/map tests passed; human review remains pending.

## Windows verification repair — 2026-10-11T04:10:47+05:30

Codex diagnosed a failing frozen-data assertion as a Git Windows CRLF checkout mismatch, not a source-data or route change, and made the hash assertion normalize only JSON line endings. The focused dataset test then passed. It also started the production browser suite: the app built, but all Chromium cases were blocked by a missing Playwright browser binary. A browser download was initiated but did not finish; browser verification remains pending.

## Simulated evacuation fallback — 2026-10-11T03:14:23+05:30

Codex inspected the existing selector, deterministic router, flood closures and MapLibre overlay contracts; then added a small synthetic shelter catalog, closure-aware reachable-shelter ranking, purple map markers, a destination-selection action and focused unit tests. The team should review the evacuation copy and visual behavior before presenting. TypeScript, ESLint, production build and the focused shelter/map tests passed. Full formatting reports existing repository-wide drift; an earlier unfiltered Vitest run also exposed an existing dataset reproducibility failure. No shelter data, capacity, facilities, safety claim, live feed, account or external service was invented as real.

## GitHub preview evidence — 2026-10-11T02:07:25+05:30

Recorded the actual Ready Vercel preview, successful commit status and bot comment for documentation PR #8 in DEPLOYMENT/VERIFICATION. Checked links and whitespace; external-fork authorization remains unverified. Codex assistance, human review pending.

## Vercel production deployment — 2026-10-11T02:05:50+05:30

- Changed: imported official GitHub `main` into the existing Hobby project `ghostroute`; documented public production URL, exact initial source SHA, GitHub production/preview workflow, environment requirements, caching and troubleshooting in README/DEPLOYMENT/SUBMISSION. Added hosted desktop/mobile screenshots; organizer requirements and participant submission fields are preserved.
- Why: provide a publicly accessible demo and automatic builds for approved official-repository merges.
- Checks: fresh official fetch confirms `main` contains the complete application with identical tree to the completed development branch. Lint/types, 174 tests and production build passed; failed local Turbopack cache was cleared before the passing build. Vercel's exact pinned pnpm build passed. Six real public desktop/mobile browser journeys passed, including local deletion persistence, multiple hazards, rerouting, themes and `/demo`. All four hosted datasets match source bytes; worker JavaScript and direct `/demo` HTTP 200, CDN HIT/ETag checks passed. High-confidence tracked credential-pattern scan had no candidates.
- Limits: local reports are browser/origin scoped; frozen OSM and simulations do not establish safe routes. ~9.48 MB compressed / 68.13 MB decoded initial dataset cost remains; physical phone testing and human rehearsal pending. Fork previews may require owner authorization and retain existing access protection. No Google Form submission, paid resources, repository permission changes or protection weakening.

## Collaboration publishing assistance — 2026-10-11T01:27:15+05:30

Codex audited tracked assets/history for publishing without printing secret values, verified an independent fresh clone with a real pinned install, ran lint/types/174 tests/build/format, corrected branch-specific onboarding/review/permissions instructions and created two nonduplicate remaining human-review issues with existing labels. The sandbox denied dependency network/store access and compiler worker ports; the install used a new temporary store and the build passed after removing only the failed temporary compiler cache and running with required access. Fresh-clone production browser rerun passed all 42 tests (21 desktop, 21 mobile) in 3.5 minutes. Human review is pending. Publishing is explicitly authorized; no force push, history rewrite, main overwrite, settings change, deployment or submission.

## Expanded UI and verification assistance — 2026-10-11T01:19:34+05:30

Codex implemented separate workflows/themes/local deletion and meaningful failure/regression tests, inspected real screenshots and corrected drawer overlap, map-label overflow, contrast and reset test assumptions. Actual final checks passed: 174 unit tests and 42 browser tests plus lint/types/build/format/regeneration. Measurements and source/phone/storage limitations are recorded in VERIFICATION. Human review pending; no push/deployment or fabricated security/physical validation.

## Navigation, themes and local report management — 2026-10-11T01:06:18+05:30

Implemented separate left navigation/right workflows, `/demo`, persisted Light/Dark/System and confirmed local report deletion. Corrected actual browser drawer overlap, off-screen map overflow and dark contrast; preserve independent navigation/simulation reset. Validation: 174 unit tests, all 21 final desktop browser cases, lint/types/build/format and deterministic data regeneration passed. Final mobile suite/evidence is still running. Human review pending; no push or deployment.

## Expansion assistance — 2026-10-11T00:48:58+05:30

Codex inspected organizer/project rules and existing geographic/routing/map/report systems, acquired and merged public OSM data after Overpass failures, preserved real geometry/access and Hospital Road, implemented a broad offline index, snapping optimization, separate workflows, themes and local deletion, and updated tests/docs. Unit failures identified changed connectivity, quadratic oracle cost and snap eligibility fallback; these were corrected and 174 tests passed. Production build passed after clearing failed generated compiler cache. Browser/visual verification remains in progress. Human review pending; no roads, participant credentials, reports or deployment evidence fabricated. No external resource, push or deployment created.

Use Codex during the hackathon and briefly document its actual contribution here. Add a row after each meaningful task or milestone. Keep summaries concise and omit secrets, private data, and full chat transcripts.

## Event build log

Participant work below was performed with Codex. Human review remains pending.

| Date and time with timezone | Tool / model, if known | Task                                                            | Assistance and affected files                                                                                                         | Human review / corrections                                                  | Validation and result                                                              |
| --------------------------- | ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 2026-10-10T21:46:05+05:30   | Codex                  | Phase 0 audit, architecture, contributor foundation and tooling | Inspected all inherited files/history; authored docs/ADRs/task plans; extended template documents; added smoke scaffold, CI and tests | Pending; no participant identity, deployment or product completion invented | See docs/VERIFICATION.md for actual commands, failures, recovery and final results |

## MAP-01 assistance — 2026-10-10T22:30:30+05:30

Codex inspected the clean repository and instructions, researched OSM access/direction semantics, acquired real bounded OSM data, wrote contracts/conversion/validation and tests, selected a graph-derived alternate-path witness, and updated documentation/tooling. Data topology comes from OSM node identities; no roads or connections were generated by AI. Source, access assumptions and exact checks are in DATA_STRATEGY and VERIFICATION. All 47 tests, lint, types, build and deterministic regeneration passed locally. Human geographic and implementation review remains pending. No remote issue, push, settings change or deployment occurred.

## ROUTE-01 assistance — 2026-10-10T22:49:08+05:30

Codex inspected the existing instructions/contracts/dataset, implemented and tested indexed-heap Dijkstra, closures, typed results and geographic snapping, wrote an independent test-only Bellman-Ford oracle, and measured real graph performance. Tests exposed malformed-profile/coordinate issues and strict typing errors; final lint/types, 94 tests, build, formatting, 2 browser smoke tests and unchanged data regeneration passed. No data or safety attributes were invented. Human implementation review remains pending. Work was committed locally only; no push, remote settings/issue changes or deployment.

## Template preparation

On 10 October 2026, Codex prepared this documentation template from the organizer's supplied rules and checked the linked Luma page for the event name and dates. This covered `README.md`, `RULES.md`, `AGENTS.md`, `CHANGELOG.md`, `AI_USAGE.md`, `SUBMISSION.md`, `.gitignore`, and the pull request checklist. Agent validation covered local links, event consistency, required documents, and diff whitespace; organizer review is pending.

This preparation is separate from participant project implementation and participant AI usage during the event.

## MAP-02 assistance — 2026-10-10T23:13:00+05:30

Codex inspected the existing contracts, rules and design, implemented the interactive dashboard and browser data boundary, integrated the existing router, added MapLibre/Lucide and local worker preparation, and wrote unit/browser tests. Real browser inspection exposed worker URL and viewport/legend defects; these were fixed and rechecked. Final verification: 106 unit tests, 16 desktop/mobile browser journeys, lint, types, build, formatting and unchanged data regeneration. Desktop/mobile screenshots were actually inspected; public tile traffic was blocked. No geographic roads or routing logic were fabricated or replaced. Human review remains pending. Nothing was pushed or deployed.

## SIM-01 + INT-01 assistance — 2026-10-10T23:33:01+05:30

Codex inspected the existing organizer instructions, contracts, real dataset, routing and map architecture; implemented focused Turf validation/intersections, deterministic illustrative flood scenarios, automatic rerouting with the retained Dijkstra engine, controls and comparisons. Added tests and measured performance. Actual screenshot inspection exposed control overlap and a destination polygon hidden by its marker; both were corrected. Tests/documentation use measured closure counts and real shortest paths, not invented road geometry or disaster observations. Verification and limitations are recorded in docs/VERIFICATION.md. Human review remains pending. No push, deployment, remote issue or settings changes occurred.

## Final hackathon readiness assistance — 2026-10-10T23:45:20+05:30

Codex audited the actual completed SIM-01/INT-01 application and ran its original production browser suite, then implemented a small guided presenter sequence reusing the existing state, graph and routing algorithms. It added keyboard/reliability/asset tests, inspected real desktop/mobile screenshots, corrected mobile metric placement and reset clipping, and prepared deployment/pitch/submission documentation with explicit stop conditions. The user supplied three participant names; handles and contributions were not invented. Vercel configuration is local only; no hosted success, timed human rehearsal, push or submission is claimed. Exact checks and measurements are in VERIFICATION; human review pending.

## Interactive platform assistance — 2026-10-11T00:07:14+05:30

Codex inspected the existing completed milestones and organizer rules, extended the existing Turf impact engine and MapLibre dashboard, and reused the unchanged Dijkstra graph. It implemented explicit simulation/report source separation, local persistence and verification safeguards, wrote real-data unit/browser tests, inspected actual desktop/mobile screenshots, corrected accessibility/mobile feedback/mode-label issues, and measured performance. It checked official Supabase documentation for a future migration plan; no cloud database was created or claimed. Geographic roads, observed incidents, verification results and routing distances were not fabricated: the lone seed is explicitly illustrative and excluded from routing. Checks and limits are in VERIFICATION. Human review remains pending; nothing was pushed or deployed.

## Coverage and place-search assistance — 2026-10-11T00:26:02+05:30

Codex inspected the existing application and organizer instructions, acquired a bounded OSM source extract, checked actual source coordinates and road membership, rejected a disconnected candidate and validated every catalog pair with the existing router. It implemented local filtering, accessible selection and dataset extent layers, adapted existing browser selectors without replacing route/hazard algorithms, and added source evidence and tests. Actual production screenshots and browser failures led to mobile focus/reset/scrolling and overlay fixes. Verification records distinguish automated desktop/mobile evidence from untested physical keyboards and hosted services. No public Nominatim autocomplete, new dependencies, push, deployment or remote resources. Human review remains pending.
