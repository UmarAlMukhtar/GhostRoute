# Three-minute hackathon demonstration

Status: planned script for the completed P0. The current Phase 0 page cannot perform it. Before presenting, update the script to exactly match the actual built behavior and record rehearsal evidence.

| Time      | Action and narration                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:20 | Introduce GhostRoute: “Navigate to safety when ordinary routes become unsafe.” Immediately say this is a simulation, not verified emergency guidance.                                                                                |
| 0:20–0:40 | Explain the problem: shortest distance alone does not establish road availability during a disaster. Show the small Ernakulam map and visible OSM source/date.                                                                       |
| 0:40–1:00 | Select the reviewed starting preset and “Demo destination A (synthetic)”. Explain that destination availability is unknown. Calculate/display the blue original route and its distance.                                              |
| 1:00–1:25 | Click “Trigger simulated flood”. Show the amber polygon and affected road segments turning red. Explain that these are synthetic hazard conditions.                                                                                  |
| 1:25–1:55 | Show automatic green rerouting alongside the historical blue path. Point to the blocked road avoided, distance change if implemented, and the explicit availability status. Never call the result guaranteed safe.                   |
| 1:55–2:20 | Explain: OSM roads become a weighted graph; polygon intersection removes affected edges from the search; Dijkstra finds the shortest remaining path. Show the critical blocked-edge test result from the actual run if time permits. |
| 2:20–2:40 | Reset to demonstrate determinism. Briefly show or describe the tested unreachable-destination state: “No available route in this dataset and scenario.”                                                                              |
| 2:40–3:00 | Close with future possibilities: verified feeds and agency-confirmed destinations, accessible routing and offline distribution, all requiring validation. Invite contributors to the task catalog.                                   |

## Presenter preparation

- MAP-01/SIM-01 must record exact dataset version, scenario ID, origin node and destination ID that have a real alternate route. Do not choose untested points live.
- Run the full checks and build; start `pnpm start`, open the local demo before presenting and keep the disclaimer/attribution visible.
- Install dependencies and Chromium beforehand. Keep local source/query/runtime assets and a known working production build on the demo laptop.
- Perform two timed rehearsals, one with remote tiles unavailable. Record actual outcomes and system/browser details in VERIFICATION.
- Complete participant names, final implementation SHA and actual demo instructions in SUBMISSION. Confirm venue-specific submission method with organizers. Do not check human-owned confirmations automatically.

## Fallbacks

**Internet or tile service fails:** switch to the local MapLibre style rendering bundled real road GeoJSON on a plain background, with local labels and no remote fonts/sprites. The already-installed app, graph and fixed scenario run locally. Explain that the basemap is unavailable, while routing still uses the same frozen road graph. This is a rehearsal requirement for P0, not a currently delivered capability or full offline PWA.

**WebGL fails:** show textual route node/edge/distance results and run the real unit/integration tests. If available, show a locally saved recording of an actual successful rehearsal, clearly labeled prerecorded. Never fake an interactive map. Record this as a limitation.

**Data acquisition or product build is incomplete:** show only what exists, label the synthetic fixture as a mathematical routing demonstration and state that the real-map acceptance criterion is incomplete. The Phase 0 smoke page alone is not a finished emergency navigation demo.

**Hosting fails:** use the same reviewed local production build. Do not present an unverified deployment link. Push/deploy/submission actions require explicit authorization in this session.

## Evidence checklist

Record duration, commit, dataset hash, selections, scenario, route edge IDs before/after, checks run, limitations and whether remote tiles were blocked. No demo endpoint or data/source ID is invented in this document before implementation.
