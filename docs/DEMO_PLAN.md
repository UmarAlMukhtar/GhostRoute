# Three-minute hackathon demonstration

Status: implemented local demo with an eight-step guided Demo Mode, covered by desktop/mobile browser tests. A human timed rehearsal and deployment verification remain pending.

| Time      | Action and narration                                                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:20 | Introduce GhostRoute: “Navigate to safety when ordinary routes become unsafe.” Immediately say this is a simulation, not verified emergency guidance.                                                                                                |
| 0:20–0:40 | Explain the problem: shortest distance alone does not establish road availability during a disaster. Show the small Ernakulam map and visible OSM source/date.                                                                                       |
| 0:40–1:00 | Enter “Demo Mode”, then “Load Hospital Road route”: Park Avenue / Hospital Road junction to Jos Junction / Durbar Hall Road, 944.3 m. These are unverified demo destinations.                                                                        |
| 1:00–1:25 | Click “Simulate Hospital Road flood”. Show the cyan polygon with amber boundary and 5 red blocked segments. Explain that flood conditions are illustrative.                                                                                          |
| 1:25–1:55 | Show automatic green rerouting alongside the historical blue path. Point to the 1.41 km detour and +49.4% distance change. Click “Explore expanding flood” and advance twice to show 27 closures and 1.73 km. Never call the result guaranteed safe. |
| 1:55–2:20 | Explain: OSM roads become a weighted graph; polygon intersection removes affected edges from the search; Dijkstra finds the shortest remaining path. Show the critical blocked-edge test result from the actual run if time permits.                 |
| 2:20–2:40 | Click “Show unavailable route” (21 closures), then “Restore original route” to restore 944.3 m: “No available route in this dataset and scenario.”                                                                                                   |
| 2:40–3:00 | Close with future possibilities: verified feeds and agency-confirmed destinations, accessible routing and offline distribution, all requiring validation. Invite contributors to the task catalog.                                                   |

## Presenter preparation

- Use the exact version, scenario IDs and endpoints recorded in FLOOD_SIMULATION.md. Do not choose untested points live.
- Run the full checks and build; start `pnpm start`, open the local demo before presenting and keep the disclaimer/attribution visible.
- Install dependencies and Chromium beforehand. Keep local source/query/runtime assets and a known working production build on the demo laptop.
- Perform two timed rehearsals, one with remote tiles unavailable. Record actual outcomes and system/browser details in VERIFICATION.
- Complete participant names, final implementation SHA and actual demo instructions in SUBMISSION. Confirm venue-specific submission method with organizers. Do not check human-owned confirmations automatically.

## Fallbacks

**Internet or tile service fails:** switch to the local MapLibre style rendering bundled real road GeoJSON on a plain background, with local labels and no remote fonts/sprites. The already-installed app, graph and fixed scenario run locally. Explain that the basemap is unavailable, while routing still uses the same frozen road graph. This fallback is implemented and browser-tested; a live timed rehearsal remains pending. It is not a full offline PWA.

**WebGL fails:** show textual route node/edge/distance results and run the real unit/integration tests. If available, show a locally saved recording of an actual successful rehearsal, clearly labeled prerecorded. Never fake an interactive map. Record this as a limitation.

**Data acquisition or product build is incomplete:** show only what exists, label the synthetic fixture as a mathematical routing demonstration and state that the real-map acceptance criterion is incomplete. The Phase 0 smoke page alone is not a finished emergency navigation demo.

**Hosting fails:** use the same reviewed local production build. Do not present an unverified deployment link. Push/deploy/submission actions require explicit authorization in this session.

## Evidence checklist

Record duration, commit, dataset hash, selections, scenario, route edge IDs before/after, checks run, limitations and whether remote tiles were blocked. Scenarios and expected outcomes are recorded in FLOOD_SIMULATION.md; timed rehearsal evidence must be recorded only after actually performing it.

## Guided presenter controls

Use header **Demo Mode** to enter or restart. Each step displays a concise cue and calculated metrics. The next button advances only on presenter input; there is no automatic timer. **Reset demo** clears endpoints/closures and fits the region. **Exit Demo Mode** retains the current map state. Manual endpoint/scenario actions exit the guide so cues never describe a different scenario. See [PITCH_SCRIPT](PITCH_SCRIPT.md) for narration and [DEPLOYMENT](DEPLOYMENT.md) for the exact local production fallback.

Human rehearsal gate: run this twice in three minutes or less, with at least one run where remote tiles are unavailable. Record observed duration, hardware, browser and actual implementation SHA; automated tests do not satisfy this human presentation gate.
