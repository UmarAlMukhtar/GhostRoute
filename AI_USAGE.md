# AI usage record

## Submission draft assistance — 2026-10-11T08:26:09+05:30

Codex refreshed `SUBMISSION.md` from the current project and verification record, checked the organizer's public event page and local links, and added participant handles and broad contribution roles supplied by Umar. Final submitted SHA, human rehearsal, and organizer submission remain unclaimed. Human review pending.

## Shared-runner test correction — 2026-10-11T04:58:58+05:30

Codex read the actual GitHub CI failure log: 47 browser cases passed and the deliberately 4× throttled desktop loader check exhausted its normal 25-second readiness timeout. It limited the longer timeout to that test and replaced the machine-specific frame-gap limit with a fraction of actual loading duration while retaining distinct painted animation states. All four corrected animation/reduced-motion cases passed locally; product behavior and benchmark evidence are unchanged. Human review pending.

## Responsive map loading assistance — 2026-10-11T04:44:13+05:30

Codex traced loading stalls through actual cold Chromium measurements, implemented lossless segment transport and full worker-side geographic validation, batched worker result delivery and existing index construction, and retained synchronous routing/hazard contracts and snapshot isolation. It added exact full-network/reverse-only equivalence, worker failure/retry, catalog equivalence and real animation/reduced-motion tests. A mobile keyboard test was corrected to await the independently loaded catalog enabling its input before programmatic focus; the 47 other initial browser cases passed. Matched three-run before/after evidence and a reproduction script are in `docs/performance`. Lint/types, 181 unit tests, production build and deterministic regeneration passed; the final full browser rerun passed all 48 cases (24 desktop + 24 mobile, 4.1 minutes), with six real loading/readiness screenshots inspected. Authorized publication is pending. Codex performed a separate read-only implementation review; human review remains pending. No dependency, source geographic acquisition, force push, repository setting change or participant submission was introduced.

## Light UI consistency and loading — 2026-10-11T02:32:13+05:30

Codex inspected the existing flows and reference image, kept the map-first layout, implemented matching page navigation, removed theme code and updated current documentation. It separated actual place-index loading from map readiness, added restrained loading feedback and stale/repeated-action guards, and used held browser requests to verify genuine pending states. Final local checks passed lint/types, 175 unit tests, a fresh production build, all 44 desktop/mobile production browser cases, format/format check and diff whitespace. It visually inspected six rendered navigation/demo/preparation screenshots and preserved existing dataset/routing/hazard/report safety boundaries. Human review pending. Publication uses the authorized normal branch/PR/CI/merge workflow; no force push, unrelated settings, fabricated progress or dataset changes.

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

## Responsive map renderer assistance — 2026-10-11T07:57:10+05:30

Codex inspected the existing loading path and in-progress renderer batch change, corrected a browser test TypeScript mismatch, and verified the complete road handoff, cancellation, failure recovery and animated loader in desktop/mobile Chromium. Focused unit tests, types, lint, formatting, production webpack build and 10 targeted browser cases passed. The check used emulation; human review remains pending.

## Reduced-motion loader and README assistance — 2026-10-11T08:06:14+05:30

Codex read the user's local and public Brave tabs, confirmed `prefers-reduced-motion: reduce` made the spinner static while the map later loaded, changed that state to a non-rotating pulse, and verified a real local reload plus four desktop/mobile browser cases. It rewrote the README and preserved an exact backup of the previous file. Production build, TypeScript and formatting passed. Human review and public deployment are pending.

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

## Renderer review correction — 2026-10-11T08:01:00+05:30

An independent read-only Codex review found that MapLibre can emit a worker-update error while resolving its incremental update promise. Codex added an effect-local failure latch, stopped subsequent road batches after rendering errors/graphics loss, and guarded final readiness. The actual injected-send browser regression now asserts one attempted batch and persistent unready state before successful reload. The concurrent user task “Fix the loaders” committed the shared implementation as `6850514`; its commit and verification record are preserved. The coordinated release also preserves `7fa00d0` (reduced-motion opacity pulse and concise README with byte-identical backup). Final isolated production verification passed 184 unit tests, 54 desktop/mobile browser cases, lint, types, build, formatting and unchanged data regeneration. Independent Codex review approved the combined changes. Human review remains pending.

## Shared-runner rendering readiness budget — 2026-10-11T08:36:00+05:30

The canceled exact-head CI run completed the real 4× CPU loader/animation test in 57.4 seconds; an ordinary map-ready retry completed in 35.2 seconds. Existing 25-second map-readiness assertions were too short on this runner. Only successful full-map readiness waits now allow 60 seconds; all other assertions, incomplete/error readiness guards, source identity and animation checks remain unchanged. Preserved user submission-documentation commits `19f557d` and `df57fb6`; no submission was sent. New exact-head CI must pass before merge.

The immediate CI diagnostic confirmed the expanded journey exceeded its 90-second total test budget at its third map-readiness wait after completed initial navigation, hazard/report interactions and reload (expansion.spec.ts, Demo transition). Only that three-initialization journey now allows 180 seconds total; each successful readiness wait remains 60 seconds and all behavioral assertions are unchanged. Both corresponding desktop/mobile cases passed locally in 46.4 seconds; production build, lint/types/format checks passed. No renderer implementation change was needed.

A second exact CI diagnostic showed the ten-cycle stress journey also exceeded the 90-second total budget at its final reload readiness wait; the completed cycles took 69,239 ms initially and 58,664 ms on retry, including browser actions/rendering rather than engine-only time. The suite now consistently allows 180 seconds per complete journey instead of separate overrides. Individual assertions remain 25 seconds, successful full-map readiness remains 60 seconds, and all source identity, safety and animation checks remain unchanged.
