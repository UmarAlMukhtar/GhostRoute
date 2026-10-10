# Eight-hour implementation roadmap

Goal: a tested, explainable graph rerouting demonstration, not an operational emergency system. The clock is a relative team budget including Phase 0. The event itself runs from 10 October 18:30 IST to 11 October 10:00 IST; the eight-hour plan does not redefine those organizer times. Current foundation work is recorded in CHANGELOG; later phases remain unimplemented. If foundation work takes longer, subtract that time from stretch work and reduce dataset size, never drop core graph tests or the disclaimer.

| Phase                                           | Elapsed budget | Deliverable and exit gate                                                                                                                                  |
| ----------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Audit, planning, foundation                 | 00:00–00:45    | Preserve template, agree contracts/scope, verify scaffold/toolchain and contributor docs                                                                   |
| 1 — Map and geographic data                     | 00:45–02:00    | Frozen validated OSM extract, license/manifest, reviewed connected component; local MapLibre roads and tile-free fallback                                  |
| 2 — Graph and shortest path                     | 02:00–03:15    | Dijkstra passes known weighted routes, directions, invalid inputs and unreachable tests; baseline drawn from edges                                         |
| 3 — Flood and blocking                          | 03:15–04:15    | Fixed polygon blocks whole intersected physical segments and endpoints; geometric boundary tests pass                                                      |
| 4 — Automatic rerouting                         | 04:15–05:15    | State integration recomputes current path; retained baseline, unreachable and reset demonstrated                                                           |
| 5 — Polish and demonstration                    | 05:15–06:15    | Mobile/keyboard controls, labels/legend, persistent status, real-data rehearsal; no new P1 unless all P0 works                                             |
| 6 — Tests, deployment preparation, presentation | 06:15–08:00    | Integration/browser tests, production build, timing measurements, source review, two rehearsals and submission draft; deployment/push only when authorized |

## Critical path

MAP-01 frozen connected data → ROUTE-01 shortest path → SIM-01 verified closures → INT-01 state integration → QA-02 real user journey → OPS-02 rehearsal/submission. UI-01 can start alongside MAP-01 from documented contracts. ROUTE-01 can begin on the synthetic fixture while data is prepared, but cannot claim geographic success until MAP-01 passes. SIM-01 can test synthetic geometry independently. Avoid integration surprises by agreeing `src/lib/geo/types.ts` once before parallel work.

## Parallel work and ownership

This is a coordination plan, not authorization to spawn agents or create remote issues. For a team of up to four: one person owns data/routing, one map/UI, one simulation/integration and one QA/docs. Combine roles for a smaller team. A solo builder proceeds on the critical path and uses native controls; P1 is dropped. One integrator owns package/lockfile changes and shared contract edits. Contributors announce module ownership and make local coherent checkpoints about every 30 minutes when ready.

## Decision gates and cuts

- At 02:00: if extraction is not viable, shrink the bbox or use an already-reviewed real OSM snapshot with provenance. Never invent geographic edges. If no real dataset is available, report the geographical blocker and demonstrate the synthetic algorithm only as incomplete.
- At 04:15: freeze scenario/extent; it must leave a real alternative path for the main demo. Retain a separate test that deliberately disconnects the destination.
- At 05:15: if rerouting is not correct, stop polish and pair on the failing graph test. Do not mask failures with hand-drawn lines.
- At 06:15: freeze P0 features. Remove animations and extras before sacrificing errors, attribution, responsiveness or accessibility.
- Reserve the final 30 minutes for rehearsal, working-demo/code alignment and human submission review. Hosted deployment failure falls back to a local production server and recorded actual run; never invent a deployed URL.

## Foundation execution checklist

- [x] Inspect official history, all inherited files and explicit requirements before edits.
- [x] Record audit, PRD, architecture, ADRs, data strategy and scoped license choice.
- [x] Extend contributor instructions without replacing event records.
- [x] Add a single minimal app/toolchain and additive CI.
- [x] Prepare tasks, design, tests and three-minute demonstration plan.
- [x] Complete foundation verification and consistency review; see VERIFICATION for actual checks and remaining product acceptance work.

## Dependencies and unresolved decisions

Internet is needed once for dependencies, browser binaries and OSM acquisition; normal graph/scenario runtime should be local. Online basemap provider, final bbox/demo nodes, organizer-text licensing, team identities, private reporting contact, deployment target and venue submission procedure remain unresolved. No backend dependency is on the critical path. See [TASKS](TASKS.md) for independently assignable work and [DEMO_PLAN](DEMO_PLAN.md) for presenter steps.
