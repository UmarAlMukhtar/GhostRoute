# GhostRoute product requirements

## Kochi expansion requirements — current implementation

The primary experience is user-controlled walking navigation across Kochi–Ernakulam. Origin and destination use a real local OSM name index and coordinate input; both selections automatically recalculate routes. Popular defaults are suggestions only. Desktop navigation stays left, independent simulated disasters open right, Report Incident opens a dedicated reporting panel, and predefined scenarios live at `/demo`. Mobile uses a dismissible bottom drawer.

The interface and map use one light theme with matching Navigation/Demo page links and feedback for actual map/data/search initialization. Reports remain unverified browser-local observations; user-created local reports can be deleted after confirmation. No shared ownership/authentication or authoritative closure feed exists. The map boundary is the actual graph extent, not an assertion that every enclosed location is mapped or connected.

49,740 nodes / 115,412 directed edges / 57,706 physical segments. Actual whole-way graph extent is `[76.2148797, 9.8510819, 76.4365348, 10.1499696]` (west, south, east, north). Search indexes 12,409 real OSM-derived names, including Edappally Market, Vyttila Mobility Hub, Kakkanad Water Metro, Fort Kochi landmarks, Aluva, localities and named roads. Broad cross-region routing and Hospital Road regression are required checks. Older MVP sections below describe the original baseline and historical prioritization.

Status: interactive multi-hazard routing and explicitly browser-local unverified reporting extend the completed map/routing/flood demonstration; final deployment and human acceptance remain separate. See VERIFICATION for executed evidence.

## Executive summary

**Navigate to safety when ordinary routes become unsafe.** GhostRoute is an open-source disaster navigation and evacuation simulation for a small Kochi–Ernakulam road network. An eight-hour build should demonstrate an actual shortest path changing when a deterministic simulated flood blocks road edges. The tagline is a vision; the interface must say that routes are not guaranteed safe.

## Problem and existing solutions

Ordinary route planning commonly optimizes distance/time using mapped roads and traffic. Mapping platforms can support closures, but a normal route is not evidence of current disaster safety. GhostRoute demonstrates a transparent, locally reproducible graph update, without claiming that existing commercial tools never consider disasters or closures. GIS tools can analyze hazards but require preparation; this project packages one understandable interactive example. It is not a replacement for emergency authorities.

## Vision, users and personas

Enable people to understand how changed road availability affects access to an emergency destination. Primary hackathon users are judges, volunteer coordinators and contributors exploring simulated decisions. Actual evacuees are not the MVP's operational users.

| Persona                                            | Need                                              | Boundary                                            |
| -------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| Anu, volunteer coordinator (fictional)             | Compare paths before/after a simulated closure    | Cannot dispatch responders from this demo           |
| Ravi, resident viewing a demonstration (fictional) | Understand why a route changes                    | No claim of live hazard or shelter status           |
| Sam, new contributor (fictional)                   | Reproduce tests and implement an independent task | No paid API keys or specialist GIS service required |

## User stories

1. As a viewer I select an origin and labeled demo destination and see a shortest path on real mapped roads.
2. As a coordinator I trigger a fixed simulated flood and see intersected road segments marked blocked.
3. As a viewer I see an automatically recomputed available path alongside the original, or a clear unreachable message.
4. As a keyboard user I select named preset origins/destinations and operate the simulation without a map click.
5. As a contributor I can run a deterministic graph test and explain every route edge.
6. As a presenter I can demonstrate local road geometry if internet tiles fail after local setup.

## Functional requirements and priority

| Priority | Features                                                                                | Acceptance boundary                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0       | Interactive Ernakulam map; geographic road network                                      | Local OSM-derived road GeoJSON over MapLibre, with attribution and visible dataset date                                                          |
| P0       | Origin selection; emergency destination selection                                       | Map click snaps to an eligible node within 100 m; keyboard presets use validated nodes; destination list uses labeled synthetic points           |
| P0       | Shortest-path routing                                                                   | Deterministic Dijkstra over actual weighted graph edges, walking-distance demonstration profile                                                  |
| P0       | Flood-zone simulation; road-edge blocking                                               | Fixed valid polygon, conservative intersection including boundary contact; both directions of an affected physical segment blocked               |
| P0       | Dynamic rerouting; original-versus-updated route visualization                          | Recompute on trigger/reset/selection change; retain original route for comparison, label old route as unavailable where blocked                  |
| P0       | Unreachable-destination handling                                                        | Never draw a substitute straight line; show no available route in this dataset/scenario                                                          |
| P0       | Responsive interface; simulation disclaimer                                             | Keyboard controls, readable mobile layout, always-visible simulation status and safety statement                                                 |
| P1       | Animated flood propagation; multiple disaster scenarios                                 | Only after all P0 checks pass; fixed logical steps, no random wall-clock dependence                                                              |
| P1       | Accessibility-aware routing; alternative shelter suggestions                            | Requires reliable access attributes; do not imply wheelchair suitability from missing data                                                       |
| P1       | Route comparison; route-change explanations; simulation replay                          | P0 has simultaneous route lines and blocked-edge count; detailed metrics/explanations, timeline playback and richer comparisons are stretch work |
| P2       | Community road closure reporting; verified disaster feeds; offline functionality        | Needs moderation, provenance, freshness, distribution and safety design                                                                          |
| P2       | Real emergency-service integrations; live shelter availability                          | Needs explicit agency collaboration and validation                                                                                               |
| P2       | Historical flood analysis; predictive hazard modeling; multi-user incident coordination | Separate post-hackathon research and backend work                                                                                                |

## MVP boundaries and geography

