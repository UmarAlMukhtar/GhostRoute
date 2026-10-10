# Product design specification

Status: MAP-02 dashboard implemented; simulation-specific states below remain planned.

## Principles and composition

A calm, premium emergency-operations dashboard should prioritize the map and the next clear action. Use restrained surfaces, precise spacing and professional system sans-serif typography; no remote font dependency or decorative emergency alarm effects. Keep simulation state obvious. “Available in this simulation” is acceptable; “safe route” as a verified result is not.

Desktop (760 px and above): remaining-viewport map beneath a white brand/region/demo-status header. A 350 px floating panel holds native endpoint selects, map-pick buttons, calculate/preset actions and actual route information. Map zoom, scale and extent controls sit at the right. The attribution and safety footer remains outside the map and panel. The route camera includes panel padding.

Mobile (below 760 px): compact header and full-height map with a button-controlled, scrollable bottom sheet limited to 54% of map height. The header exposes expanded state; collapsed content is removed from keyboard navigation. Selecting a map point collapses the sheet; a completed selection or error reopens it. This supersedes the earlier stacked-controls proposal per MAP-02's requested mobile interaction. No drag gesture is required. The map viewport resizes into the space above the expanded sheet so roads and markers share the same unobscured canvas; it expands again when collapsed. Short viewports allow page scrolling. Respect safe-area insets and reduced-motion preferences.

## Visual tokens and hierarchy

| Token        | Suggested value/use                                                           |
| ------------ | ----------------------------------------------------------------------------- |
| Background   | `#F8FAFC` page, `#FFFFFF` panels                                              |
| Primary text | `#0F172A`; secondary `#475569`                                                |
| Spacing      | 4/8/12/16/24/32 px scale                                                      |
| Typography   | System sans; 24–28 px page title, 16 px controls/body, 14 px secondary labels |
| Surfaces     | 12 px corner radius, subtle border/shadow; no excessive transparency over map |
| Focus        | 3 px visible outline with offset; contrast checked against adjacent surface   |
| Targets      | At least 44 × 44 px for primary touch controls                                |

Palette values are proposals; verify text/non-text contrast in context. Map lines get a contrasting casing so basemap colors do not obscure them. Color alone never conveys status.

| Map feature             | Color                                        | Additional encoding                                            |
| ----------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Original route          | Blue `#2563EB`                               | Dashed, labeled “Original route”; historical when flood active |
| Updated available route | Green `#15803D`                              | Solid wider line, labeled “Available in simulation”            |
| Blocked roads           | Red `#B91C1C`                                | X/closure markings and blocked-count text                      |
| Hazard                  | Amber `#B45309` border                       | Light patterned/translucent fill and “Simulated flood” label   |
| Destinations            | Distinct numbered square/house-shaped marker | Name plus synthetic status; no real agency logo                |
| Origin                  | Circular marker                              | Labeled origin, distinct from destination shape                |

Order: base roads, hazard fill, baseline, blocked roads, updated route, origin/destinations. Keep selected markers above fill. Preserve route geometry; visual smoothing must not invent roads or bypass blocked edges.

## Component states and interactions

| Component            | States                                                            | Interaction and feedback                                                                                            |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| MapView              | Loading, ready, tiles failed, WebGL failed                        | Pan/zoom/recenter; click origin; network tile failure offers local road style; WebGL failure shows clear limitation |
| Origin selector      | Empty, preset selected, snapped, outside radius                   | Keyboard presets; map click uses 100 m maximum snap, show resulting selection and snap distance                     |
| Destination selector | Empty, synthetic selected, unavailable                            | Labeled native select; unknown availability visible; flooded endpoint reported as unreachable                       |
| Route panel          | No selection, baseline found, updated found, unreachable, invalid | Show distance in meters/km only; status text and blocked-edge count; baseline remains historical                    |
| Simulation panel     | Disabled, ready/clear, active flood                               | “Trigger simulated flood” and “Reset simulation”; no live-condition wording                                         |
| Legend/status        | Clear simulation, flood active, no available route                | Always textual with color/pattern key; politely announce result changes                                             |
| Data error           | Missing/invalid local data                                        | Explain failure and retry; no silent fake graph or successful route                                                 |

P0 automatic rerouting happens after trigger/reset/selection changes. Disable controls only when input/data is invalid or actually loading; avoid fake spinners. If baseline and current routes match, say “No route change in this simulation” rather than claiming a detour. If no alternative exists, keep the historical line labeled and remove any green recommendation.

## Accessibility and motion

Use semantic buttons, labels, headings and native selects; add shadcn only when it supplies a needed interaction. Focus follows DOM order: origin, destination, simulation controls, map controls. Provide skip-to-controls if navigation makes it useful. Announce results via one polite live region, use an alert for actionable errors, and never steal focus on a reroute. Supply text equivalents for canvas state (selected endpoints, distance, blocked count, availability). Map clicking is an enhancement, not the only route input.

Optional line transitions/camera moves should be 150–250 ms and respect `prefers-reduced-motion`; disable motion under that preference. P0 does not need animated flood propagation. Test keyboard, touch, 360 px layout, 200% zoom, long destination names and high contrast. Record actual results in VERIFICATION.

## Content and scope

Persistent copy: “Simulation only. Hazards and destinations are demonstration data. Routes are not verified safe. Follow local authorities.” Show dataset date and attribution. Do not show invented ETA, water depth, shelter capacity, live incident count, verified badge or emergency-service affiliation. Rich side-by-side metrics/explanations, replay and extra scenarios remain P1. MAP-02 delivers the route explorer. Simulation panels/legends, automatic rerouting and hazard status remain SIM-01/INT-01.

## Implemented interaction details

The primary route is solid blue with white casing. A is a circular blue origin marker; B is a dark rounded-square destination marker. A small hollow point distinguishes a click more than 2 m from its snapped node; the panel always reports a clicked selection's offset. This is not a walkable approach line. Named demo destinations are geographic test points, not verified shelters.

The interface displays distance, traversed segment count and Walking demo / shortest-distance profile; no ETA or safety score. Help uses a native modal dialog with Escape dismissal. Loading, invalid asset retry, too-far selection, disconnected route, missing tiles and WebGL failure have explicit copy. No disabled flood teaser or pretend address search is included. Future overlays retain their own layer identities and semantic colors.
