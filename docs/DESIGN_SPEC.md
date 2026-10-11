# Product design specification

## Revised navigation and loading

The map remains the primary canvas. Desktop route planning stays left; the collapsible simulation panel opens right. The top bar provides a compact matching Navigation/Demo segmented page switch, Simulation and Report Incident actions. The main route has no predefined scenario selector or routing mode. `/demo` provides Hospital Road, expanding flood, unavailable-route scenarios and the guide using the same engines. Mobile switches between the route sheet and the active right-panel bottom drawer; placement dismisses the drawer temporarily to expose the map.

Search suggestions show name, locality and category with keyboard and touch selection, popular empty defaults and explicit no-result/coverage messages. Selection triggers routing automatically. Unverified report markers remain purple and cannot become confirmed closures. Report details offer deletion only for non-seed browser reports, with confirmation, cancellation, persistence errors, list/count refresh and success feedback.

One light palette applies to the interface and map. Page links share height, spacing, hover and focus states; `aria-current` identifies the active page. Show branded preparation feedback during actual dataset/map initialization and separate local-index loading feedback; hide stale suggestions during debounce. Keep synchronous route/hazard/report operations immediate, with no fake percentage, artificial delay or spinner. Attribution and the simulation safety notice stay visible. Final visual findings belong in VERIFICATION.

Status: MAP-02 and SIM-01/INT-01 implemented; actual simulation behavior is documented in FLOOD_SIMULATION.md.

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
| Simulation panel     | Disabled, ready/clear, active flood                               | “Start simulation” and “Reset simulation”; no live-condition wording                                                |
| Legend/status        | Clear simulation, flood active, no available route                | Always textual with color/pattern key; politely announce result changes                                             |
| Data error           | Missing/invalid local data                                        | Explain failure and retry; no silent fake graph or successful route                                                 |

P0 automatic rerouting happens after trigger/reset/selection changes. Disable controls only when input/data is invalid or actually loading; avoid fake spinners. If baseline and current routes match, say “No route change in this simulation” rather than claiming a detour. If no alternative exists, keep the historical line labeled and remove any green recommendation.

## Accessibility and motion

Use semantic buttons, labels, headings and native selects; add shadcn only when it supplies a needed interaction. Focus follows DOM order: origin, destination, simulation controls, map controls. Provide skip-to-controls if navigation makes it useful. Announce results via one polite live region, use an alert for actionable errors, and never steal focus on a reroute. Supply text equivalents for canvas state (selected endpoints, distance, blocked count, availability). Map clicking is an enhancement, not the only route input.

Optional line transitions/camera moves should be 150–250 ms and respect `prefers-reduced-motion`; disable motion under that preference. P0 does not need animated flood propagation. Test keyboard, touch, 360 px layout, 200% zoom, long destination names and high contrast. Record actual results in VERIFICATION.

## Content and scope

Persistent copy: “Simulation only. Hazards and destinations are demonstration data. Routes are not verified safe. Follow local authorities.” Show dataset date and attribution. Do not show invented ETA, water depth, shelter capacity, live incident count, verified badge or emergency-service affiliation. Rich side-by-side metrics/explanations, replay and extra scenarios remain P1. MAP-02 delivers the route explorer. Simulation panels/legends, automatic rerouting, comparisons and three deterministic scenarios are now implemented.

## Implemented interaction details

The primary route is solid blue with white casing. A is a circular blue origin marker; B is a dark rounded-square destination marker. A small hollow point distinguishes a click more than 2 m from its snapped node; the panel always reports a clicked selection's offset. This is not a walkable approach line. Named demo destinations are geographic test points, not verified shelters.

The interface displays distance, traversed segment count and Walking demo / shortest-distance profile; no ETA or safety score. Help uses a native modal dialog with Escape dismissal. Loading, invalid asset retry, too-far selection, disconnected route, missing tiles and WebGL failure have explicit copy. No disabled flood teaser or pretend address search is included. Future overlays retain their own layer identities and semantic colors.

Flood controls use a right floating panel on desktops at least 1200 px wide and the existing scrollable control sheet otherwise. Stage controls are manual, deterministic and reversible. Cyan fill/amber dashed outline marks flood geometry, red dashed roads show closures, dashed blue is historical, and green with white casing is currently available. Typed failures remove green lines and distances; unchanged routes explicitly say so.

## Guided Demo Mode

A header entry opens eight presenter-controlled cues in the existing route panel. Progress, next action, calculated metrics and a reset are available on narrow screens; desktop retains the simulation comparison panel. Manual controls remain below the guide and exit it when used. Native keyboard activation is supported, with a skip-to-controls link; camera movement still respects reduced motion. No automatic playback, extra modal or decorative presentation framework is introduced.

## Four workspaces

Navigate / Simulate / Reports / Demo share the same map, mobile sheet and route result. Routing mode is explicit and independent of the visible tab. Custom hazard types use icons and cyan/ochre/orange zones; red dashed roads identify closures, blue originals and green current routes retain contrast. Purple report circles have a separate source and an unverified status in the report list/details; they never masquerade as confirmed hazards. Local-only persistence and opt-in exploratory warnings remain visible. Native labelled controls, coordinate entry and focus rings complement map gestures.

## Search and dataset extent

Starting point and Destination are labelled comboboxes in the existing endpoint cards. Focusing an empty field opens **Popular places in Ernakulam** immediately. Typing filters seven offline names/aliases/localities/categories; rows show an icon, precise name and locality/category. Arrow keys cycle eligible rows, Enter selects, Escape dismisses; mouse/touch select the same rows. Clear removes only that endpoint and restores defaults; Swap exchanges selected labels and route direction. No matching place suggests map or coordinate entry. Disconnected choices are labelled unavailable rather than relocated. Catalog failure preserves map/fixture input and displays an explanation. Initial loading still uses the dataset loading state; local filtering needs no artificial spinner.

Dropdowns remain inside the panel's scroll flow. Mobile temporarily expands the bottom sheet and bounds the result list height; inputs use 16 px text and controls retain touch targets. Existing focus rings, reduced-motion camera policy and manual map selection remain. A selected OSM point's snapped offset is shown; the hollow point is not a verified walkable approach.

The demo extent uses a dashed teal outline and very light teal fill, distinct from solid blue routes and amber hazard borders. The small map label says **GhostRoute Demo Area — Ernakulam**; the legend says **Demo area · extent only**. View Demo Area fits the graph bounds. The region is a dataset rectangle: disconnected or unmapped areas inside it are not guaranteed routable. Zooming to a route may naturally put parts of the outline outside the viewport; its layers are never disabled by simulation.