The implemented MVP uses a small frozen mainland Ernakulam extract, one distance-based walking profile, three deterministic illustrative flood scenarios and two named demo endpoints. Runtime geometry bounds are west 76.2732579, south 9.9638296, east 76.2936855, north 9.9897189. The graph retains 12 actual connected components; it never fabricates links across disconnected roads. The Hospital Road pair belongs to a connected component with verified alternatives. These bounds are dataset coverage, not administrative or hazard boundaries. See DATA_STRATEGY for source query bounds and access assumptions.

No authentication, database, live feeds, turn-by-turn guidance, vehicle navigation, travel-time promises, geolocation tracking, notification system or full-city routing. Local road fixtures support an already-installed demo, not a complete offline product. Phase 0 was documentation/tooling; subsequent milestones implement the product.

## Disaster and routing behavior

Initial selection computes a baseline route against an empty blocked set. Trigger flood derives blocked edges from immutable geometry, then routes with those edges excluded; reset clears the set and restores the same baseline. Changing selections during a flood computes both their new baseline and current available route. A destination/origin inside the flood polygon is unavailable even if a zero-edge route would otherwise exist. Identical origin/destination outside the hazard yields zero distance. Unsupported/malformed data is an error, not unreachable. Ties use stable node/edge ID ordering. See the architecture for contracts.

## Non-functional and performance requirements

Offline unit tests and deterministic data; no runtime Overpass request. Target at most 5,000 nodes/12,000 directed edges and at most 3 MB uncompressed combined graph/road geometry. Target shortest path under 100 ms and flood-to-updated-result under 300 ms at p95 across 30 runs on a recorded demo laptop; first usable map under 3 s on warm local data, excluding external tile latency. These are targets to measure, not achieved benchmarks. Reduce geography before adding workers or indexes.

## Accessibility and UI/UX

Map-first dashboard with concise controls, persistent simulation badge, original blue path, updated green path, red blocked segments and amber flood boundary. Use labels, dashed/solid patterns and textual status so color is never the only cue. Minimum WCAG 2.2 AA target: 4.5:1 normal text, visible focus, logical keyboard order, status live region and usable 200% zoom. Minimum 44 px primary touch targets. Map information also appears in text. Honor reduced motion. Do not auto-move keyboard focus when routes change. At 360 px width, panels must not cover attribution or the active controls.

## Safety and reliability limitations

All floods are simulated; all MVP shelters are synthetic demo destinations with unknown capacity/accessibility/status. An unblocked edge only means the model did not exclude it. OSM can be incomplete, stale or wrong; the 2D flood model ignores depth, flow, elevation and structural conditions and may overblock bridges. Routes remain within a small extract and may miss alternatives outside it. Display: “Simulation only. Hazards and destinations are demonstration data. Routes are not verified safe. Follow local authorities.”

## Acceptance criteria and success metrics

- A fresh clone installs and passes lint, strict types, unit tests, production build and browser tests without credentials.
- OSM source, extraction timestamp, query, bounds, conversion policy, dataset hash and license are recorded; geometry is real and not hand-drawn.
- Every result uses connected graph edges; none belongs to the blocked set; distances equal edge-weight sums.
- Synthetic fixture: baseline A–B–D = 200 m; blocking B–D yields A–C–D = 300 m; blocking both arrivals to D yields unreachable.
- A reviewed real-data scenario changes a route through a genuine alternative road path after polygon intersection, with both routes visible.
- Main journey works by keyboard and at desktop/mobile viewport sizes; errors and unreachable states are distinguishable.
- Presenter completes a three-minute demonstration twice, including reset and tile-failure fallback; record observed timings and failures.

Metrics: 100% of critical routing assertions pass; two successful rehearsals; no external request for routing/scenario data; no claim of verified safety. Product completion is separate from foundation completion.

## Risks and dependencies

Data connectivity and access tags are the critical path; a polygon might disconnect all useful routes. Network extraction may fail, map tiles may be unavailable, WebGL may be unsupported, or dependencies may not install at the venue. Freeze the extract early, preinstall browser binaries, keep a local geometry-only map and record a real rehearsal. The code license is MIT for new work; organizer text licensing remains unresolved. Venue-specific submission details and participants require human input.

## Definition of Done

Foundation: audit and requested docs complete, inherited requirements preserved, minimal smoke scaffold and checks executed honestly, local milestone commit with logs, no push. MVP: every P0 acceptance criterion implemented and tested; measured performance recorded; sources and disclaimer visible; code, README, logs and submission agree; team review and a working demo prepared. Deployment, push and submission require separate authorization.

## Post-hackathon roadmap

Validate geographic access rules with domain experts, expand test regions, add verified data provenance/freshness and shelter partnerships, then consider offline distribution and a backend for moderated reports. Predictive hazards need separate scientific validation and must remain distinguishable from observations.

## Interactive platform scope update

The user-authorized next milestone extends the original hackathon MVP: arbitrary snapped endpoints; editable flood, landslide and fire exclusion zones; click-to-block roads; multiple hazards; automatic route comparison; and separate unverified incident reporting. These are now P0. Filters, dragging, swapping, coordinate entry, explicit one-shot geolocation and opt-in exploratory report routing are implemented P1. Seven-place offline search and a visible dataset extent are implemented; shared persistence and live address geocoding remain P1 work; uploads/moderation/official feeds remain P2. Earlier fixed-demo/no-report boundaries describe the original MVP, not this extension.

Acceptance: create several hazards on real geometry, remove one and recompute; submit an unverified report; reset simulation without losing the report; refresh to reload it locally. No report is automatically a verified closure. See [PLATFORM](PLATFORM.md) for exact modes, limits, safeguards and stop conditions.
